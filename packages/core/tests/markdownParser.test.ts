import { describe, it, expect } from "vitest";
import { parseLoreMarkdown, FrontmatterParseError } from "../src/parser/markdownParser";

describe("Markdown & Frontmatter Parser", () => {
  it("should successfully parse valid character lore with relationships and epistemic state", () => {
    const rawMarkdown = `---
id: "char_vance"
type: "character"
subtype: "commander"
name: "Elias Vance"
aliases:
  - "The Blind Crow"
status: "canon"
tags:
  - "military"
relationships:
  - target: "faction_iron_order"
    relation: "exiled_member"
    sentiment: -0.7
epistemic:
  secrets_kept:
    - "Killed his brother during the Siege"
  known_by:
    - "char_queen_morrigan"
---

# Backstory
Elias served in the Vanguard for twelve winters before being exiled.
`;

    const doc = parseLoreMarkdown(rawMarkdown, "workspace/lore/characters/vance.md");

    expect(doc.frontmatter.id).toBe("char_vance");
    expect(doc.frontmatter.name).toBe("Elias Vance");
    expect(doc.frontmatter.aliases).toContain("The Blind Crow");
    expect(doc.frontmatter.relationships[0]?.sentiment).toBe(-0.7);
    expect(doc.frontmatter.epistemic.secrets_kept).toContain("Killed his brother during the Siege");
    expect(doc.markdownBody).toContain("# Backstory");
  });

  it("should parse an agnostic rule system or concept", () => {
    const rawMarkdown = `---
id: "sys_shadow_magic"
type: "rule_system"
subtype: "magic_system"
name: "Shadow Weaving"
aliases: ["Umbral Art"]
status: "canon"
tags: ["sorcery", "forbidden"]
---
A metaphysical discipline based on absorbing residual photons.
`;

    const doc = parseLoreMarkdown(rawMarkdown, "workspace/lore/systems/shadow.md");

    expect(doc.frontmatter.id).toBe("sys_shadow_magic");
    expect(doc.frontmatter.type).toBe("rule_system");
    expect(doc.frontmatter.subtype).toBe("magic_system");
    expect(doc.markdownBody).toContain("residual photons");
  });

  it("should throw FrontmatterParseError on missing delimiters", () => {
    const invalidMarkdown = `id: "missing_frontmatter"
name: "No Delimiters"`;

    expect(() => parseLoreMarkdown(invalidMarkdown)).toThrowError(FrontmatterParseError);
  });
});
