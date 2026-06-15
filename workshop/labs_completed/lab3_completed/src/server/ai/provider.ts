import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { env } from "@/server/env";
import { DEFAULT_MODELS, type AIProvider } from "@/lib/ai/models";

/**
 * Returns a language model instance configured from environment variables.
 *
 * Provider is selected via `AI_PROVIDER` (default: `"openai"`).
 * Model is selected via `AI_MODEL` (default: provider-specific).
 *
 * ## Adding a new provider
 * 1. Install the corresponding `@ai-sdk/<provider>` package.
 * 2. Add the provider name to the `AIProvider` union type above.
 * 3. Add its default model to `DEFAULT_MODELS`.
 * 4. Add a `case` branch in `getModel()` that calls `create<Provider>()` and
 *    returns `provider(model)`.
 * 5. Document the new `<PROVIDER>_API_KEY` in `.env.example`.
 */
export function getModel(): LanguageModel {
  const provider = env.aiProvider as AIProvider;
  const model = env.aiModel || DEFAULT_MODELS[provider];

  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: env.anthropicApiKey,
        ...(env.aiBaseUrl ? { baseURL: env.aiBaseUrl } : {}),
      });
      return anthropic(model);
    }

    case "openai":
    default: {
      const openai = createOpenAI({
        apiKey: env.openAiApiKey,
        ...(env.aiBaseUrl ? { baseURL: env.aiBaseUrl } : {}),
      });
      return openai(model);
    }
  }
}
