/**
 * Client-safe AI provider constants.
 *
 * Contains no secrets, so it is safe to import from both client components
 * (e.g. the StatusBar) and server-only modules (e.g. src/server/ai/provider.ts).
 */

/** Supported AI provider identifiers. */
export type AIProvider = "openai" | "anthropic";

/** Default model for each provider. */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-5.4",
  anthropic: "claude-3-5-sonnet-20241022",
};
