"use client";

import type { ModelMessage } from "ai";
import { fetchChatStep, serializeTools } from "./chat-transport";
import { processStream } from "./data-stream";
import { executeTools } from "./tool-execution";
import type { AssistantMessagePart, ChatOptions } from "./agent-types";

export type {
  ChatOptions,
  OnTextChunk,
  OnToolStart,
  OnToolCall,
  OnToolResult,
} from "./agent-types";

/**
 * Send a chat request to the server-side route handler and stream the
 * response.  Tool calls that come back from the server are executed locally
 * (in the browser) and the results are appended to the message history for
 * the next round, up to `maxSteps` times.
 *
 * Data-stream protocol types handled:
 *   0  — text delta
 *   b  — tool-call start (args streaming begins)
 *   9  — complete tool call (args fully received)
 *   3  — error
 */
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
  const serializedTools = serializeTools(tools);
  let currentMessages: ModelMessage[] = [...messages];

  for (let step = 0; step < maxSteps; step++) {
    const response = await fetchChatStep(currentMessages, viewerContext, serializedTools, abortSignal);

    const { textContent, toolCalls } = await processStream(
      response.body!,
      onTextChunk,
      onToolStart,
      onToolCall,
    );

    // No tool calls → model is done
    if (toolCalls.length === 0) break;

    // Append the assistant turn (text + tool calls) to the history
    const assistantContent: AssistantMessagePart[] = [];
    if (textContent) assistantContent.push({ type: "text", text: textContent });
    assistantContent.push(...toolCalls);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentMessages = [...currentMessages, { role: "assistant", content: assistantContent } as any];

    // Execute tools locally and append results so the model can continue
    const toolResults = await executeTools(toolCalls, tools, currentMessages, abortSignal, onToolResult);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentMessages = [...currentMessages, { role: "tool", content: toolResults } as any];
  }
}
