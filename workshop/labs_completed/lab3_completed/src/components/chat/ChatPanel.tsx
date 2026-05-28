"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useCesiumViewer } from "@/hooks/useCesiumViewer";
import { useMcpStatus } from "@/contexts/McpStatusContext";
import { createCesiumTools, ToolRegistry } from "@/lib/ai/tools";
import { getViewerState } from "@/lib/cesium/viewer-state";
import { buildViewerContext } from "@/lib/ai/prompts/context-builder";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

/**
 * ChatPanel — the main chat container.
 *
 * Wires the `useAIChat` hook to the `ChatMessages` and `ChatInput` components,
 * providing a complete chat experience with streaming responses, auto-scroll,
 * and a typing indicator.
 *
 * Tools are built from the tool registry and receive the live CesiumJS Viewer
 * via closure (see Architecture §8.1, issues #14–#19).  MCP tools are read
 * from the nearest {@link McpStatusProvider} so the same connection state is
 * shared with the {@link StatusBar} (see Architecture §6.3, issue #24).
 */
export function ChatPanel() {
  const { viewerRef } = useCesiumViewer();

  // viewerRef is a stable object — its .current changes but the identity never
  // does.  createCesiumTools only closes over the ref, it does not read .current
  // here, so an empty dep array is correct and avoids the react-hooks/refs warning.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cesiumTools = useMemo(() => createCesiumTools(viewerRef), []);

  // Read MCP tools from the shared McpStatusContext so the StatusBar can
  // display the same connection state without a second useMcpServers call.
  const { mcpTools } = useMcpStatus();

  // Build a unified ToolRegistry so:
  //  - Tool origins are tracked (cesium vs mcp)
  //  - The system prompt can include the MCP catalog dynamically
  //  - Cesium tools win on name collision (registered last)
  const registry = useMemo(() => {
    return new ToolRegistry().registerMcp(mcpTools).registerCesium(cesiumTools);
  }, [cesiumTools, mcpTools]);

  // Synchronously snapshot the globe state right before each LLM request.
  // getViewerState is non-blocking (no I/O), so this adds negligible latency.
  const getViewerContext = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return undefined;
    return buildViewerContext(getViewerState(viewer));
  }, [viewerRef]);

  const toolOrigins = useMemo(
    () => registry.getOrigins(),
    [registry],
  );

  const { messages, status, error, sendMessage, abort, retry } = useAIChat({
    tools: registry.getAll(),
    toolOrigins,
    getViewerContext,
    maxSteps: 80,
    // Large scripted scenarios (e.g. many sequential entity placements) can
    // exceed 2 minutes under provider latency; keep the stream alive longer.
    streamingTimeoutMs: 300_000,
  });
  const { isOnline } = useNetworkStatus();

  const isStreaming = status === "loading" || status === "streaming";

  return (
    <div className="bg-background flex h-full flex-col">
      {/* Header */}
      <header className="border-border shrink-0 border-b px-4 py-3">
        <h1 className="text-base font-semibold tracking-tight">
          Cesium AI Agentic Workflows
        </h1>
      </header>

      {/* Offline banner */}
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

      {/* Error banner */}
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

      {/* Scrollable message list */}
      <ChatMessages messages={messages} status={status} />

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        onAbort={abort}
        disabled={isStreaming || !isOnline}
        isStreaming={isStreaming}
      />
    </div>
  );
}
