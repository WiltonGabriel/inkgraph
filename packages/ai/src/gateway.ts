import {
  assertCloudAiAllowed,
  isAiGenerativeEnabled,
  isCloudProvider,
  type AiMode,
  type AiProviderId,
} from '@inkgraph/domain';

export interface AiGatewayConfig {
  readonly aiMode: AiMode;
  readonly aiProvider: AiProviderId;
  readonly geminiApiKey: string;
  readonly ollamaUrl: string;
  readonly ollamaModel: string;
  readonly aiTemperature: number;
  readonly aiMaxTokens: number;
  readonly language?: 'pt-BR' | 'en';
}

export interface AiGatewayRequest {
  readonly config: AiGatewayConfig;
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly incarnation?: number;
  readonly signal?: AbortSignal;
  readonly fetchFn?: typeof fetch;
}

export type AiGatewayResult =
  | { readonly ok: true; readonly text: string; readonly providerUsed: AiProviderId }
  | { readonly ok: false; readonly error: string; readonly stale?: boolean };

/**
 * Cancels stale AI requests when the user switches workspace, branch, or snapshot.
 */
export class IncarnationTracker {
  private incarnationId = 1;
  private readonly activeControllers = new Set<AbortController>();

  public get current(): number {
    return this.incarnationId;
  }

  public bump(): number {
    this.incarnationId += 1;
    for (const ctrl of this.activeControllers) {
      ctrl.abort();
    }
    this.activeControllers.clear();
    return this.incarnationId;
  }

  public isCurrent(id: number): boolean {
    return id === this.incarnationId;
  }

  public registerController(): { controller: AbortController; incarnation: number; release: () => void } {
    const controller = new AbortController();
    const incarnation = this.incarnationId;
    this.activeControllers.add(controller);
    return {
      controller,
      incarnation,
      release: () => this.activeControllers.delete(controller),
    };
  }
}

async function invokeSingleProvider(
  provider: AiProviderId,
  config: AiGatewayConfig,
  systemPrompt: string,
  userPrompt: string,
  fetchFn: typeof fetch,
  signal?: AbortSignal
): Promise<string> {
  if (provider === 'mcp') {
    throw new Error(
      config.language === 'en'
        ? 'Primary provider is External MCP Hub. Choose Ollama, LM Studio, or BYOK Cloud for in-app calls.'
        : 'Provedor definido para Hub MCP Externo. Escolha Ollama, LM Studio ou API Cloud para chamadas internas.'
    );
  }

  if (provider === 'ollama') {
    const base = config.ollamaUrl.replace(/\/+$/, '');
    const res = await fetchFn(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: config.ollamaModel || 'llama3.2:3b',
        stream: false,
        options: { temperature: config.aiTemperature, num_predict: config.aiMaxTokens },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    const text = data.message?.content?.trim();
    if (!text) throw new Error('Empty response from Ollama.');
    return text;
  }

  if (provider === 'lmstudio' || provider === 'openai' || provider === 'openrouter') {
    const endpoint =
      provider === 'lmstudio'
        ? `${config.ollamaUrl.replace(/\/+$/, '')}/v1/chat/completions`
        : provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

    if (provider !== 'lmstudio' && !config.geminiApiKey.trim()) {
      throw new Error(`API key is missing for ${provider}.`);
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.geminiApiKey.trim()) {
      headers.Authorization = `Bearer ${config.geminiApiKey.trim()}`;
    }

    const model =
      provider === 'lmstudio'
        ? config.ollamaModel || 'local-model'
        : provider === 'openrouter'
          ? 'google/gemini-2.0-flash-001'
          : 'gpt-4o-mini';

    const res = await fetchFn(endpoint, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model,
        temperature: config.aiTemperature,
        max_tokens: config.aiMaxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`${provider} HTTP ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error(`Empty response from ${provider}.`);
    return text;
  }

  if (provider === 'gemini') {
    const key = config.geminiApiKey.trim();
    if (!key) throw new Error('Gemini API key is missing.');
    const res = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: config.aiTemperature, maxOutputTokens: config.aiMaxTokens },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
    if (!text) throw new Error('Empty response from Gemini.');
    return text;
  }

  if (provider === 'anthropic') {
    const key = config.geminiApiKey.trim();
    if (!key) throw new Error('Anthropic API key is missing.');
    const res = await fetchFn('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      signal,
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: config.aiMaxTokens,
        temperature: config.aiTemperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data.content?.map((c) => c.text ?? '').join('').trim();
    if (!text) throw new Error('Empty response from Anthropic.');
    return text;
  }

  throw new Error(`Unsupported provider '${provider}'.`);
}

export async function runGatewayCompletion(
  req: AiGatewayRequest,
  tracker?: IncarnationTracker
): Promise<AiGatewayResult> {
  const { config, systemPrompt, userPrompt, incarnation, signal } = req;
  const fetchFn = req.fetchFn ?? fetch;

  if (!isAiGenerativeEnabled(config.aiMode)) {
    return {
      ok: false,
      error:
        config.language === 'en'
          ? 'Generative AI is turned off (Zero-AI or Eco mode).'
          : 'IA generativa desativada (Modo Zero-IA ou Eco).',
    };
  }

  try {
    assertCloudAiAllowed(config.aiMode, config.aiProvider);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (tracker && incarnation !== undefined && !tracker.isCurrent(incarnation)) {
    return { ok: false, stale: true, error: 'Discarded stale AI request from previous project state.' };
  }

  try {
    const text = await invokeSingleProvider(
      config.aiProvider,
      config,
      systemPrompt,
      userPrompt,
      fetchFn,
      signal
    );
    if (tracker && incarnation !== undefined && !tracker.isCurrent(incarnation)) {
      return { ok: false, stale: true, error: 'Discarded stale AI response after context switch.' };
    }
    return { ok: true, text, providerUsed: config.aiProvider };
  } catch (primaryErr) {
    // Hybrid fallback to local Ollama if cloud provider is unreachable
    if (config.aiMode === 'hybrid' && isCloudProvider(config.aiProvider) && !signal?.aborted) {
      try {
        const localText = await invokeSingleProvider(
          'ollama',
          config,
          systemPrompt,
          userPrompt,
          fetchFn,
          signal
        );
        if (tracker && incarnation !== undefined && !tracker.isCurrent(incarnation)) {
          return { ok: false, stale: true, error: 'Discarded stale fallback response.' };
        }
        return { ok: true, text: localText, providerUsed: 'ollama' };
      } catch {
        // Fall through to reporting original error clearly
      }
    }
    return {
      ok: false,
      error: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
    };
  }
}
