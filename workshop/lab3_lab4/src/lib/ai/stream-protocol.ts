/**
 * Data-stream protocol event codes used by the AI SDK wire format.
 * Values must match the protocol exactly (e.g. a line like `0:"hello"`).
 *
 * Shared between the server-side route handler (route.ts) and the
 * client-side agent (agent.ts) so both sides stay in sync.
 */
export const StreamEvent = {
  TextDelta: "0",
  ToolCallStart: "b",
  ToolCall: "9",
  Error: "3",
} as const;

/**
 * Chunk type strings emitted by the AI SDK `fullStream` async iterator.
 * Centralised here so changes to the SDK version surface in one place.
 */
export const ChunkType = {
  TextDelta: "text-delta",
  ToolInputStart: "tool-input-start",
  ToolCall: "tool-call",
  Error: "error",
} as const;
