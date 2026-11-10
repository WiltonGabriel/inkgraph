import Database from "better-sqlite3";
import type {
  BaseEntity,
  LoreDocument,
  Relationship,
  VaultDocumentRecord,
  VaultParseFailure,
  VaultSection,
} from "@inkgraph/domain";
import { InkGraphError } from "@inkgraph/domain";
import {
  LORE_DB_SCHEMA_SQL,
  type EpistemicStateResult,
  type IndexerOptions,
  type TimelineEntry,
} from "./schema";
import {
  queryChronologicalTimeline,
  queryEntityEpistemicState,
} from "./epistemicQueries";

export type { EpistemicStateResult, IndexerOptions, TimelineEntry };

export class LoreDatabase {
  private readonly db: Database.Database;

  constructor(options: IndexerOptions = { inMemory: true }) {
    this.db = options.inMemory
      ? new Database(":memory:")
      : new Database(options.dbPath ?? ":memory:");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.exec(LORE_DB_SCHEMA_SQL);
    this.ensureOptionalEntityColumns();
  }

  private ensureOptionalEntityColumns(): void {
    const columns = this.db.prepare(`PRAGMA table_info(entities)`).all() as { name: string }[];
    const colSet = new Set(columns.map((c) => c.name));
    if (!colSet.has("archived_at")) {
      this.db.exec(`ALTER TABLE entities ADD COLUMN archived_at TEXT`);
    }
    if (!colSet.has("fractional_order")) {
      this.db.exec(`ALTER TABLE entities ADD COLUMN fractional_order TEXT`);
    }
  }

  public upsertEntity(doc: LoreDocument): void {
    const { frontmatter, markdownBody, filePath } = doc;
    const now = Date.now();

    const insertEntityStmt = this.db.prepare(`
      INSERT INTO entities (id, type, subtype, name, status, revealed_at_scene, archived_at, fractional_order, file_path, body, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        subtype = excluded.subtype,
        name = excluded.name,
        status = excluded.status,
        revealed_at_scene = excluded.revealed_at_scene,
        archived_at = excluded.archived_at,
        fractional_order = excluded.fractional_order,
        file_path = excluded.file_path,
        body = excluded.body,
        updated_at = excluded.updated_at
    `);

    const deleteAliasesStmt = this.db.prepare(`DELETE FROM entity_aliases WHERE entity_id = ?`);
    const insertAliasStmt = this.db.prepare(`
      INSERT OR REPLACE INTO entity_aliases (alias_norm, alias_original, entity_id)
      VALUES (?, ?, ?)
    `);

    const deleteTagsStmt = this.db.prepare(`DELETE FROM entity_tags WHERE entity_id = ?`);
    const insertTagStmt = this.db.prepare(`INSERT OR REPLACE INTO entity_tags (entity_id, tag) VALUES (?, ?)`);

    const deleteRelationshipsStmt = this.db.prepare(`DELETE FROM relationships WHERE source_id = ?`);
    const insertRelationshipStmt = this.db.prepare(`
      INSERT INTO relationships (source_id, target_id, relation, since_scene, until_scene, sentiment, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const deleteSecretsStmt = this.db.prepare(`DELETE FROM entity_secrets WHERE entity_id = ?`);
    const insertSecretStmt = this.db.prepare(`INSERT INTO entity_secrets (entity_id, secret) VALUES (?, ?)`);

    const deleteKnownByStmt = this.db.prepare(`DELETE FROM entity_known_by WHERE entity_id = ?`);
    const insertKnownByStmt = this.db.prepare(`INSERT OR REPLACE INTO entity_known_by (entity_id, known_by_id) VALUES (?, ?)`);

    const deleteFtsStmt = this.db.prepare(`DELETE FROM lore_fts WHERE entity_id = ?`);
    const insertFtsStmt = this.db.prepare(`
      INSERT INTO lore_fts (entity_id, name, aliases, body, tags)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      insertEntityStmt.run(
        frontmatter.id,
        frontmatter.type,
        frontmatter.subtype ?? null,
        frontmatter.name,
        frontmatter.status,
        frontmatter.epistemic.revealed_at_scene ?? null,
        frontmatter.archived_at ?? null,
        frontmatter.fractional_order ?? null,
        filePath,
        markdownBody,
        now
      );

      deleteAliasesStmt.run(frontmatter.id);
      insertAliasStmt.run(frontmatter.name.toLowerCase(), frontmatter.name, frontmatter.id);
      for (const alias of frontmatter.aliases) {
        insertAliasStmt.run(alias.toLowerCase(), alias, frontmatter.id);
      }

      deleteTagsStmt.run(frontmatter.id);
      for (const tag of frontmatter.tags) {
        insertTagStmt.run(frontmatter.id, tag.toLowerCase());
      }

      deleteRelationshipsStmt.run(frontmatter.id);
      for (const rel of frontmatter.relationships) {
        insertRelationshipStmt.run(
          frontmatter.id,
          rel.target,
          rel.relation,
          rel.since_scene ?? null,
          rel.until_scene ?? null,
          rel.sentiment,
          rel.notes ?? null
        );
      }

      deleteSecretsStmt.run(frontmatter.id);
      for (const secret of frontmatter.epistemic.secrets_kept) {
        insertSecretStmt.run(frontmatter.id, secret);
      }

      deleteKnownByStmt.run(frontmatter.id);
      for (const viewer of frontmatter.epistemic.known_by) {
        insertKnownByStmt.run(frontmatter.id, viewer);
      }

      deleteFtsStmt.run(frontmatter.id);
      insertFtsStmt.run(
        frontmatter.id,
        frontmatter.name,
        frontmatter.aliases.join(" "),
        markdownBody,
        frontmatter.tags.join(" ")
      );
    });

