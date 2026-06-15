"use client";

import { useState } from "react";
import { Globe, WifiOff } from "lucide-react";
import { useMcpStatus } from "@/contexts/McpStatusContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { McpServerPanel } from "@/components/mcp/McpServerPanel";
import { CesiumToolsPanel } from "@/components/cesium/CesiumToolsPanel";
import { createCesiumToolGroups } from "@/lib/ai/tools";
import { DEFAULT_MODELS } from "@/lib/ai/models";
import type { AIProvider } from "@/lib/ai/models";

// Cesium tool definitions are static for the lifetime of the app.
const CESIUM_TOOL_COUNT = createCesiumToolGroups({ current: null }).reduce(
  (count, group) => count + Object.keys(group.tools).length,
  0,
);

/**
 * StatusBar — compact footer showing live AI and MCP connection state.
 *
 * Displays:
 * - MCP server connection status with a colour-coded indicator dot
 * - Number of tools discovered from connected MCP servers
 * - Active LLM provider and model name (resolved from env vars at build time)
 *
 * Updates reactively whenever {@link McpStatusContext} changes.
 */
export function StatusBar() {
  const { serverEntries, mcpTools } = useMcpStatus();
  const { isOnline } = useNetworkStatus();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCesiumPanelOpen, setIsCesiumPanelOpen] = useState(false);

  // AI_PROVIDER and AI_MODEL are exposed to the client via the `env` section of
  // next.config.ts, so process.env access is safe in browser bundles.
  const provider = (process.env.AI_PROVIDER ?? "openai") as AIProvider;
  const modelName =
    process.env.AI_MODEL || DEFAULT_MODELS[provider] || provider;

  const totalServers = serverEntries.length;
  const connectedCount = serverEntries.filter(
    (e) => e.status === "connected",
  ).length;
  const toolCount = Object.keys(mcpTools).length;

  const isConnecting = serverEntries.some((e) => e.status === "connecting");
  const hasErrors = serverEntries.some((e) => e.status === "error");

  let dotClass: string;
  let statusText: string;

  if (totalServers === 0) {
    dotClass = "text-muted-foreground";
    statusText = "No MCP servers";
  } else if (isConnecting) {
    dotClass = "text-yellow-500";
    statusText = `Connecting… (${connectedCount}/${totalServers})`;
  } else if (hasErrors) {
    dotClass = "text-yellow-500";
    statusText = `${connectedCount}/${totalServers} connected`;
  } else {
    dotClass = "text-green-500";
    statusText = `${totalServers} server${totalServers > 1 ? "s" : ""} connected`;
  }

  return (
    <>
      {/* MCP server management slide-over */}
      {isPanelOpen && <McpServerPanel onClose={() => setIsPanelOpen(false)} />}
      {/* Cesium tools slide-over */}
      {isCesiumPanelOpen && <CesiumToolsPanel onClose={() => setIsCesiumPanelOpen(false)} />}

      <footer className="bg-muted/50 border-border flex h-7 shrink-0 items-center gap-3 border-t px-3">
        {/* Offline indicator — takes precedence over MCP status when offline */}
        {!isOnline ? (
          <span
            role="status"
            aria-live="polite"
            className="text-destructive flex items-center gap-1 text-xs"
          >
            <WifiOff className="size-3 shrink-0" aria-hidden="true" />
            <span>Offline</span>
          </span>
        ) : (
          /* MCP connection indicator — clicking opens the management panel */
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="flex cursor-pointer items-center gap-1 text-xs hover:opacity-80"
            aria-label="Open MCP server panel"
            title="Manage MCP servers"
          >
            <span className={dotClass} aria-hidden="true">
              ●
            </span>
            <span className="text-muted-foreground">{statusText}</span>
          </button>
        )}

        {/* MCP tool count — only shown when at least one tool is available */}
        {toolCount > 0 && (
          <span className="text-muted-foreground text-xs">
            {toolCount} MCP tool{toolCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Cesium tools button */}
        <button
          type="button"
          onClick={() => setIsCesiumPanelOpen(true)}
          className="flex cursor-pointer items-center gap-1 text-xs hover:opacity-80"
          aria-label="Open Cesium tools panel"
          title="View Cesium tools"
        >
          <Globe className="text-muted-foreground size-3 shrink-0" aria-hidden="true" />
          <span className="text-muted-foreground">{CESIUM_TOOL_COUNT} Cesium tool{CESIUM_TOOL_COUNT !== 1 ? "s" : ""}</span>
        </button>

        {/* Model info — right-aligned */}
        <span className="text-muted-foreground ml-auto text-xs">
          {provider} / {modelName}
        </span>
      </footer>
    </>
  );
}
