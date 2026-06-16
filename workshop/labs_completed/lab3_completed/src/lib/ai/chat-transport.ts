import { asSchema } from "ai";
import type { ModelMessage, Tool } from "ai";
import type { APIError, SerializedTool } from "./agent-types";

/**
 * Serialise tool definitions to plain JSON so they can be sent to the
 * server-side /api/chat route handler.  Only the schema is sent — the
 * execute function stays in the browser.
 */
export function serializeTools(
  tools: Record<string, Tool>,
): Record<string, SerializedTool> {
  const serialized: Record<string, SerializedTool> = {};
  for (const [name, tool] of Object.entries(tools)) {
    serialized[name] = {
      description: tool.description,
      // `inputSchema` may be a raw ZodSchema or a wrapped Schema<T>.
      // `asSchema()` normalises either form and exposes the `.jsonSchema` getter.
      inputSchema: asSchema(tool.inputSchema).jsonSchema,
    };
  }
  return serialized;
}

/** POST one step to /api/chat and return the response, throwing on HTTP errors. */
export async function fetchChatStep(
  messages: ModelMessage[],
  viewerContext: string | undefined,
  serializedTools: Record<string, SerializedTool>,
  abortSignal: AbortSignal | undefined,
): Promise<Response> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, viewerContext, tools: serializedTools }),
    signal: abortSignal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(
      (body as { error?: string }).error ?? `Request failed with status ${response.status}`,
    ) as APIError;
    error.statusCode = response.status;
    throw error;
  }

  return response;
}
