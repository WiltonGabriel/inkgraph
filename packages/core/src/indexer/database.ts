import Database from "better-sqlite3";
import type { BaseEntity, LoreDocument, Relationship } from "../domain/entity";

export interface IndexerOptions {
  readonly inMemory?: boolean;
  readonly dbPath?: string;
}

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

    this.db.exec(`
      -- Core Entities Table
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        subtype TEXT,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'canon',
        file_path TEXT NOT NULL,
        body TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Aliases lookup table (fast title/nickname resolution)
      CREATE TABLE IF NOT EXISTS entity_aliases (
        alias TEXT NOT NULL PRIMARY KEY,
        entity_id TEXT NOT NULL,
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      -- Tags
      CREATE TABLE IF NOT EXISTS entity_tags (
        entity_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (entity_id, tag),
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      -- Graph Edges (Relationships)
      CREATE TABLE IF NOT EXISTS relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relation TEXT NOT NULL,
        since_scene TEXT,
        until_scene TEXT,
        sentiment REAL DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (source_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      -- Epistemic tracking (Secrets and Awareness)
      CREATE TABLE IF NOT EXISTS entity_secrets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_id TEXT NOT NULL,
        secret TEXT NOT NULL,
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS entity_known_by (
        entity_id TEXT NOT NULL,
        known_by_id TEXT NOT NULL,
        PRIMARY KEY (entity_id, known_by_id),
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      -- Full-Text Search FTS5 Virtual Table
      CREATE VIRTUAL TABLE IF NOT EXISTS lore_fts USING fts5(
        entity_id UNINDEXED,
        name,
        aliases,
        body,
        tags
      );
    `);
  }

  public upsertEntity(doc: LoreDocument): void {
    const { frontmatter, markdownBody, filePath } = doc;
    const now = Date.now();

    const insertEntityStmt = this.db.prepare(`
      INSERT INTO entities (id, type, subtype, name, status, file_path, body, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        subtype = excluded.subtype,
        name = excluded.name,
        status = excluded.status,
        file_path = excluded.file_path,
        body = excluded.body,
        updated_at = excluded.updated_at
    `);

    const deleteAliasesStmt = this.db.prepare(`DELETE FROM entity_aliases WHERE entity_id = ?`);
    const insertAliasStmt = this.db.prepare(`INSERT OR REPLACE INTO entity_aliases (alias, entity_id) VALUES (?, ?)`);

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
        filePath,
        markdownBody,
        now
      );

      // Aliases
      deleteAliasesStmt.run(frontmatter.id);
      insertAliasStmt.run(frontmatter.name.toLowerCase(), frontmatter.id);
      for (const alias of frontmatter.aliases) {
        insertAliasStmt.run(alias.toLowerCase(), frontmatter.id);
      }

      // Tags
      deleteTagsStmt.run(frontmatter.id);
      for (const tag of frontmatter.tags) {
        insertTagStmt.run(frontmatter.id, tag.toLowerCase());
      }

      // Relationships
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

      // Epistemic (secrets and who knows)
      deleteSecretsStmt.run(frontmatter.id);
      for (const secret of frontmatter.epistemic.secrets_kept) {
        insertSecretStmt.run(frontmatter.id, secret);
      }

      deleteKnownByStmt.run(frontmatter.id);
      for (const viewer of frontmatter.epistemic.known_by) {
        insertKnownByStmt.run(frontmatter.id, viewer);
      }

      // FTS5
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

  public getEntityByIdOrAlias(query: string): (BaseEntity & { body: string; filePath: string }) | null {
    const trimmed = query.trim();
    const aliasMatch = this.db.prepare(`
      SELECT entity_id FROM entity_aliases WHERE alias = ?
    `).get(trimmed.toLowerCase()) as { entity_id: string } | undefined;

    const targetId = aliasMatch ? aliasMatch.entity_id : trimmed;

    const row = this.db.prepare(`
      SELECT * FROM entities WHERE id = ?
    `).get(targetId) as any;

    if (!row) return null;

    const aliases = (this.db.prepare(`SELECT alias FROM entity_aliases WHERE entity_id = ? AND alias != ?`).all(targetId, row.name.toLowerCase()) as { alias: string }[]).map(a => a.alias);
    const tags = (this.db.prepare(`SELECT tag FROM entity_tags WHERE entity_id = ?`).all(targetId) as { tag: string }[]).map(t => t.tag);
    const relationships = this.db.prepare(`SELECT target_id as target, relation, since_scene, until_scene, sentiment, notes FROM relationships WHERE source_id = ?`).all(targetId) as Relationship[];
    const secrets = (this.db.prepare(`SELECT secret FROM entity_secrets WHERE entity_id = ?`).all(targetId) as { secret: string }[]).map(s => s.secret);
    const known_by = (this.db.prepare(`SELECT known_by_id FROM entity_known_by WHERE entity_id = ?`).all(targetId) as { known_by_id: string }[]).map(k => k.known_by_id);

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
      },
      body: row.body,
      filePath: row.file_path,
    };
  }

  public listEntities(filter?: { type?: string; tag?: string; status?: string }): { id: string; name: string; type: string; status: string }[] {
    let query = `
      SELECT DISTINCT e.id, e.name, e.type, e.status 
      FROM entities e
      LEFT JOIN entity_tags t ON e.id = t.entity_id
      WHERE 1=1
    `;
    const params: any[] = [];

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

    query += ` ORDER BY e.name ASC`;
    return this.db.prepare(query).all(...params) as any[];
  }

  public search(query: string, limit = 20): { entity_id: string; name: string; snippet: string }[] {
    const ftsQuery = query.trim().replace(/['"]/g, "");
    if (!ftsQuery) return [];

    const rows = this.db.prepare(`
      SELECT entity_id, name, snippet(lore_fts, 3, '<b>', '</b>', '...', 15) as snippet
      FROM lore_fts
      WHERE lore_fts MATCH ?
      LIMIT ?
    `).all(`${ftsQuery}*`, limit) as any[];

    return rows;
  }

  public getAllRelationships(): { source: string; target: string; relation: string; sentiment: number }[] {
    return this.db.prepare(`
      SELECT source_id as source, target_id as target, relation, sentiment 
      FROM relationships
    `).all() as any[];
  }

  public close(): void {
    this.db.close();
  }
}
