import type Database from "better-sqlite3";
import type { BaseEntity } from "../domain/entity";
import type { EpistemicStateResult, TimelineEntry } from "./schema";

export function queryEntityEpistemicState(
  db: Database.Database,
  entity: BaseEntity,
  sceneId?: string
): EpistemicStateResult {
  const otherSecretsRows = db
    .prepare(`
      SELECT e.id as source_entity_id, e.name as source_name, s.secret, e.revealed_at_scene
      FROM entity_secrets s
      INNER JOIN entities e ON e.id = s.entity_id
      INNER JOIN entity_known_by k ON k.entity_id = s.entity_id
      WHERE s.entity_id != ?
        AND (k.known_by_id = ? OR k.known_by_id = 'all')
    `)
    .all(entity.id, entity.id) as {
    source_entity_id: string;
    source_name: string;
    secret: string;
    revealed_at_scene: string | null;
  }[];

  const filteredOthers = sceneId
    ? otherSecretsRows.filter(
        (row) => !row.revealed_at_scene || row.revealed_at_scene <= sceneId
      )
    : otherSecretsRows;

  return {
    entity_id: entity.id,
    name: entity.name,
    scene_id: sceneId ?? null,
    secrets_kept: entity.epistemic.secrets_kept,
    revealed_at_scene: entity.epistemic.revealed_at_scene ?? null,
    secrets_known_from_others: filteredOthers,
  };
}

export function queryChronologicalTimeline(
  db: Database.Database,
  fromScene?: string,
  toScene?: string
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  const relRows = db
    .prepare(`
      SELECT source_id, target_id, relation, since_scene, until_scene, sentiment
      FROM relationships
      WHERE since_scene IS NOT NULL OR until_scene IS NOT NULL
    `)
    .all() as {
    source_id: string;
    target_id: string;
    relation: string;
    since_scene: string | null;
    until_scene: string | null;
    sentiment: number;
  }[];

  for (const r of relRows) {
    if (r.since_scene) {
      entries.push({
        scene_id: r.since_scene,
        kind: "relationship_start",
        entity_id: r.source_id,
        target_id: r.target_id,
        summary: `${r.source_id} -> ${r.target_id} (${r.relation})`,
        sentiment: r.sentiment,
      });
    }
    if (r.until_scene) {
      entries.push({
        scene_id: r.until_scene,
        kind: "relationship_end",
        entity_id: r.source_id,
        target_id: r.target_id,
        summary: `${r.source_id} -x- ${r.target_id} (${r.relation} ended)`,
        sentiment: r.sentiment,
      });
    }
  }

  const entityRows = db
    .prepare(`
      SELECT id, name, type, revealed_at_scene, body
      FROM entities
      WHERE type = 'event' OR revealed_at_scene IS NOT NULL
    `)
    .all() as {
    id: string;
    name: string;
    type: string;
    revealed_at_scene: string | null;
    body: string;
  }[];

  for (const e of entityRows) {
    if (e.revealed_at_scene) {
      entries.push({
        scene_id: e.revealed_at_scene,
        kind: e.type === "event" ? "event" : "revelation",
        entity_id: e.id,
        summary: `${e.name}: ${e.body.slice(0, 120).trim()}`,
      });
    } else if (e.type === "event") {
      entries.push({
        scene_id: e.id,
        kind: "event",
        entity_id: e.id,
        summary: `${e.name}: ${e.body.slice(0, 120).trim()}`,
      });
    }
  }

  const filtered = entries.filter((entry) => {
    if (fromScene && entry.scene_id < fromScene) return false;
    if (toScene && entry.scene_id > toScene) return false;
    return true;
  });

  return filtered.sort((a, b) => a.scene_id.localeCompare(b.scene_id));
}
