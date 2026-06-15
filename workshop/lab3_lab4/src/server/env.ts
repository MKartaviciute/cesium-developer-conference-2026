/** Maps each provider to the env var that holds its API key. */
const PROVIDER_KEY_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

/**
 * Validates that all required environment variables are set.
 * Throws an error with helpful instructions if any are missing.
 *
 * Called at app startup (next.config.ts) so missing vars are caught before
 * the server or build proceeds.
 */
export function validateEnv(): void {
  const provider = process.env.AI_PROVIDER ?? "openai";
  const apiKeyVar = PROVIDER_KEY_MAP[provider];

  const missing: Array<{ key: string; description: string }> = [];

  if (!apiKeyVar) {
    throw new Error(
      `Unknown AI provider "${provider}". ` +
        `Set AI_PROVIDER to one of: ${Object.keys(PROVIDER_KEY_MAP).join(", ")}.`,
    );
  }

  if (!process.env[apiKeyVar]) {
    missing.push({
      key: apiKeyVar,
      description: `API key for the "${provider}" LLM provider`,
    });
  }

  if (missing.length > 0) {
    const lines = missing.map(
      ({ key, description }) => `  ${key} — ${description}`,
    );
    throw new Error(
      [
        "Missing required environment variables.",
        "Copy .env.example to .env.local and fill in the values:\n",
        ...lines,
        "\nSee .env.example for documentation.",
      ].join("\n"),
    );
  }
}

/**
 * Typed, validated access to environment variables.
 * Import this instead of accessing process.env directly.
 */
export const env = {
  /** Active AI provider — defaults to "openai" (AI_PROVIDER) */
  aiProvider: process.env.AI_PROVIDER ?? "openai",
  /** AI model override — defaults to a provider-specific value when unset (AI_MODEL) */
  aiModel: process.env.AI_MODEL ?? "",
  /** Base URL override for the active AI provider — supports Azure AI Foundry and other custom endpoints (AI_BASE_URL) */
  aiBaseUrl: process.env.AI_BASE_URL ?? "",
  /** OpenAI API key (OPENAI_API_KEY) */
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  /** Anthropic API key (ANTHROPIC_API_KEY) */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  /** Cesium Ion access token — optional, falls back to CesiumJS built-in default when unset */
  cesiumIonAccessToken: process.env.CESIUM_ION_ACCESS_TOKEN,
} satisfies Record<string, string | undefined>;
