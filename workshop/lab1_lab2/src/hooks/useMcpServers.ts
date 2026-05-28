"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Tool } from "ai";
import { loadMcpTools, mergeServerTools } from "@/lib/ai/tools/mcp/mcp-tools";
import type { McpServerConfig, McpServerEntry, McpServerStatus, McpToolInfo, McpToolParameter } from "@/types/mcp";

export type { McpServerConfig, McpServerEntry, McpServerStatus, McpToolInfo, McpToolParameter };

/** Extract rich metadata from a Tool's JSON Schema parameters. */
function extractToolInfo(name: string, tool: Tool): McpToolInfo {
  let parameters: McpToolParameter[] = [];
  try {
    // MCP tools wrap their schema with jsonSchema() from @ai-sdk/provider-utils,
    // so the raw JSON Schema is at inputSchema.jsonSchema.
    // Zod-based tools expose toJSONSchema() instead — try both.
    const inputSchema = tool.inputSchema as Record<string, unknown> | undefined;
    const rawSchema =
      (inputSchema?.jsonSchema as Record<string, unknown> | undefined) ??
      ((inputSchema as { toJSONSchema?: () => unknown }).toJSONSchema?.() as Record<string, unknown> | undefined);

    if (rawSchema && typeof rawSchema === "object") {
      const props = rawSchema.properties as Record<string, Record<string, unknown>> | undefined;
      const required = new Set(Array.isArray(rawSchema.required) ? (rawSchema.required as string[]) : []);
      if (props) {
        parameters = Object.entries(props).map(([pName, pSchema]) => ({
          name: pName,
          type: typeof pSchema.type === "string" ? pSchema.type : "unknown",
          description: typeof pSchema.description === "string" ? pSchema.description : undefined,
          required: required.has(pName),
        }));
      }
    }
  } catch {
    // schema extraction is best-effort; silently fall back to empty
  }
  return {
    name,
    description: tool.description,
    parameters,
  };
}

export interface UseMcpServersOptions {
  /**
   * Initial list of MCP server configurations to connect to on mount.
   * Servers are also re-loaded whenever this reference changes.
   */
  servers?: McpServerConfig[];
  /**
   * How long to wait (ms) before automatically retrying servers that
   * failed to connect.  Defaults to 30 000 ms (30 s).  Set to 0 to
   * disable automatic retry.
   */
  retryDelay?: number;
}

export interface UseMcpServersReturn {
  /**
   * Current connection status for each configured server.
   * Reflects real-time loading / error state for user feedback.
   */
  serverEntries: McpServerEntry[];
  /**
   * Flat map of all tools discovered across every connected server.
   * Ready to spread into `useAIChat({ tools })`.
   */
  mcpTools: Record<string, Tool>;
  /**
   * Whether any server is currently in the `"connecting"` state.
   */
  isLoading: boolean;
  /**
   * Re-runs the connection sequence for all configured servers,
   * replacing any previously loaded tools.
   */
  reload: () => void;
}

/**
 * React hook that manages browser-side MCP server connections.
 *
 * Connects to the supplied list of servers in parallel using SSE or
 * Streamable HTTP transport (the only browser-compatible transports —
 * no `stdio`).  Exposes per-server status for user feedback and a
 * merged tool map that can be passed directly to {@link useAIChat}.
 *
 * Failed servers are retried automatically after {@link retryDelay}
 * milliseconds (default 30 s) so that the tool list refreshes whenever
 * a previously-unavailable MCP server comes back online.
 *
 * @example
 * ```tsx
 * const { mcpTools, serverEntries, isLoading } = useMcpServers({
 *   servers: [
 *     { label: "Weather", transport: { type: "sse", url: "https://..." } },
 *   ],
 * });
 *
 * const tools = useMemo(
 *   () => ({ ...createTools(viewerRef), ...mcpTools }),
 *   [viewerRef, mcpTools],
 * );
 * ```
 */
