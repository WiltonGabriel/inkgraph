import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  BaseEntitySchema,
  RelationshipSchema,
  EpistemicSchema,
  LoreDatabase,
  parseLoreMarkdown,
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

  it("validates epistemic secret structure and indexes secrets + known_by in SQLite", () => {
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
aliases: ["O Corvo Cego"]
status: "canon"
tags: ["nobreza", "militar"]
relationships:
  - target: "faction_iron_order"
    relation: "exilado"
    sentiment: -0.8
epistemic:
  secrets_kept:
    - "Portador da Lâmina de Valdor"
  known_by:
    - "self"
    - "char_morrigan"
---
Comandante exilado após o Cerco de Vael.
`,
      "workspace/lore/characters/vance.md"
    );

    db.upsertEntity(doc);

    const retrieved = db.getEntityByIdOrAlias("O Corvo Cego");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.epistemic.secrets_kept).toEqual(["Portador da Lâmina de Valdor"]);
    expect(retrieved?.epistemic.known_by).toEqual(["self", "char_morrigan"]);

    const ftsHits = db.search("Cerco");
    expect(ftsHits).toHaveLength(1);
    expect(ftsHits[0]?.entity_id).toBe("char_vance");
  });
});
