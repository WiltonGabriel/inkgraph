import { IncarnationTracker, runGatewayCompletion } from '@inkgraph/ai';
import type { AppSettings } from '../types/project';

export interface AiCompletionRequest {
  readonly settings: AppSettings;
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly signal?: AbortSignal;
}

export type AiCompletionResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: string; readonly stale?: boolean };

export const uiIncarnationTracker = new IncarnationTracker();

/**
 * Delegates studio AI requests cleanly to @inkgraph/ai while enforcing offline/incarnation guards.
 */
export async function runAiCompletion(req: AiCompletionRequest): Promise<AiCompletionResult> {
  const { controller, incarnation, release } = uiIncarnationTracker.registerController();
  try {
    const res = await runGatewayCompletion(
      {
        config: req.settings,
        systemPrompt: req.systemPrompt,
        userPrompt: req.userPrompt,
        incarnation,
        signal: req.signal ?? controller.signal,
      },
      uiIncarnationTracker
    );
    return res;
  } finally {
    release();
  }
}
