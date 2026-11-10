import { describe, expect, it } from "vitest";
import type { BaseEntity } from "@inkgraph/domain";
import { buildSceneEpistemicBriefing, evaluateDirectSceneEdit } from "../src/index";

describe("@inkgraph/capabilities", () => {
  it("withholds unrevealed secrets from non-POV scenes and reveals them after the reveal scene", () => {
    const entities: BaseEntity[] = [
      {
        id: "char_mara",
        type: "character",
        name: "Mara",
        aliases: [],
        status: "canon",
        tags: [],
        relationships: [],
        epistemic: {
          secrets_kept: ["Mara is the informant"],
          known_by: ["char_mara"],
          revealed_at_scene: "scene_2",
        },
      },
    ];

    const sceneOrder = ["scene_1", "scene_2", "scene_3"];

    const beforeReveal = buildSceneEpistemicBriefing("scene_1", "char_elias", entities, sceneOrder);
    expect(beforeReveal.visibleFacts).toHaveLength(0);
    expect(beforeReveal.withheldSecrets).toHaveLength(1);

    const afterReveal = buildSceneEpistemicBriefing("scene_2", "char_elias", entities, sceneOrder);
    expect(afterReveal.visibleFacts).toHaveLength(1);
    expect(afterReveal.withheldSecrets).toHaveLength(0);
  });

  it("enforces staging_strict and version conflict checks on direct scene edits", () => {
    expect(() =>
      evaluateDirectSceneEdit({
        governance: "staging_strict",
        sceneId: "scene_1",
        sceneStatus: "draft",
        currentVersion: 1,
        expectedVersion: 1,
        currentContent: "A",
        proposedContent: "B",
        clientName: "codex-cli",
        rationale: "polish",
      })
    ).toThrowError(/staging/i);

    expect(() =>
      evaluateDirectSceneEdit({
        governance: "draft_copilot",
        sceneId: "scene_1",
        sceneStatus: "canon",
        currentVersion: 1,
        expectedVersion: 1,
        currentContent: "A",
        proposedContent: "B",
        clientName: "codex-cli",
        rationale: "polish",
      })
    ).toThrowError(/protected status/i);

    expect(() =>
      evaluateDirectSceneEdit({
        governance: "draft_copilot",
        sceneId: "scene_1",
        sceneStatus: "draft",
        currentVersion: 2,
        expectedVersion: 1,
        currentContent: "A",
        proposedContent: "B",
        clientName: "codex-cli",
        rationale: "polish",
      })
    ).toThrowError(/Version mismatch/i);

    const cs = evaluateDirectSceneEdit({
      governance: "draft_copilot",
      sceneId: "scene_1",
      sceneStatus: "draft",
      currentVersion: 2,
      expectedVersion: 2,
      currentContent: "O mar estava calmo.",
      proposedContent: "O mar estava agitado.",
      clientName: "antigravity",
      rationale: "tensão",
      dryRun: true,
    });
    expect(cs.dryRun).toBe(true);
    expect(cs.diff.addedWords).toBe(1);
    expect(cs.undoId).toMatch(/^undo_/);
  });
});
