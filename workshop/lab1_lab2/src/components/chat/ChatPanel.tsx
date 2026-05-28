"use client";

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

/**
 * ChatPanel — Lab 1 & 2 starting state.
 *
 * The globe and chat are connected but no Cesium tools are wired yet.
 * Asking "fly to Paris" will produce a text-only reply — the globe won't move.
 *
 * ─── Lab 1 Exercise ───────────────────────────────────────────────────────
 *   1. Review src/lib/cesium/camera.ts — it is pre-populated, no edits needed.
 *   2. Uncomment src/lib/ai/tools/cesium/camera-tools.ts to activate the flyTo tool.
 *   3. Import useCesiumViewer, createCameraTools, and useMemo:
 *        import { useCesiumViewer } from "@/hooks/useCesiumViewer";
 *        import { createCameraTools } from "@/lib/ai/tools/cesium/camera-tools";
 *        import { useMemo } from "react";
 *   4. Inside the component, get the viewer ref and build tools:
 *        const { viewerRef } = useCesiumViewer();
 *        const tools = useMemo(() => createCameraTools(viewerRef), [viewerRef]);
 *   5. Pass tools to useAIChat({ tools }) instead of the empty object.
 * ──────────────────────────────────────────────────────────────────────────
 *
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
 * Step 5: Pass registry.getAll() and registry.getOrigins() to useAIChat:
 *   const { messages, status, error, sendMessage, abort, retry } = useAIChat({
 *     tools: registry.getAll(),
 *     toolOrigins: registry.getOrigins(),
 *   });
 * ──────────────────────────────────────────────────────────────────────────
 */
export function ChatPanel() {
  // No tools wired yet — the assistant can only answer with text.
  const { messages, status, error, sendMessage, abort, retry } = useAIChat({
    tools: {},
  });
  const { isOnline } = useNetworkStatus();

  const isStreaming = status === "loading" || status === "streaming";

  return (
    <div className="bg-background flex h-full flex-col">
      <header className="border-border shrink-0 border-b px-4 py-3">
        <h1 className="text-base font-semibold tracking-tight">
          Cesium AI — Lab 1 & 2
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
