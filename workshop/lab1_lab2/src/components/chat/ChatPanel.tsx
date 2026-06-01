"use client";

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
// 👇 LAB 1 — STEP 1: add imports here (useMemo, useCesiumViewer, createCameraTools)
// 👇 LAB 2 — STEP 1: add imports here (useMcpServers, MCP_SERVERS, ToolRegistry)

/**
 * ChatPanel — Lab 1 & 2 starting state.
 *
 * The globe and chat are connected but no Cesium tools are wired yet.
 * Asking "fly to Paris" will produce a text-only reply — the globe won't move.
 *
 * Follow the inline "👇 LAB 1" / "👇 LAB 2" markers below — they show the
 * exact location for each change. Full step details are in LAB_1.md
 * (Section 5) and LAB_2.md (Section 4).
 */
export function ChatPanel() {
  // 👇 LAB 1 — STEP 2 (first half): build the Cesium tools here
  //    const { viewerRef } = useCesiumViewer();
  //    const tools = useMemo(() => createCameraTools(viewerRef), [viewerRef]);
  //
  // 👇 LAB 2 — STEP 2: discover MCP tools here
  //    const { mcpTools } = useMcpServers({ servers: MCP_SERVERS });
  //
  // 👇 LAB 2 — STEP 3: merge Cesium + MCP tools into a registry here
  //    const registry = useMemo(
  //      () => new ToolRegistry().registerMcp(mcpTools).registerCesium(tools),
  //      [tools, mcpTools],
  //    );

  // 👇 LAB 1 — STEP 2 (second half): replace `tools: {}` with `tools`.
  // 👇 LAB 2 — STEP 4: replace with `tools: registry.getAll()` and add
  //    `toolOrigins: registry.getOrigins()`.
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
