import type { OnTextChunk, OnToolCall, OnToolStart, ToolCallPart } from "./agent-types";

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

/** One parsed line of the AI SDK data-stream protocol. */
interface DataStreamLine {
  type: string;
  data: unknown;
}

/** Parse one line of the AI SDK data-stream protocol (e.g. `0:"hello"`). */
function parseLine(line: string): DataStreamLine | null {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) return null;
  try {
    return {
      type: line.slice(0, separatorIndex),
      data: JSON.parse(line.slice(separatorIndex + 1)),
    };
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
): AsyncGenerator<DataStreamLine> {
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

/** The text and tool calls produced by a single chat step. */
export interface StreamResult {
  textContent: string;
  toolCalls: ToolCallPart[];
}

/**
 * Consume the data-stream response body, firing callbacks for each event.
 * Returns the accumulated text content plus any tool calls that need executing.
 */
export async function processStream(
  body: ReadableStream<Uint8Array>,
  onTextChunk: OnTextChunk,
  onToolStart?: OnToolStart,
  onToolCall?: OnToolCall,
): Promise<StreamResult> {
  let textContent = "";
  const toolCalls: ToolCallPart[] = [];

  for await (const { type, data } of readDataStream(body)) {
    if (type === StreamEvent.TextDelta) {
      const chunk = data as string;
      onTextChunk(chunk);
      textContent += chunk;
    } else if (type === StreamEvent.ToolCallStart) {
      const { toolCallId, toolName } = data as { toolCallId: string; toolName: string };
      onToolStart?.(toolCallId, toolName);
    } else if (type === StreamEvent.ToolCall) {
      const { toolCallId, toolName, args } = data as { toolCallId: string; toolName: string; args: unknown };
      onToolCall?.(toolCallId, toolName, args);
      toolCalls.push({ type: "tool-call", toolCallId, toolName, input: args });
    } else if (type === StreamEvent.Error) {
      throw new Error(data as string);
    }
  }

  return { textContent, toolCalls };
}