export function useMcpServers({
  servers = [],
  retryDelay = 30_000,
}: UseMcpServersOptions = {}): UseMcpServersReturn {
  const [serverEntries, setServerEntries] = useState<McpServerEntry[]>([]);
  const [mcpTools, setMcpTools] = useState<Record<string, Tool>>({});

  // Serialize servers to a stable string so the main effect only re-runs
  // when the content changes, not just the array reference.  This prevents
  // an infinite loop when the caller passes a new array literal on every
  // render (e.g. the default `mcpServers = []` in ChatPanel).
  const serversKey = JSON.stringify(servers);

  // Keep a ref to the latest servers so the async callbacks always see the
  // current list even if the component re-renders before they finish.
  const serversRef = useRef<McpServerConfig[]>(servers);
  useEffect(() => {
    serversRef.current = servers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serversKey]);

  // Counter-based reload trigger: incrementing it causes the effect to re-run.
  const [reloadCounter, setReloadCounter] = useState(0);

  const reload = useCallback(() => {
    setReloadCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    const currentServers = serversRef.current;
    let cancelled = false;

    void (async () => {
      if (cancelled) return;

      if (currentServers.length === 0) {
        setServerEntries([]);
        setMcpTools({});
        return;
      }

      // Set all servers to "connecting" before starting.
      const entries: McpServerEntry[] = currentServers.map((config) => ({
        config,
        status: "connecting" as McpServerStatus,
        error: null,
        tools: [],
      }));
      setServerEntries([...entries]);

      // Collected tools per server position — stable index for merging.
      // Each .then() callback below only writes to its own slot (entries[i] /
      // toolsByServer[i]), so there is no cross-callback mutation overlap.
      // JavaScript's single-threaded event loop guarantees that .then()
      // callbacks are never interleaved; they always run to completion one at
      // a time, so reads of the shared arrays are always consistent.
      const toolsByServer: Record<string, Tool>[] = currentServers.map(() => ({}));

      const mergeAndPublish = () => {
        // Use mergeServerTools so cross-server name collisions are detected and
        // prefixed the same way as they are inside loadMcpTools itself.
        setMcpTools(mergeServerTools(currentServers, toolsByServer));
      };

      // Connect to all servers in parallel; provide incremental UI updates
      // as each one settles (connected or error).
      const promises = currentServers.map((config, i) => {
        // connectionError is set synchronously inside the onError callback, which
        // loadMcpTools calls during its own execution — before the returned
        // promise resolves.  The .then() handler therefore always sees the final
        // value of connectionError when it runs.
        let connectionError: string | null = null;

        return loadMcpTools([config], (_cfg, error) => {
          const raw = error instanceof Error
            ? error.message
            : "Failed to connect to MCP server";

          const transport = (config.transport as { type?: string }).type;
          if (/405|method not allowed/i.test(raw) && transport === "sse") {
            connectionError = `${raw}. This endpoint likely expects Streamable HTTP; switch transport to http.`;
          } else {
            connectionError = raw;
          }
        }).then((tools) => {
          if (cancelled) return;

          if (connectionError !== null) {
            entries[i] = { config, status: "error", error: connectionError, tools: [] };
          } else {
            // tools is the non-empty result from the successful server.
            const toolInfos = Object.entries(tools).map(([n, t]) => extractToolInfo(n, t));
            entries[i] = { config, status: "connected", error: null, tools: toolInfos };
            toolsByServer[i] = tools;
          }

          setServerEntries([...entries]);
          mergeAndPublish();
        });
      });

      // Final consistency pass once every promise has settled.
      await Promise.allSettled(promises);
      if (!cancelled) {
        setServerEntries([...entries]);
        mergeAndPublish();
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadCounter, serversKey]);

  // Auto-retry any servers that failed to connect so the tool list
  // refreshes when a previously-unavailable MCP server comes back online.
  useEffect(() => {
    if (retryDelay <= 0) return;
    if (!serverEntries.some((e) => e.status === "error")) return;

    const timer = setTimeout(() => {
      setReloadCounter((c) => c + 1);
    }, retryDelay);

    return () => clearTimeout(timer);
  }, [serverEntries, retryDelay]);

  const isLoading = serverEntries.some((e) => e.status === "connecting");

  return { serverEntries, mcpTools, isLoading, reload };
}
