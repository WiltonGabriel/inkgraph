import { describe, expect, it } from "vitest";
import {
  assertCloudAiAllowed,
  calculateFleschReadability,
  computeWordDiff,
  generateFractionalKeyBetween,
  generateInitialFractionalKeys,
  parseLoreMarkdown,
  parseVaultDocument,
  serializeLoreMarkdown,
} from "../src/index";

describe("@inkgraph/domain pure logic", () => {
  it("parses and canonically serializes lore markdown round-trip", () => {
    const raw = [
      "---",
      "id: char_elias",
      "type: character",
      "name: Elias Vance",
      "aliases:",
      "  - The Cartographer",
      "status: canon",
      "tags:",
      "  - protagonist",
      "relationships:",
      "  - target: fac_guild",
      "    relation: exile",
      "    sentiment: -0.6",
      "epistemic:",
      "  secrets_kept:",
      "    - Forged the northern treaty",
      "  known_by:",
      "    - char_elias",
      "---",
      "",
      "# Elias Vance",
      "",
      "Former royal cartographer living under an assumed identity.",
    ].join("\n");

    const parsed = parseLoreMarkdown(raw, "lore/elias.md");
    expect(parsed.frontmatter.name).toBe("Elias Vance");
    expect(parsed.frontmatter.aliases).toEqual(["The Cartographer"]);

    const serialized = serializeLoreMarkdown(parsed.frontmatter, parsed.markdownBody);
    const reparsed = parseLoreMarkdown(serialized, "lore/elias.md");
    expect(reparsed.frontmatter).toEqual(parsed.frontmatter);
    expect(reparsed.markdownBody).toBe(parsed.markdownBody);
  });

  it("parses plain markdown scenes non-destructively even without frontmatter", () => {
    const raw = "# Capítulo 1: Neblina no Cais\n\nO navio atracou sem lanternas.";
    const doc = parseVaultDocument(raw, "manuscript/cap_01.md", "manuscript", 12345);
    expect(doc.section).toBe("manuscript");
    expect(doc.title).toBe("Capítulo 1: Neblina no Cais");
    expect(doc.id).toBe("manuscript_cap_01");
    expect(doc.body).toContain("navio atracou");
  });

  it("maintains strict lexicographical order in FractionalKey generation", () => {
    const keys = generateInitialFractionalKeys(4);
    expect(keys).toHaveLength(4);
    for (let i = 1; i < keys.length; i += 1) {
      expect(keys[i - 1]! < keys[i]!).toBe(true);
    }
    const between = generateFractionalKeyBetween(keys[1], keys[2]);
    expect(keys[1]! < between && between < keys[2]!).toBe(true);
  });

  it("blocks cloud providers when aiMode is off, eco, or local", () => {
    expect(() => assertCloudAiAllowed("off", "gemini")).toThrowError(/disabled/i);
    expect(() => assertCloudAiAllowed("eco", "openai")).toThrowError(/eco/i);
    expect(() => assertCloudAiAllowed("local", "anthropic")).toThrowError(/blocks outbound/i);
    expect(() => assertCloudAiAllowed("local", "ollama")).not.toThrow();
    expect(() => assertCloudAiAllowed("cloud", "gemini")).not.toThrow();
  });

  it("computes PT-BR and EN Flesch readability realistically", () => {
    const simplePt = "O sol nasceu cedo. O mar estava calmo. Ana abriu a porta devagar.";
    const densePt =
      "A complexidade burocrática constitucionalmente estabelecida impossibilitou imediatamente qualquer deliberação extraordinária subsequente.";
    expect(calculateFleschReadability(simplePt, "pt-BR")).toBeGreaterThan(
      calculateFleschReadability(densePt, "pt-BR")
    );
    expect(calculateFleschReadability("The cat sat on the mat. It was a warm day.", "en")).toBeGreaterThan(60);
  });

  it("computes sequential LCS word diff cleanly", () => {
    const diff = computeWordDiff(
      "Elias caminhou até o cais antigo sob chuva fina.",
      "Elias correu até o cais antigo sob neblina densa."
    );
    expect(diff.removedWords).toBe(3); // caminhou, chuva, fina.
    expect(diff.addedWords).toBe(3); // correu, neblina, densa.
    expect(diff.unchangedWords).toBe(6);
  });
});
