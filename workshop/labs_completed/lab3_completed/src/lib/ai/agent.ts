import { streamText, stepCountIs } from "ai";
import type { ModelMessage, Tool } from "ai";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/prompts/system-prompt";

export type OnToolStart = (toolCallId: string, toolName: string) => void;
export type OnToolCall = (toolCallId: string, toolName: string, input: unknown) => void;
export type OnToolResult = (toolCallId: string, toolName: string, output: unknown) => void;

export interface ChatOptions {
  messages: ModelMessage[];
  tools: Record<string, Tool>;
  onTextChunk: (chunk: string) => void;
  maxSteps?: number;
  abortSignal?: AbortSignal;
  viewerContext?: string;
  onToolStart?: OnToolStart;
  onToolCall?: OnToolCall;
  onToolResult?: OnToolResult;
}

export async function chat({
  messages,
  tools,
  onTextChunk,
  maxSteps = 25,
  abortSignal,
  viewerContext,
  onToolStart,
  onToolCall,
  onToolResult,
}: ChatOptions) {
  const base = buildSystemPrompt();
  const system = viewerContext ? `${base}\n\n${viewerContext}` : base;

  const result = streamText({
    model: getModel(),
    system,
    messages,
    tools,
    stopWhen: stepCountIs(maxSteps),
    abortSignal,
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text-delta") {
      onTextChunk(chunk.text);
    } else if (chunk.type === "tool-input-start") {
      onToolStart?.(chunk.id, chunk.toolName);
    } else if (chunk.type === "tool-call") {
      onToolCall?.(chunk.toolCallId, chunk.toolName, chunk.input);
    } else if (chunk.type === "tool-result") {
      onToolResult?.(chunk.toolCallId, chunk.toolName, chunk.output);
    } else if (chunk.type === "tool-error") {
      onToolCall?.(chunk.toolCallId, chunk.toolName, chunk.input);
      onToolResult?.(chunk.toolCallId, chunk.toolName, { success: false, error: String(chunk.error) });
    } else if (chunk.type === "error") {
      throw chunk.error;
    }
  }

  return result;
}
