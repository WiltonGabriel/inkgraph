export interface IndexerOptions {
  readonly inMemory?: boolean;
  readonly dbPath?: string;
}

export interface EpistemicStateResult {
  readonly entity_id: string;
  readonly name: string;
  readonly scene_id: string | null;
  readonly secrets_kept: string[];
  readonly revealed_at_scene: string | null;
  readonly secrets_known_from_others: {
    readonly source_entity_id: string;
    readonly source_name: string;
    readonly secret: string;
    readonly revealed_at_scene: string | null;
  }[];
}

export interface TimelineEntry {
  readonly scene_id: string;
  readonly kind: "event" | "revelation" | "relationship_start" | "relationship_end";
  readonly entity_id: string;
  readonly target_id?: string;
  readonly summary: string;
  readonly sentiment?: number;
}

export const LORE_DB_SCHEMA_SQL = `
  -- Core Entities Table
  CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    subtype TEXT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'canon',
    revealed_at_scene TEXT,
    archived_at TEXT,
    fractional_order TEXT,
    file_path TEXT NOT NULL,
    body TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Aliases lookup table (preserves original case & detects ambiguity across entities)
  CREATE TABLE IF NOT EXISTS entity_aliases (
    alias_norm TEXT NOT NULL,
    alias_original TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    PRIMARY KEY (alias_norm, entity_id),
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

  -- Full-Text Search FTS5 Virtual Table for lore entities
  CREATE VIRTUAL TABLE IF NOT EXISTS lore_fts USING fts5(
    entity_id UNINDEXED,
    name,
    aliases,
    body,
    tags
  );

  -- Generalized Vault Documents Table (manuscript, timeline, staging, uploads, series)
  CREATE TABLE IF NOT EXISTS vault_documents (
    id TEXT PRIMARY KEY,
    section TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    file_path TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    archived_at TEXT,
    fractional_order TEXT,
    updated_at INTEGER NOT NULL
  );

  -- Full-Text Search FTS5 Virtual Table across all vault documents
  CREATE VIRTUAL TABLE IF NOT EXISTS vault_documents_fts USING fts5(
    doc_id UNINDEXED,
    section UNINDEXED,
    title,
    body
  );

  -- Non-destructive Parse Errors Log
  CREATE TABLE IF NOT EXISTS vault_parse_errors (
    file_path TEXT PRIMARY KEY,
    section TEXT NOT NULL,
    error TEXT NOT NULL,
    recorded_at INTEGER NOT NULL
  );
`;
