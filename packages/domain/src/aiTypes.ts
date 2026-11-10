import { InkGraphError } from "./errors";

export type AiMode = "off" | "eco" | "local" | "cloud" | "hybrid";

export type AiProviderId =
  | "ollama"
  | "lmstudio"
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "mcp";

const CLOUD_PROVIDERS: ReadonlySet<AiProviderId> = new Set([
  "gemini",
  "openai",
  "anthropic",
  "openrouter",
]);

export function isCloudProvider(provider: AiProviderId): boolean {
  return CLOUD_PROVIDERS.has(provider);
}

export function isAiGenerativeEnabled(mode: AiMode): boolean {
  return mode !== "off" && mode !== "eco";
}

/**
 * Enforces strict zero-egress privacy when AI is off, deterministic-only ('eco'),
 * or restricted to local inference ('local').
 */
export function assertCloudAiAllowed(mode: AiMode, provider: AiProviderId): void {
  if (mode === "off") {
    throw new InkGraphError(
      "canon_violation",
      "AI generation is disabled (aiMode='off'). No model invocation is permitted.",
      { mode, provider }
    );
  }
  if (mode === "eco") {
    throw new InkGraphError(
      "canon_violation",
      "Deterministic eco mode forbids generative AI requests.",
      { mode, provider }
    );
  }
  if (mode === "local" && isCloudProvider(provider)) {
    throw new InkGraphError(
      "canon_violation",
      `Local-only AI mode blocks outbound cloud provider '${provider}'.`,
      { mode, provider }
    );
  }
}
