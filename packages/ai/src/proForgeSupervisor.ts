import {
  IncarnationTracker,
  runGatewayCompletion,
  type AiGatewayConfig,
} from './gateway';

export interface OffsetPatch {
  readonly start: number;
  readonly end: number;
  readonly replacement: string;
}

/**
 * Applies character-offset replacements strictly back-to-front so earlier offsets
 * remain valid across multiple non-overlapping prose edits.
 */
export function applyOffsetPatchesBackToFront(
  source: string,
  patches: readonly OffsetPatch[]
): string {
  const ordered = [...patches].sort((a, b) => b.start - a.start);
  let result = source;

  for (let i = 0; i < ordered.length; i += 1) {
    const patch = ordered[i]!;
    if (patch.start < 0 || patch.end > result.length || patch.start > patch.end) {
      throw new Error(`Invalid patch range [${patch.start}, ${patch.end}] for text length ${result.length}.`);
    }
    const nextPatch = ordered[i + 1];
    if (nextPatch && nextPatch.end > patch.start) {
      throw new Error(`Overlapping offset patches detected between [${nextPatch.start},${nextPatch.end}] and [${patch.start},${patch.end}].`);
    }
    result = result.slice(0, patch.start) + patch.replacement + result.slice(patch.end);
  }

  return result;
}

export const PROFORGE_STAGES = [
  '1. Ingestão e Diagnóstico',
  '2. Edição Estrutural',
  '3. Linha e Prosa',
  '4. Edição de Cópia',
  '5. Prova Final',
  '6. Produção',
  '7. Preparação para Publicação',
  '8. Resumo da Execução',
] as const;

export type ProForgeStage = (typeof PROFORGE_STAGES)[number];

export interface SupervisorCheckpoint {
  readonly stage: ProForgeStage;
  readonly snapshotBefore: string;
  readonly outputText: string;
  readonly providerUsed: string;
}

/**
 * Orchestrates multi-stage editorial execution with automatic rollback checkpoints
 * and Incarnation cancellation safety.
 */
export class ProForgeSupervisorAgent {
  private readonly checkpoints: SupervisorCheckpoint[] = [];

  constructor(private readonly tracker = new IncarnationTracker()) {}

  public getCheckpoints(): readonly SupervisorCheckpoint[] {
    return this.checkpoints;
  }

  public async executeStage(params: {
    stage: ProForgeStage;
    sceneTitle: string;
    sceneSummary: string;
    sceneContent: string;
    config: AiGatewayConfig;
    fetchFn?: typeof fetch;
  }): Promise<{ ok: true; checkpoint: SupervisorCheckpoint } | { ok: false; error: string }> {
    const { controller, incarnation, release } = this.tracker.registerController();
    try {
      const res = await runGatewayCompletion(
        {
          config: params.config,
          incarnation,
          signal: controller.signal,
          fetchFn: params.fetchFn,
          systemPrompt: `Execute InkGraph editorial stage "${params.stage}". Maintain strict canon and author voice. Respond directly with revised prose or actionable diagnostics.`,
          userPrompt: `Scene: ${params.sceneTitle}\nSummary: ${params.sceneSummary}\nContent:\n${params.sceneContent}`,
        },
        this.tracker
      );

      if (!res.ok) {
        return { ok: false, error: res.error };
      }

      const checkpoint: SupervisorCheckpoint = {
        stage: params.stage,
        snapshotBefore: params.sceneContent,
        outputText: res.text,
        providerUsed: res.providerUsed,
      };
      this.checkpoints.push(checkpoint);
      return { ok: true, checkpoint };
    } finally {
      release();
    }
  }

  public rollbackToLastCheckpoint(): string | null {
    const last = this.checkpoints.pop();
    return last ? last.snapshotBefore : null;
  }
}
