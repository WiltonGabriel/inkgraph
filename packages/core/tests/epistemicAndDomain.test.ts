import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  BaseEntitySchema,
  RelationshipSchema,
  EpistemicSchema,
  InkGraphError,
  LoreDatabase,
  parseLoreMarkdown,
  resolveSafeStagingPath,
} from "../src/index";

describe("Domain Validation, Epistemic State & FTS5 Search", () => {
  let db: LoreDatabase;

  beforeEach(() => {
    db = new LoreDatabase({ inMemory: true });
  });

  afterEach(() => {
    db.close();
  });

  it("validates BaseEntitySchema with defaults and rejects missing required fields", () => {
    const valid = BaseEntitySchema.parse({
      id: "char_elias_vance",
      type: "character",
      name: "Elias Vance",
    });

    expect(valid.status).toBe("canon");
    expect(valid.aliases).toEqual([]);
    expect(valid.relationships).toEqual([]);
    expect(valid.epistemic).toEqual({ secrets_kept: [], known_by: [] });

    expect(() =>
      BaseEntitySchema.parse({
        id: "",
        type: "character",
        name: "Invalid",
      })
    ).toThrow();
  });

  it("enforces relationship sentiment bounds between -1.0 and 1.0", () => {
    const validEdge = RelationshipSchema.parse({
      target: "faction_iron_order",
      relation: "exiled_member",
      sentiment: -0.8,
      since_scene: "scene_01",
    });
    expect(validEdge.sentiment).toBe(-0.8);

    expect(() =>
      RelationshipSchema.parse({
        target: "faction_iron_order",
        relation: "too_hostile",
        sentiment: -1.5,
      })
    ).toThrow();

    expect(() =>
      RelationshipSchema.parse({
        target: "faction_iron_order",
        relation: "too_friendly",
        sentiment: 1.2,
      })
    ).toThrow();
  });

  it("preserves original alias casing and persists revealed_at_scene in SQLite", () => {
    const ep = EpistemicSchema.parse({
      secrets_kept: ["Killed his brother during the Siege of Vael"],
      known_by: ["self", "char_queen_morrigan"],
      revealed_at_scene: "scene_05_revelation",
    });

    expect(ep.secrets_kept).toHaveLength(1);
    expect(ep.known_by).toContain("char_queen_morrigan");
    expect(ep.revealed_at_scene).toBe("scene_05_revelation");

    const doc = parseLoreMarkdown(
      `---
id: "char_vance"
type: "character"
name: "Elias Vance"
aliases: ["O Corvo Cego", "Comandante de Vael"]
status: "canon"
tags: ["nobreza", "militar"]
relationships:
  - target: "faction_iron_order"
    relation: "exilado"
    since_scene: "scene_01_prologue"
    sentiment: -0.8
epistemic:
  secrets_kept:
    - "Portador da Lâmina de Valdor"
  known_by:
    - "self"
    - "char_morrigan"
  revealed_at_scene: "scene_05_revelation"
---
Comandante exilado após o Cerco de Vael.
`,
      "workspace/lore/characters/vance.md"
    );

    db.upsertEntity(doc);

    const retrieved = db.getEntityByIdOrAlias("o corvo cego");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.aliases).toEqual(["O Corvo Cego", "Comandante de Vael"]);
    expect(retrieved?.epistemic.secrets_kept).toEqual(["Portador da Lâmina de Valdor"]);
    expect(retrieved?.epistemic.known_by).toEqual(expect.arrayContaining(["self", "char_morrigan"]));
    expect(retrieved?.epistemic.revealed_at_scene).toBe("scene_05_revelation");
  });

  it("throws InkGraphError with code 'ambiguous' when two entities share the same alias", () => {
    const doc1 = parseLoreMarkdown(`---
id: "char_vance_elder"
type: "character"
name: "Alden Vance"
aliases: ["Lord Vance"]
status: "canon"
---
Father of Elias.
`);
    const doc2 = parseLoreMarkdown(`---
id: "char_vance_younger"
type: "character"
name: "Elias Vance"
aliases: ["Lord Vance"]
status: "canon"
---
Son of Alden.
`);

    db.upsertEntity(doc1);
    db.upsertEntity(doc2);

    expect(() => db.getEntityByIdOrAlias("Lord Vance")).toThrowError(InkGraphError);

    try {
      db.getEntityByIdOrAlias("lord vance");
    } catch (err) {
      expect(err).toBeInstanceOf(InkGraphError);
      expect((err as InkGraphError).code).toBe("ambiguous");
      expect((err as InkGraphError).details?.matches).toEqual(
        expect.arrayContaining(["char_vance_elder", "char_vance_younger"])
      );
    }
  });

  it("sanitizes FTS5 search queries with hyphens, colons, and parentheses and cleans up on deleteEntity", () => {
    const doc = parseLoreMarkdown(`---
id: "event_siege_vael"
type: "event"
name: "Cerco de Vael"
aliases: ["Queda do Norte"]
status: "canon"
tags: ["guerra", "pt-br"]
---
Batalha decisiva no Cerco-de-Vael durante o inverno.
`);

    db.upsertEntity(doc);

    const ftsHits = db.search("Cerco-de-Vael (Ato 1): invierno?");
    expect(() => db.search("Cerco-de-Vael (Ato 1): pt-BR")).not.toThrow();

    const hits = db.search("Cerco-de-Vael");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.entity_id).toBe("event_siege_vael");
    expect(ftsHits).toHaveLength(0);

    const deleted = db.deleteEntity("event_siege_vael");
    expect(deleted).toBe(true);
    expect(db.search("Cerco")).toHaveLength(0);
    expect(db.getEntityByIdOrAlias("event_siege_vael")).toBeNull();
  });

  it("queries epistemic state across entities and builds chronological timeline", () => {
    const vance = parseLoreMarkdown(`---
id: "char_vance"
type: "character"
name: "Elias Vance"
relationships:
  - target: "char_morrigan"
    relation: "aliado_secreto"
    since_scene: "scene_02_pact"
    sentiment: 0.6
epistemic:
  secrets_kept:
    - "Matou o irmão no Cerco"
  known_by:
    - "char_morrigan"
  revealed_at_scene: "scene_04_trial"
---
Comandante.
`);

    const morrigan = parseLoreMarkdown(`---
id: "char_morrigan"
type: "character"
name: "Morrigan Crow"
epistemic:
  secrets_kept:
    - "Guarda a Obsidiana"
  known_by:
    - "self"
---
Rainha.
`);

    db.upsertEntity(vance);
    db.upsertEntity(morrigan);

    const morriganEpistemic = db.queryEpistemicState("char_morrigan", "scene_05");
    expect(morriganEpistemic.entity_id).toBe("char_morrigan");
    expect(morriganEpistemic.secrets_kept).toEqual(["Guarda a Obsidiana"]);
    expect(morriganEpistemic.secrets_known_from_others).toHaveLength(1);
    expect(morriganEpistemic.secrets_known_from_others[0]?.source_entity_id).toBe("char_vance");

    const morriganBeforeReveal = db.queryEpistemicState("char_morrigan", "scene_01");
    expect(morriganBeforeReveal.secrets_known_from_others).toHaveLength(0);

    const timeline = db.getTimeline("scene_01", "scene_05");
    expect(timeline.map((t) => t.scene_id)).toEqual(["scene_02_pact", "scene_04_trial"]);
  });

  it("blocks path traversal in resolveSafeStagingPath with canon_violation", () => {
    expect(() => resolveSafeStagingPath("/tmp/workspace/staging", "../lore/vance.md")).toThrowError(
      InkGraphError
    );
    expect(() => resolveSafeStagingPath("/tmp/workspace/staging", "sub/vance.md")).toThrowError(
      InkGraphError
    );

    const validPath = resolveSafeStagingPath("/tmp/workspace/staging", "proposed_vance");
    expect(validPath).toBe("/tmp/workspace/staging/proposed_vance.md");
  });
});
