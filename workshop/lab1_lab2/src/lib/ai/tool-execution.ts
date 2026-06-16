import type { ModelMessage, Tool } from "ai";
import type { OnToolResult, ToolCallPart, ToolResultPart } from "./agent-types";

/** Execute pending tool calls locally (in the browser) and return their results. */
export async function executeTools(
  toolCalls: ToolCallPart[],
  tools: Record<string, Tool>,
  messages: ModelMessage[],
  abortSignal: AbortSignal | undefined,
  onToolResult?: OnToolResult,
): Promise<ToolResultPart[]> {
  const results: ToolResultPart[] = [];

  for (const call of toolCalls) {
    const tool = tools[call.toolName];
    if (!tool?.execute) continue;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = await tool.execute(call.input as any, {
        toolCallId: call.toolCallId,
        messages,
        abortSignal,
      });
      onToolResult?.(call.toolCallId, call.toolName, output);
      results.push({
        type: "tool-result",
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        output: { type: "json", value: output },
      });
    } catch (err) {
      const errorMessage = String(err);
      onToolResult?.(call.toolCallId, call.toolName, { success: false, error: errorMessage });
      results.push({
        type: "tool-result",
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        output: { type: "error-text", value: errorMessage },
      });
    }
  }

  return results;
}
