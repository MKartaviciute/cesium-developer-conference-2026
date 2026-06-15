"use client";

import type { ModelMessage, Tool } from "ai";

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

interface APIError extends Error {
  statusCode?: number;
}

/**
 * Data-stream protocol event codes used by the AI SDK wire format.
 * Values must match the protocol exactly (e.g. a line like `0:"hello"`).
 */
const StreamEvent = {
  TextDelta: "0",
  ToolCallStart: "b",
  ToolCall: "9",
  Error: "3",
} as const;

/**
 * Serialise tool definitions to plain JSON so they can be sent to the
 * server-side /api/chat route handler.  Only the schema is sent — the
 * execute function stays in the browser.
 */
function serializeTools(
  tools: Record<string, Tool>,
): Record<string, { description?: string; inputSchema: unknown }> {
  const out: Record<string, { description?: string; inputSchema: unknown }> = {};
  for (const [name, t] of Object.entries(tools)) {
    out[name] = {
      description: t.description,
      // AI SDK wraps every schema in an object with a `.jsonSchema` getter
      // that returns the plain JSON Schema representation.
      inputSchema: (t.inputSchema as { jsonSchema: unknown }).jsonSchema,
    };
  }
  return out;
}

/** Parse one line of the AI SDK data-stream protocol (e.g. `0:"hello"`). */
function parseLine(line: string): { type: string; data: unknown } | null {
  const idx = line.indexOf(":");
  if (idx === -1) return null;
  try {
    return { type: line.slice(0, idx), data: JSON.parse(line.slice(idx + 1)) };
  } catch {
    return null;
  }
}

/**
 * Read the newline-delimited data-stream protocol from a response body,
 * yielding one parsed `{ type, data }` event per line.
 */
async function* readDataStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<{ type: string; data: unknown }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = parseLine(line);
      if (parsed) yield parsed;
    }
  }
}

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
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: currentMessages,
        viewerContext,
        tools: serializedTools,
      }),
      signal: abortSignal,
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      const err = new Error(
        (body as { error?: string }).error ?? `Request failed with status ${resp.status}`,
      ) as APIError;
      err.statusCode = resp.status;
      throw err;
    }

    // Accumulate the assistant turn so it can be appended to history if the
    // model issued any tool calls.
    let textContent = "";
    const toolCallParts: Array<{
      type: "tool-call";
      toolCallId: string;
      toolName: string;
      input: unknown;
    }> = [];
    const pendingExecutions: Array<{ id: string; name: string; input: unknown }> = [];

    for await (const { type, data } of readDataStream(resp.body!)) {
      if (type === StreamEvent.TextDelta) {
        // Text delta
        const chunk = data as string;
        onTextChunk(chunk);
        textContent += chunk;
      } else if (type === StreamEvent.ToolCallStart) {
        // Tool-call start — args are about to stream in
        const { toolCallId, toolName } = data as { toolCallId: string; toolName: string };
        onToolStart?.(toolCallId, toolName);
      } else if (type === StreamEvent.ToolCall) {
        // Complete tool call (args fully received)
        const { toolCallId, toolName, args } = data as {
          toolCallId: string;
          toolName: string;
          args: unknown;
        };
        onToolCall?.(toolCallId, toolName, args);
        toolCallParts.push({ type: "tool-call", toolCallId, toolName, input: args });
        pendingExecutions.push({ id: toolCallId, name: toolName, input: args });
      } else if (type === StreamEvent.Error) {
        // Server-side error
        throw new Error(data as string);
      }
    }

    // No tool calls → model is done
    if (pendingExecutions.length === 0) break;

    // Append the assistant turn (text + tool calls) to the history
    type AssistantPart =
      | { type: "text"; text: string }
      | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown };

    const assistantContent: AssistantPart[] = [];
    if (textContent) assistantContent.push({ type: "text", text: textContent });
    assistantContent.push(...toolCallParts);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentMessages = [...currentMessages, { role: "assistant", content: assistantContent } as any];

    // Execute each tool locally (in the browser) and collect results
    type ToolResultPart = {
      type: "tool-result";
      toolCallId: string;
      toolName: string;
      output: unknown;
    };
    const toolResultContent: ToolResultPart[] = [];

    for (const tc of pendingExecutions) {
      const t = tools[tc.name];
      if (!t?.execute) continue;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const output = await t.execute(tc.input as any, { toolCallId: tc.id, messages: currentMessages, abortSignal });
        onToolResult?.(tc.id, tc.name, output);
        toolResultContent.push({ type: "tool-result", toolCallId: tc.id, toolName: tc.name, output });
      } catch (err) {
        const output = { success: false, error: String(err) };
        onToolResult?.(tc.id, tc.name, output);
        toolResultContent.push({ type: "tool-result", toolCallId: tc.id, toolName: tc.name, output });
      }
    }

    // Append the tool results turn so the model can continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentMessages = [...currentMessages, { role: "tool", content: toolResultContent } as any];
  }
}
