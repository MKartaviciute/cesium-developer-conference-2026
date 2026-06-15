import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { DEFAULT_MODELS, type AIProvider } from "@/lib/ai/models";

/**
 * Returns a language model configured from environment variables.
 *
 * Variables are exposed to the browser via the `env` block in next.config.ts:
 *   AI_PROVIDER  — "openai" (default) or "anthropic"
 *   AI_MODEL     — optional override (e.g. "gpt-5.4", "claude-3-5-sonnet-20241022")
 *   AI_BASE_URL  — optional custom endpoint (Azure AI Foundry, local proxy, etc.)
 *   OPENAI_API_KEY / ANTHROPIC_API_KEY — the provider API key
 */
export function getModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "openai") as AIProvider;
  const model = process.env.AI_MODEL || DEFAULT_MODELS[provider];
  const baseURL = process.env.AI_BASE_URL || undefined;

  if (provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
      ...(baseURL ? { baseURL } : {}),
    });
    return anthropic(model);
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
    ...(baseURL ? { baseURL } : {}),
  });
  return openai(model);
}
