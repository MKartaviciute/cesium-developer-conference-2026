"use client";

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useCesiumViewer } from "@/hooks/useCesiumViewer";
import { createCameraTools } from "@/lib/ai/tools/cesium/camera-tools";
import { useMemo } from "react";
import { useMcpServers } from "@/hooks/useMcpServers";
import { MCP_SERVERS } from "@/lib/mcp-servers.config";
import { ToolRegistry } from "@/lib/ai/tools";

/**
 * ─── Lab 2 Exercise ───────────────────────────────────────────────────────
 * Wire MCP tools into the chat so the assistant can call your MCP server.
 *
 * Step 1: Import useMcpServers and MCP_SERVERS:
 *   import { useMcpServers } from "@/hooks/useMcpServers";
 *   import { MCP_SERVERS } from "@/lib/mcp-servers.config";
 *
 * Step 2: Import ToolRegistry:
 *   import { ToolRegistry } from "@/lib/ai/tools";
 *
 * Step 3: Add the hook call inside the component:
 *   const { mcpTools } = useMcpServers({ servers: MCP_SERVERS });
 *
 * Step 4: Create a registry merging MCP + Cesium tools:
 *   const registry = useMemo(() => {
 *     return new ToolRegistry().registerMcp(mcpTools).registerCesium(tools);
 *   }, [tools, mcpTools]);
 *
 * Step 5: Pass registry.getAll() to useAIChat instead of tools.
 * ──────────────────────────────────────────────────────────────────────────
 */
export function ChatPanel() {
  const { viewerRef } = useCesiumViewer();
  const tools = useMemo(() => createCameraTools(viewerRef), [viewerRef]);

  const { mcpTools } = useMcpServers({ servers: MCP_SERVERS });

  const registry = useMemo(() => {
  return new ToolRegistry().registerMcp(mcpTools).registerCesium(tools);
  }, [tools, mcpTools]);

  const { messages, status, error, sendMessage, abort, retry } = useAIChat({
    tools: registry.getAll(),
    toolOrigins: registry.getOrigins(),
  });

  const { isOnline } = useNetworkStatus();

  const isStreaming = status === "loading" || status === "streaming";

  return (
    <div className="bg-background flex h-full flex-col">
      <header className="border-border shrink-0 border-b px-4 py-3">
        <h1 className="text-base font-semibold tracking-tight">
          Cesium AI — Lab 2
        </h1>
      </header>

      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-muted text-muted-foreground flex shrink-0 items-center gap-2 border-b px-4 py-2 text-xs"
        >
          <WifiOff className="size-3.5 shrink-0" aria-hidden="true" />
          <span>You are offline. Check your network connection.</span>
        </div>
      )}

      {status === "error" && error && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-destructive/30 bg-destructive/10 text-destructive flex shrink-0 items-start gap-2 border-b px-4 py-2.5 text-xs"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive h-auto shrink-0 gap-1 py-0 text-xs"
            onClick={retry}
            aria-label="Retry last message"
          >
            <RefreshCw className="size-3" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      <ChatMessages messages={messages} status={status} />

      <ChatInput
        onSend={sendMessage}
        onAbort={abort}
        disabled={isStreaming || !isOnline}
        isStreaming={isStreaming}
      />
    </div>
  );
}
