"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Navigation,
  Box,
  Layers,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCallInfo } from "@/hooks/useAIChat";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isSuccessful(v: unknown): boolean {
  if (!isRecord(v)) return false;
  // Cesium tools that return { success: true }
  if ("success" in v) return v.success === true;
  // MCP tools return { content: [...] } — presence of a content array means success
  if (Array.isArray(v.content)) return true;
  // List tools return { entities/layers/tilesets/... } without a success flag —
  // treat any array-valued list property as a successful (possibly empty) result.
  for (const key of ["entities", "layers", "tilesets", "animations"]) {
    if (key in v && Array.isArray((v as Record<string, unknown>)[key])) return true;
  }
  return false;
}

function extractErrorMessage(output: unknown, toolName: string): string {
  if (isRecord(output)) {
    if (typeof output.message === "string") return output.message;
    if (typeof output.location === "string") return output.location;
  }
  return `${toolName} failed`;
}

function ErrorCard({
  toolName,
  output,
}: {
  toolName: string;
  output: unknown;
}) {
  return (
    <div className="flex items-start gap-2">
      <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
      <p className="text-sm">{extractErrorMessage(output, toolName)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function toolLabel(toolName: string): string {
  return toolName
    .replace(/_/g, " ")           // snake_case → spaces
    .replace(/([A-Z])/g, " $1")  // camelCase → spaces
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function toolIcon(toolName: string) {
  if (toolName === "flyTo" || toolName === "cameraSetView") {
    return <Navigation className="size-3.5 shrink-0" />;
  }
  if (toolName === "addEntity") {
    return <Box className="size-3.5 shrink-0" />;
  }
  if (toolName === "addGeoJsonLayer") {
    return <Layers className="size-3.5 shrink-0" />;
  }
  return <Wrench className="size-3.5 shrink-0" />;
}

// ---------------------------------------------------------------------------
// Input properties panel
// ---------------------------------------------------------------------------

function InputPanel({ input }: { input: unknown }) {
  if (!isRecord(input)) return null;
  const entries = Object.entries(input);
  if (entries.length === 0) return null;
  return (
    <dl className="space-y-1 border-b border-border pb-2 mb-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-baseline gap-2">
          <dt className="text-muted-foreground min-w-[80px] shrink-0 text-xs capitalize">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </dt>
          <dd className="truncate text-xs font-medium">
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value ?? "—")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Main ToolResultCard component
// ---------------------------------------------------------------------------

export interface ToolResultCardProps {
  toolCall: ToolCallInfo;
}

/**
 * ToolResultCard — renders a single tool invocation as a collapsible rich card.
 *
 * Provides specialised layouts for `flyTo`, `addEntity`, and `addGeoJsonLayer`.
 * All other tools fall back to a generic success/error display.
 * Error outputs are highlighted in destructive colours.
 */
export function ToolResultCard({ toolCall }: ToolResultCardProps) {
  const [open, setOpen] = useState(true);

  const { toolName, output } = toolCall;
  const succeeded = isSuccessful(output);
  const hasOutput = output !== undefined;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border text-sm",
        succeeded || !hasOutput
          ? "border-border bg-card"
          : "border-destructive/40 bg-destructive/5",
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
          "hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          succeeded || !hasOutput ? "text-foreground" : "text-destructive",
        )}
        aria-expanded={open}
      >
        {/* Tool icon */}
        {toolIcon(toolName)}

        {/* Tool label */}
        <span className="flex-1 font-medium">{toolLabel(toolName)}</span>

        {/* Origin badge */}
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            toolCall.origin === "mcp"
              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
          )}
        >
          {toolCall.origin === "mcp" ? "MCP" : "Cesium"}
        </span>

        {/* Status badge */}
        {toolCall.status === "done" ? (
          hasOutput &&
            (succeeded ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
            ) : (
              <AlertCircle className="text-destructive size-3.5 shrink-0" />
            ))
        ) : (
          <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
        )}

        {/* Collapse toggle */}
        {open ? (
          <ChevronUp className="text-muted-foreground size-3.5 shrink-0" />
        ) : (
          <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="border-border border-t px-3 py-2.5">
          {/* Always show input properties */}
          <InputPanel input={toolCall.input} />

          {/* Show loading feedback while execution is in progress */}
          {toolCall.status !== "done" && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 className="size-3 animate-spin" />
              {toolCall.status === "pending" ? "Preparing\u2026" : "Running\u2026"}
            </p>
          )}

          {/* Show output when available */}
          {toolCall.status === "done" && hasOutput && (
            !succeeded ? (
              <ErrorCard toolName={toolName} output={output} />
            ) : (
              <GenericSuccessCard output={output} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function GenericSuccessCard({ output }: { output: unknown }) {
  // MCP tools return { content: [{ type: "text", text: "..." }, ...] }
  if (isRecord(output) && Array.isArray(output.content)) {
    const texts = (output.content as unknown[])
      .filter((c): c is { type: string; text: string } => isRecord(c) && c.type === "text" && typeof c.text === "string")
      .map((c) => c.text);
    if (texts.length === 0) return null;
    return (
      <pre className="text-muted-foreground max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs">
        {texts.join("\n")}
      </pre>
    );
  }

  const entries = isRecord(output)
    ? Object.entries(output).filter(([k]) => k !== "success")
    : [];

  if (entries.length === 0) return null;

  return (
    <dl className="space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-baseline gap-2">
          <dt className="text-muted-foreground min-w-[80px] shrink-0 text-xs capitalize">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </dt>
          <dd className="truncate text-xs font-medium">
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value ?? "—")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
