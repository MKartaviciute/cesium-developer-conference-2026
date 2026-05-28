"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "./StatusBar";

const PANEL_MIN_WIDTH_PX = 240;

export interface AppShellProps {
  chatPanel: React.ReactNode;
  viewerPanel: React.ReactNode;
  defaultLeftPercent?: number;
}

/**
 * AppShell — main application layout with a resizable split-pane view.
 */
export function AppShell({
  chatPanel,
  viewerPanel,
  defaultLeftPercent = 30,
}: AppShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const isDragging = useRef(false);

  const clampPercent = useCallback((rawPercent: number) => {
    const container = containerRef.current;
    if (!container) return rawPercent;
    const totalWidth = container.offsetWidth;
    const minPercent = (PANEL_MIN_WIDTH_PX / totalWidth) * 100;
    const maxPercent = 100 - minPercent;
    return Math.min(Math.max(rawPercent, minPercent), maxPercent);
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(clampPercent(rawPercent));
    },
    [clampPercent],
  );

  const stopDrag = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [handlePointerMove, stopDrag]);

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div ref={containerRef} className="flex min-h-0 flex-1">
        <div
          className="flex min-h-0 flex-col overflow-hidden"
          style={{ width: `${leftPercent}%` }}
        >
          {chatPanel}
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onPointerDown={startDrag}
          className="bg-border hover:bg-ring active:bg-ring relative z-10 w-1 shrink-0 cursor-col-resize touch-none transition-colors"
        >
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-1 py-2">
            <span className="bg-muted-foreground/40 block h-1 w-1 rounded-full" />
            <span className="bg-muted-foreground/40 block h-1 w-1 rounded-full" />
            <span className="bg-muted-foreground/40 block h-1 w-1 rounded-full" />
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {viewerPanel}
        </div>
      </div>

      {/* Status bar — shows MCP connection state */}
      <StatusBar />
    </div>
  );
}
