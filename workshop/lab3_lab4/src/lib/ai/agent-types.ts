import type { ModelMessage, Tool } from "ai";

/** Fired for every text fragment streamed back from the model. */
export type OnTextChunk = (chunk: string) => void;
/** Fired when the model begins emitting a tool call (arguments start streaming). */
export type OnToolStart = (toolCallId: string, toolName: string) => void;
/** Fired when a tool call is fully received and ready to execute. */
export type OnToolCall = (toolCallId: string, toolName: string, input: unknown) => void;
/** Fired after a tool finishes executing locally, with its output. */
export type OnToolResult = (toolCallId: string, toolName: string, output: unknown) => void;

export interface ChatOptions {
  messages: ModelMessage[];
  tools: Record<string, Tool>;
  onTextChunk: OnTextChunk;
  maxSteps?: number;
  abortSignal?: AbortSignal;
  viewerContext?: string;
  onToolStart?: OnToolStart;
  onToolCall?: OnToolCall;
  onToolResult?: OnToolResult;
}

/** A tool definition reduced to the JSON the server-side route handler needs. */
export interface SerializedTool {
  description?: string;
  inputSchema: unknown;
}

/** A tool call requested by the model, ready to be executed in the browser. */
export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  input: unknown;
}

/** The result of executing a single tool call, sent back to the model. */
export interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  output: { type: "json"; value: unknown } | { type: "error-text"; value: string };
}

/** A part of an assistant turn: either streamed text or a tool call. */
export type AssistantMessagePart = { type: "text"; text: string } | ToolCallPart;

/** An HTTP error from the chat route, annotated with the response status code. */
export interface APIError extends Error {
  statusCode?: number;
}
