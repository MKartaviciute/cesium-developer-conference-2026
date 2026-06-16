import { streamText, jsonSchema } from "ai";
import { getModel } from "@/server/ai/provider";
import { buildSystemPrompt } from "@/server/ai/system-prompt";
import { StreamEvent, ChunkType } from "@/lib/ai/stream-protocol";

// Route Handlers are always dynamic (no caching) — explicit for clarity.
export const dynamic = "force-dynamic";

interface SerializedToolSchema {
  description?: string;
  inputSchema: Record<string, unknown>;
}

interface ChatRequestBody {
  messages: unknown[];
  viewerContext?: string;
  tools?: Record<string, SerializedToolSchema>;
}

/**
 * POST /api/chat
 *
 * Runs one step of inference server-side so that API keys never reach the
 * browser.  Tools are passed as serialised JSON schemas (no execute function)
 * so that tool-call events stream back to the client for local execution.
 *
 * Request body:
 *   messages      — ModelMessage[] (serialised)
 *   viewerContext — optional string injected after the system prompt
 *   tools         — Record<toolName, { description?, inputSchema: JSONSchema }>
 *
 * Response: newline-delimited data-stream protocol
 *   0:"text chunk"      — text delta
 *   b:{toolCallId,...}  — tool-call start
 *   9:{toolCallId,...}  — complete tool call (args fully received)
 *   3:"error message"   — error
 */
export async function POST(req: Request) {
  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, viewerContext, tools: toolSchemas = {} } = body;

  if (!Array.isArray(messages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 });
  }

  const base = buildSystemPrompt();
  const system = viewerContext ? `${base}\n\n${viewerContext}` : base;

  // Re-hydrate tool definitions from JSON schemas.
  // No execute function — tool calls stream back to the client for local execution.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {};
  for (const [name, schema] of Object.entries(toolSchemas)) {
    tools[name] = {
      description: schema.description,
      inputSchema: jsonSchema(schema.inputSchema),
    };
  }

  const result = streamText({
    model: getModel(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    system,
    ...(Object.keys(tools).length > 0 ? { tools } : {}),
  });

  // Stream the AI SDK data-stream protocol so the client can parse tool calls.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.fullStream) {
          let line: string | null = null;

          if (chunk.type === ChunkType.TextDelta) {
            line = `${StreamEvent.TextDelta}:${JSON.stringify(chunk.text)}\n`;
          } else if (chunk.type === ChunkType.ToolInputStart) {
            line = `${StreamEvent.ToolCallStart}:${JSON.stringify({ toolCallId: chunk.id, toolName: chunk.toolName })}\n`;
          } else if (chunk.type === ChunkType.ToolCall) {
            // AI SDK fullStream uses `input`; map to `args` for the wire format
            line = `${StreamEvent.ToolCall}:${JSON.stringify({ toolCallId: chunk.toolCallId, toolName: chunk.toolName, args: chunk.input })}\n`;
          } else if (chunk.type === ChunkType.Error) {
            line = `${StreamEvent.Error}:${JSON.stringify(String(chunk.error))}\n`;
          }

          if (line) controller.enqueue(encoder.encode(line));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`${StreamEvent.Error}:${JSON.stringify(String(err))}\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
