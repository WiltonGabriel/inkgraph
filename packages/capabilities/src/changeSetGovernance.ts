import { computeWordDiff, InkGraphError, type WordDiffSummary } from "@inkgraph/domain";

export type AgentWriteGovernance = "staging_strict" | "draft_copilot";

export interface ChangeSetProvenance {
  readonly changeSetId: string;
  readonly undoId: string;
  readonly clientName: string;
  readonly rationale: string;
  readonly targetKind: "scene" | "lore" | "staging";
  readonly targetId: string;
  readonly createdAt: string;
  readonly dryRun: boolean;
  readonly diff: WordDiffSummary;
}

export interface DirectDraftEditRequest {
  readonly governance: AgentWriteGovernance;
  readonly sceneId: string;
  readonly sceneStatus: "outline" | "draft" | "revised" | "canon" | "final";
  readonly currentVersion: number;
  readonly expectedVersion: number;
  readonly currentContent: string;
  readonly proposedContent: string;
  readonly clientName: string;
  readonly rationale: string;
  readonly dryRun?: boolean;
}

/**
 * Enforces InkGraph canon safety boundaries:
 * - In 'staging_strict', direct scene edits are blocked (route to staging/).
 * - In 'draft_copilot', direct edits are only allowed on 'outline' or 'draft' scenes
 *   when expectedVersion matches currentVersion.
 */
export function evaluateDirectSceneEdit(req: DirectDraftEditRequest): ChangeSetProvenance {
  if (req.governance === "staging_strict") {
    throw new InkGraphError(
      "canon_violation",
      "Project governance enforces strict staging; route proposals to staging/ for author review.",
      { sceneId: req.sceneId, governance: req.governance }
    );
  }

  if (req.sceneStatus === "canon" || req.sceneStatus === "final" || req.sceneStatus === "revised") {
    throw new InkGraphError(
      "canon_violation",
      `Scene '${req.sceneId}' has protected status '${req.sceneStatus}'. Use staging/ proposal instead.`,
      { sceneId: req.sceneId, sceneStatus: req.sceneStatus }
    );
  }

  if (req.expectedVersion !== req.currentVersion) {
    throw new InkGraphError(
      "conflict",
      `Version mismatch on scene '${req.sceneId}': expected ${req.expectedVersion}, actual ${req.currentVersion}.`,
      { sceneId: req.sceneId, expectedVersion: req.expectedVersion, currentVersion: req.currentVersion }
    );
  }

  const timestamp = new Date().toISOString();
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const diff = computeWordDiff(req.currentContent, req.proposedContent);

  return {
    changeSetId: `cs_${suffix}`,
    undoId: `undo_${suffix}`,
    clientName: req.clientName,
    rationale: req.rationale,
    targetKind: "scene",
    targetId: req.sceneId,
    createdAt: timestamp,
    dryRun: Boolean(req.dryRun),
    diff,
  };
}
