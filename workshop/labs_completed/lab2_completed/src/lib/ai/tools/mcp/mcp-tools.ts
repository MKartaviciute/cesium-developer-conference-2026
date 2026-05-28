"use client";

import { createMCPClient } from "@ai-sdk/mcp";
import type { Tool } from "ai";
import type { McpServerConfig } from "@/types/mcp";

/**
 * Wraps every MCP tool's `execute` function so that network or protocol
 * errors are returned as `{ success: false, message }` — the same shape
 * used by CesiumJS tools — instead of propagating up the call stack.
 */
function applyMcpErrorHandling(
  tools: Record<string, Tool>,
): Record<string, Tool> {
  const result: Record<string, Tool> = {};
  for (const [name, t] of Object.entries(tools)) {
    if (typeof t.execute !== "function") {
      result[name] = t;
      continue;
    }
    const original = t.execute as (input: unknown, options: unknown) => Promise<unknown>;
    result[name] = {
      ...t,
      execute: async (input: unknown, options: unknown) => {
        try {
          return await original(input, options);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : `${name} failed unexpectedly`;
          console.error(`[MCP Tool: ${name}]`, err);
          return { success: false, message };
        }
      },
    } as Tool;
  }
  return result;
}

/**
 * Merges tool maps from multiple MCP servers into a single flat map with
 * collision-aware prefixing.
 *
 * - **No collision**: the tool is inserted under its original name.
 * - **Collision** (same name from ≥ 2 servers): each copy is prefixed with a
 *   sanitised form of its server label (`label.replace(/\W+/g, "_").toLowerCase()`).
 *   If two server labels sanitise to the same string a numeric suffix is appended
 *   (`_2`, `_3`, …) to guarantee uniqueness.  A `console.warn` is emitted for
 *   every collision.
 *
 * @param serverConfigs - Ordered list of server configurations (parallel to `toolsByServer`).
 * @param toolsByServer - Tools discovered from each server, in the same order as `serverConfigs`.
 * @returns A flat `Record<string, Tool>` ready to pass to the AI agent.
 */
export function mergeServerTools(
  serverConfigs: McpServerConfig[],
  toolsByServer: Array<Record<string, Tool>>,
): Record<string, Tool> {
  // Find tool names exposed by more than one server — these need prefixing.
  const nameCount = new Map<string, number>();
  for (const tools of toolsByServer) {
    for (const name of Object.keys(tools)) {
      nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
    }
  }
  const isColliding = (name: string) => (nameCount.get(name) ?? 0) > 1;

  // Derive a unique prefix per server from its label.
  // If two labels sanitise to the same string (e.g. "Weather-API" and
  // "Weather_API" → "weather_api") a numeric suffix (_2, _3, …) is appended.
  const usedPrefixes = new Set<string>();
  const prefixes = serverConfigs.map(({ label }) => {
    const base = label.replace(/\W+/g, "_").toLowerCase();
    let prefix = base;
    for (let n = 2; usedPrefixes.has(prefix); n++) prefix = `${base}_${n}`;
    usedPrefixes.add(prefix);
    return prefix;
  });

  // Merge all tools into a single flat map, prefixing any colliding names.
  const merged: Record<string, Tool> = {};
  for (let i = 0; i < serverConfigs.length; i++) {
    for (const [name, tool] of Object.entries(toolsByServer[i])) {
      if (isColliding(name)) {
        const prefixedName = `${prefixes[i]}_${name}`;
        console.warn(
          `[MCP] Tool name collision: "${name}" from "${serverConfigs[i].label}" ` +
            `registered as "${prefixedName}".`,
        );
        merged[prefixedName] = tool;
      } else {
        merged[name] = tool;
      }
    }
  }

  return merged;
}

/** Tools discovered from a single successfully-connected MCP server. */
interface ServerToolResult {
  config: McpServerConfig;
  tools: Record<string, Tool>;
}

/**
 * Loads AI SDK tools from one or more browser-compatible MCP servers.
 *
 * All servers are connected in parallel.  Each server is connected using
 * SSE or Streamable HTTP transport — the only transports available in the
 * browser environment (`stdio` is not supported in Phase A, see
 * Architecture §8.3).
 *
 * Tools from all servers are merged via {@link mergeServerTools} which
 * handles name collisions by prefixing with the server label.
 *
 * **CORS requirement:** The remote MCP server must respond with an
 * `Access-Control-Allow-Origin` header that matches the application
 * origin.  Most public MCP servers omit this header because they expect
 * server-to-server traffic.
 *
 * @param serverConfigs - List of server configurations to connect to.
 * @param onError - Optional callback invoked when a single server fails
 *   to connect.  The error is reported but processing continues for the
 *   remaining servers.
 * @returns A flat `Record<string, Tool>` ready to pass to the AI agent.
 */
export async function loadMcpTools(
  serverConfigs: McpServerConfig[],
  onError?: (config: McpServerConfig, error: unknown) => void,
): Promise<Record<string, Tool>> {
  // Connect to all servers simultaneously.
  const settled = await Promise.allSettled(
    serverConfigs.map(async (config): Promise<ServerToolResult> => {
      // Browser can only use SSE or Streamable HTTP transport.
      // Inject a bound fetch to avoid "Illegal invocation" — the SDK stores
      // `globalThis.fetch` as a plain reference and later calls it with `this`
      // set to the transport instance rather than `window`, which some browsers
      // reject.  Binding it to `globalThis` ensures the correct receiver.
      const t = config.transport as Record<string, unknown>;
      const transport =
        t.type === "http" || t.type === "sse"
          ? { ...t, fetch: fetch.bind(globalThis) }
          : config.transport;
      const client = await createMCPClient({
        transport: transport as typeof config.transport,
      });
      const tools = await client.tools();
      return { config, tools };
    }),
  );

  // Separate successes from failures and invoke onError for the latter.
  const successes: ServerToolResult[] = [];
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === "rejected") {
      onError?.(serverConfigs[i], result.reason);
    } else {
      successes.push(result.value);
    }
  }

  const configs = successes.map((s) => s.config);
  const toolMaps = successes.map((s) => s.tools);
  return applyMcpErrorHandling(mergeServerTools(configs, toolMaps));
}