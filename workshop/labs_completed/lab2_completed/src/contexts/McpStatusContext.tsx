"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { McpServerConfig, McpServerEntry } from "@/types/mcp";
import type { Tool } from "ai";
import { useMcpServers } from "@/hooks/useMcpServers";

/** localStorage key used to persist the user-managed server list. */
const STORAGE_KEY = "cesium-mcp-servers-lab1";

/**
 * Load servers from localStorage and merge with env-configured defaults.
 *
 * Merge rule: stored list takes precedence; any env default whose label is not
 * already present in the stored list is appended so newly-added defaults
 * automatically appear on the next page load.
 *
 * Returns `envDefaults` unchanged when running on the server (no `window`)
 * or when localStorage has never been written.  Clears corrupt data and falls
 * back to `envDefaults` on a JSON parse error.
 */
function loadStoredServers(envDefaults: McpServerConfig[]): McpServerConfig[] {
  if (typeof window === "undefined") return envDefaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return envDefaults;
    const stored: unknown = JSON.parse(raw);
    if (!Array.isArray(stored)) {
      localStorage.removeItem(STORAGE_KEY);
      return envDefaults;
    }
    // Validate shape before casting: each entry must have a label (string)
    // and a transport (object) — corrupt or tampered data is dropped.
    const valid = (stored as unknown[]).filter(
      (s): s is McpServerConfig =>
        typeof (s as McpServerConfig)?.label === "string" &&
        typeof (s as McpServerConfig)?.transport === "object" &&
        (s as McpServerConfig)?.transport !== null,
    );
    // Merge: stored list first, then any env defaults not yet present (by label).
    const storedLabels = new Set(valid.map((s) => s.label));
    return [
      ...valid,
      ...envDefaults.filter((d) => !storedLabels.has(d.label)),
    ];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return envDefaults;
  }
}

export interface McpStatus {
  /** Current connection state for each configured MCP server. */
  serverEntries: McpServerEntry[];
  /** Flat map of all tools discovered across every connected MCP server. */
  mcpTools: Record<string, Tool>;
  /** Whether any server is currently in the "connecting" state. */
  isLoading: boolean;
  /** The current list of configured MCP servers (managed at runtime). */
  servers: McpServerConfig[];
  /**
   * Replace the server list.  The new list is persisted to localStorage and
   * triggers a reconnection cycle via {@link useMcpServers}.
   */
  setServers: (servers: McpServerConfig[]) => void;
  /**
   * Force a reconnection attempt for all configured servers.
   * Useful after editing the list or recovering from errors.
   */
  reload: () => void;
}

const McpStatusContext = createContext<McpStatus>({
  serverEntries: [],
  mcpTools: {},
  isLoading: false,
  servers: [],
  setServers: () => undefined,
  reload: () => undefined,
});

export interface McpStatusProviderProps {
  /**
   * Env-configured MCP server defaults.  These are merged with any
   * user-managed servers loaded from localStorage on mount.
   * Passed to {@link useMcpServers} as the initial list.
   */
  servers?: McpServerConfig[];
  children: React.ReactNode;
}

/**
 * Provides live MCP connection state to the subtree.
 *
 * Mount this once at the application root (e.g. in `page.tsx`) so that both
 * {@link StatusBar} and {@link ChatPanel} share the same connection state
 * without each managing their own {@link useMcpServers} instance.
 *
 * The server list is persisted to `localStorage` (key: `cesium-mcp-servers`)
 * and is merged with the env-configured defaults on mount.  Consumers can
 * add, remove, or reload servers at runtime via the context methods.
 */
export function McpStatusProvider({
  servers: envDefaults = [],
  children,
}: McpStatusProviderProps) {
  // Initialise synchronously from env defaults; load from localStorage in an
  // effect to avoid SSR/hydration mismatches.
  const [servers, setServersState] = useState<McpServerConfig[]>(envDefaults);

  // Load localStorage on the client after first render.
  // We intentionally run this only once on mount: the stored list is the
  // source of truth after the initial merge, and re-running on every
  // envDefaults reference change would overwrite user edits.  envDefaults
  // is passed as `servers={MCP_SERVERS}` from page.tsx where MCP_SERVERS is
  // a module-level constant, so in practice it never changes between renders.
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const merged = loadStoredServers(envDefaults);
    setServersState(merged);
    // Persist the merged list so new env defaults are saved immediately.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Storage quota exceeded or private-browsing restrictions — ignore.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Update the server list and persist to localStorage. */
  const setServers = useCallback((next: McpServerConfig[]) => {
    setServersState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota / security errors.
    }
  }, []);

  const { serverEntries, mcpTools, isLoading, reload } = useMcpServers({
    servers,
  });

  return (
    <McpStatusContext.Provider
      value={{ serverEntries, mcpTools, isLoading, servers, setServers, reload }}
    >
      {children}
    </McpStatusContext.Provider>
  );
}

/**
 * Returns the live MCP connection state provided by the nearest
 * {@link McpStatusProvider}.  Falls back to empty defaults if no provider is
 * present in the tree (e.g. in isolated tests or Storybook stories).
 */
export function useMcpStatus(): McpStatus {
  return useContext(McpStatusContext);
}