    transaction();
  }

  public deleteEntity(id: string): boolean {
    const deleteEntityStmt = this.db.prepare(`DELETE FROM entities WHERE id = ?`);
    const deleteFtsStmt = this.db.prepare(`DELETE FROM lore_fts WHERE entity_id = ?`);

    const tx = this.db.transaction(() => {
      deleteFtsStmt.run(id);
      const info = deleteEntityStmt.run(id);
      return info.changes > 0;
    });

    return tx();
  }

  public getEntityByIdOrAlias(query: string): (BaseEntity & { body: string; filePath: string }) | null {
    const trimmed = query.trim();
    if (!trimmed) return null;

    let row = this.db.prepare(`SELECT * FROM entities WHERE id = ?`).get(trimmed) as any;

    if (!row) {
      const aliasMatches = this.db
        .prepare(`SELECT DISTINCT entity_id FROM entity_aliases WHERE alias_norm = ?`)
        .all(trimmed.toLowerCase()) as { entity_id: string }[];

      if (aliasMatches.length === 0) {
        return null;
      }

      if (aliasMatches.length > 1) {
        const matchedIds = aliasMatches.map((m) => m.entity_id);
        throw new InkGraphError(
          "ambiguous",
          `Alias '${trimmed}' matches multiple entities: ${matchedIds.join(", ")}`,
          { query: trimmed, matches: matchedIds }
        );
      }

      const targetId = aliasMatches[0]!.entity_id;
      row = this.db.prepare(`SELECT * FROM entities WHERE id = ?`).get(targetId) as any;
    }

    if (!row) return null;

    const targetId: string = row.id;

    const aliases = (
      this.db
        .prepare(`SELECT alias_original FROM entity_aliases WHERE entity_id = ? AND alias_norm != ?`)
        .all(targetId, row.name.toLowerCase()) as { alias_original: string }[]
    ).map((a) => a.alias_original);

    const tags = (
      this.db.prepare(`SELECT tag FROM entity_tags WHERE entity_id = ?`).all(targetId) as { tag: string }[]
    ).map((t) => t.tag);

    const rawRelationships = this.db
      .prepare(
        `SELECT target_id as target, relation, since_scene, until_scene, sentiment, notes FROM relationships WHERE source_id = ?`
      )
      .all(targetId) as any[];

    const relationships: Relationship[] = rawRelationships.map((r) => ({
      target: r.target,
      relation: r.relation,
      ...(r.since_scene ? { since_scene: r.since_scene } : {}),
      ...(r.until_scene ? { until_scene: r.until_scene } : {}),
      sentiment: r.sentiment,
      ...(r.notes ? { notes: r.notes } : {}),
    }));

    const secrets = (
      this.db.prepare(`SELECT secret FROM entity_secrets WHERE entity_id = ?`).all(targetId) as {
        secret: string;
      }[]
    ).map((s) => s.secret);

    const known_by = (
      this.db.prepare(`SELECT known_by_id FROM entity_known_by WHERE entity_id = ?`).all(targetId) as {
        known_by_id: string;
      }[]
    ).map((k) => k.known_by_id);

    return {
      id: row.id,
      type: row.type,
      subtype: row.subtype ?? undefined,
      name: row.name,
      aliases,
      status: row.status,
      tags,
      relationships,
      epistemic: {
        secrets_kept: secrets,
        known_by,
        ...(row.revealed_at_scene ? { revealed_at_scene: row.revealed_at_scene } : {}),
      },
      body: row.body,
      filePath: row.file_path,
    };
  }

  public listEntities(filter?: {
    type?: string;
    tag?: string;
    status?: string;
    includeArchived?: boolean;
  }): {
    id: string;
    name: string;
    type: string;
    status: string;
  }[] {
    let query = `
      SELECT DISTINCT e.id, e.name, e.type, e.status 
      FROM entities e
      LEFT JOIN entity_tags t ON e.id = t.entity_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!filter?.includeArchived) {
      query += ` AND e.archived_at IS NULL`;
    }
    if (filter?.type) {
      query += ` AND e.type = ?`;
      params.push(filter.type);
    }
    if (filter?.status) {
      query += ` AND e.status = ?`;
      params.push(filter.status);
    }
    if (filter?.tag) {
      query += ` AND t.tag = ?`;
      params.push(filter.tag.toLowerCase());
    }

    query += ` ORDER BY COALESCE(e.fractional_order, e.name) ASC, e.name ASC`;
    return this.db.prepare(query).all(...params) as any[];
  }

  public search(query: string, limit = 20): { entity_id: string; name: string; snippet: string }[] {
    const tokens = query.trim().match(/[\p{L}\p{N}_]+/gu) ?? [];
    if (tokens.length === 0) return [];

    const safeFtsQuery = tokens.map((token) => `"${token}"*`).join(" ");

    const rows = this.db
      .prepare(`
        SELECT entity_id, name, snippet(lore_fts, 3, '<b>', '</b>', '...', 15) as snippet
        FROM lore_fts
        WHERE lore_fts MATCH ?
        LIMIT ?
      `)
      .all(safeFtsQuery, limit) as any[];

    return rows;
  }

  public queryEpistemicState(entityIdOrAlias: string, sceneId?: string): EpistemicStateResult {
    const entity = this.getEntityByIdOrAlias(entityIdOrAlias);
    if (!entity) {
      throw new InkGraphError("not_found", `Entity '${entityIdOrAlias}' not found.`, {
        query: entityIdOrAlias,
      });
    }
    return queryEntityEpistemicState(this.db, entity, sceneId);
  }

  public getTimeline(fromScene?: string, toScene?: string): TimelineEntry[] {
    return queryChronologicalTimeline(this.db, fromScene, toScene);
  }

  public getAllRelationships(): { source: string; target: string; relation: string; sentiment: number }[] {
    return this.db
      .prepare(`
        SELECT source_id as source, target_id as target, relation, sentiment 
        FROM relationships
      `)
      .all() as any[];
  }

  public upsertVaultDocument(doc: VaultDocumentRecord): void {
    const upsertStmt = this.db.prepare(`
      INSERT INTO vault_documents (
        id, section, title, status, file_path, body, metadata_json, archived_at, fractional_order, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        section = excluded.section,
        title = excluded.title,
        status = excluded.status,
        file_path = excluded.file_path,
        body = excluded.body,
        metadata_json = excluded.metadata_json,
        archived_at = excluded.archived_at,
        fractional_order = excluded.fractional_order,
        updated_at = excluded.updated_at
    `);
    const deleteFts = this.db.prepare(`DELETE FROM vault_documents_fts WHERE doc_id = ?`);
    const insertFts = this.db.prepare(`
      INSERT INTO vault_documents_fts (doc_id, section, title, body)
      VALUES (?, ?, ?, ?)
    `);

    const tx = this.db.transaction(() => {
      upsertStmt.run(
        doc.id,
        doc.section,
        doc.title,
        doc.status,
        doc.filePath,
        doc.body,
        doc.metadataJson,
        doc.archivedAt,
        doc.fractionalOrder,
        doc.updatedAt
      );
      deleteFts.run(doc.id);
      insertFts.run(doc.id, doc.section, doc.title, doc.body);
    });
    tx();
  }

  public listVaultDocuments(filter?: {
    section?: VaultSection;
    includeArchived?: boolean;
  }): VaultDocumentRecord[] {
    let query = `
      SELECT id, section, title, status, file_path as filePath, body,
             metadata_json as metadataJson, archived_at as archivedAt,
             fractional_order as fractionalOrder, updated_at as updatedAt
      FROM vault_documents
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filter?.section) {
      query += ` AND section = ?`;
      params.push(filter.section);
    }
    if (!filter?.includeArchived) {
      query += ` AND archived_at IS NULL`;
    }

    query += ` ORDER BY COALESCE(fractional_order, file_path) ASC, title ASC`;
    return this.db.prepare(query).all(...params) as VaultDocumentRecord[];
  }

  public searchVaultDocuments(
    query: string,
    section?: VaultSection,
    limit = 20
  ): { doc_id: string; section: VaultSection; title: string; snippet: string }[] {
    const tokens = query.trim().match(/[\p{L}\p{N}_]+/gu) ?? [];
    if (tokens.length === 0) return [];
    const safeFtsQuery = tokens.map((token) => `"${token}"*`).join(" ");

    let sql = `
      SELECT doc_id, section, title, snippet(vault_documents_fts, 3, '<b>', '</b>', '...', 15) as snippet
      FROM vault_documents_fts
      WHERE vault_documents_fts MATCH ?
    `;
    const params: unknown[] = [safeFtsQuery];

    if (section) {
      sql += ` AND section = ?`;
      params.push(section);
    }
    sql += ` LIMIT ?`;
    params.push(limit);

    return this.db.prepare(sql).all(...params) as {
      doc_id: string;
      section: VaultSection;
      title: string;
      snippet: string;
    }[];
  }

  public clearParseFailures(): void {
    this.db.prepare(`DELETE FROM vault_parse_errors`).run();
  }

  public recordParseFailure(failure: VaultParseFailure): void {
    this.db
      .prepare(`
        INSERT INTO vault_parse_errors (file_path, section, error, recorded_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(file_path) DO UPDATE SET
          section = excluded.section,
          error = excluded.error,
          recorded_at = excluded.recorded_at
      `)
      .run(failure.filePath, failure.section, failure.error, Date.now());
  }

  public getParseFailures(): VaultParseFailure[] {
    return this.db
      .prepare(`SELECT file_path as filePath, section, error FROM vault_parse_errors ORDER BY recorded_at DESC`)
      .all() as VaultParseFailure[];
  }

  public close(): void {
    this.db.close();
  }
}
