"use client";

import dynamic from "next/dynamic";
import { CesiumProvider } from "@/components/cesium/CesiumProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { McpStatusProvider } from "@/contexts/McpStatusContext";
import { MCP_SERVERS } from "@/lib/mcp-servers.config";

// CesiumJS must only render client-side (no SSR).
const CesiumViewer = dynamic(() => import("@/components/cesium/CesiumViewer"), {
  ssr: false,
});

export default function Home() {
  return (
    <CesiumProvider>
      <McpStatusProvider servers={MCP_SERVERS}>
        <AppShell
          chatPanel={
            <ErrorBoundary>
              <ChatPanel />
            </ErrorBoundary>
          }
          viewerPanel={
            <ErrorBoundary
              fallback={
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
                  <p className="text-sm font-medium">Failed to load the 3D viewer</p>
                  <p className="text-muted-foreground max-w-xs text-xs">
                    Reload the page to try again. If the problem persists,
                    check that WebGL is enabled in your browser.
                  </p>
                </div>
              }
            >
              <CesiumViewer />
            </ErrorBoundary>
          }
        />
      </McpStatusProvider>
    </CesiumProvider>
  );
}
