import type { BaseEntity } from "@inkgraph/domain";

export interface SceneEpistemicBriefing {
  readonly sceneId: string;
  readonly povEntityId: string | null;
  readonly visibleFacts: { entityId: string; entityName: string; secretsKnown: string[] }[];
  readonly withheldSecrets: { entityId: string; entityName: string; secret: string; revealedAtScene?: string }[];
}

/**
 * Filters lore secrets against a scene's POV character and chronological reveal order
 * so neither internal AI nor MCP agents leak spoilers prior to their reveal scene.
 */
export function buildSceneEpistemicBriefing(
  sceneId: string,
  povEntityId: string | null,
  entities: readonly BaseEntity[],
  sceneOrderIds: readonly string[]
): SceneEpistemicBriefing {
  const currentIndex = sceneOrderIds.indexOf(sceneId);
  const visibleFacts: SceneEpistemicBriefing["visibleFacts"] = [];
  const withheldSecrets: SceneEpistemicBriefing["withheldSecrets"] = [];

  for (const entity of entities) {
    if (entity.archived_at) continue;
    const secrets = entity.epistemic.secrets_kept;
    if (secrets.length === 0) continue;

    const revealSceneId = entity.epistemic.revealed_at_scene;
    const revealIndex = revealSceneId ? sceneOrderIds.indexOf(revealSceneId) : -1;
    const isRevealedByTimeline =
      revealIndex !== -1 && currentIndex !== -1 && revealIndex <= currentIndex;
    const isPovHolder = povEntityId !== null && (
      entity.id === povEntityId || entity.epistemic.known_by.includes(povEntityId)
    );

    if (isRevealedByTimeline || isPovHolder) {
      visibleFacts.push({
        entityId: entity.id,
        entityName: entity.name,
        secretsKnown: [...secrets],
      });
    } else {
      for (const secret of secrets) {
        withheldSecrets.push({
          entityId: entity.id,
          entityName: entity.name,
          secret,
          revealedAtScene: revealSceneId,
        });
      }
    }
  }

  return {
    sceneId,
    povEntityId,
    visibleFacts,
    withheldSecrets,
  };
}
