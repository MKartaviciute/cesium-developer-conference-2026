"use client";

import { useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useMcpStatus } from "@/contexts/McpStatusContext";
import type { McpServerConfig, McpServerEntry } from "@/types/mcp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Transport types available in the browser (no stdio). */
type TransportType = "http" | "sse";

interface McpServerPanelProps {
  /** Called when the user closes the panel. */
  onClose: () => void;
}

/** Extract the URL string from a transport config. */
function transportUrl(config: McpServerConfig): string {
  const t = config.transport as { url?: string };
  return t.url ?? "";
}

/** Extract the transport type from a config. */
function transportType(config: McpServerConfig): TransportType {
  const t = config.transport as { type?: string };
  return t.type === "sse" ? "sse" : "http";
}

/** Status icon for a single server entry. */
function StatusIcon({ entry }: { entry: McpServerEntry }) {
  if (entry.status === "connecting") {
    return (
      <Loader2
        className="size-4 shrink-0 animate-spin text-yellow-500"
        aria-label="Connecting"
      />
    );
  }
  if (entry.status === "connected") {
    return (
      <CheckCircle
        className="size-4 shrink-0 text-green-500"
        aria-label="Connected"
      />
    );
  }
  if (entry.status === "error") {
    return (
      <XCircle
        className="size-4 shrink-0 text-red-500"
        aria-label="Error"
      />
    );
  }
  return (
    <Server
      className="text-muted-foreground size-4 shrink-0"
      aria-label="Disconnected"
    />
  );
}

/**
 * McpServerPanel — slide-over panel for managing MCP server connections.
 *
 * Lists all configured servers with their live connection status and provides
 * controls to add, remove, and reload servers.  The server list is persisted to
 * `localStorage` via {@link McpStatusProvider} so it survives page refreshes.
 *
 * Open/close state is managed by the parent — pass an `onClose` callback that
 * sets the open state to `false`.
 */
export function McpServerPanel({ onClose }: McpServerPanelProps) {
  const { servers, setServers, serverEntries, reload } = useMcpStatus();

  // "Add server" form state.
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addTransport, setAddTransport] = useState<TransportType>("http");
  const [addError, setAddError] = useState<string | null>(null);

  // Track which servers have their tools list expanded.
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  // Track which individual tools have their details expanded (key: "serverLabel::toolName").
  const [expandedToolDetails, setExpandedToolDetails] = useState<Set<string>>(new Set());

  const toggleTools = (label: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const toggleToolDetails = (serverLabel: string, toolName: string) => {
    const key = `${serverLabel}::${toolName}`;
    setExpandedToolDetails((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  /** Add a new server to the list. */
  const handleAdd = () => {
    const label = addLabel.trim();
    const url = addUrl.trim();

    if (!label) {
      setAddError("Label is required.");
      return;
    }
    if (!url) {
      setAddError("URL is required.");
      return;
    }
    try {
      new URL(url);
    } catch {
      setAddError("Enter a valid URL (e.g. http://localhost:3001/mcp).");
      return;
    }
    if (servers.some((s) => s.label === label)) {
      setAddError("A server with this label already exists.");
      return;
    }

    const newServer: McpServerConfig = {
      label,
      transport: { type: addTransport, url },
    };
    setServers([...servers, newServer]);
    setAddLabel("");
    setAddUrl("");
    setAddTransport("http");
    setAddError(null);
  };

  /** Remove a server by label. */
  const handleRemove = (label: string) => {
    setServers(servers.filter((s) => s.label !== label));
  };

  /** Lookup runtime entry for a server config (may be undefined while loading). */
  const entryFor = (config: McpServerConfig): McpServerEntry | undefined =>
    serverEntries.find((e) => e.config.label === config.label);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="MCP server management"
        className="bg-background border-border fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l shadow-xl"
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">MCP Servers</h2>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Server list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {servers.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">
              No servers configured. Add one below.
            </p>
          ) : (
            <ul className="space-y-3" aria-label="Configured MCP servers">
              {servers.map((config) => {
                const entry = entryFor(config);
                const url = transportUrl(config);
                const type = transportType(config);

                return (
                  <li
                    key={config.label}
                    className="bg-muted/50 border-border rounded-md border p-3"
                  >
                    <div className="flex items-start gap-2">
                      {/* Status icon */}
                      <span className="mt-0.5">
                        {entry ? (
                          <StatusIcon entry={entry} />
                        ) : (
                          <Server
                            className="text-muted-foreground size-4 shrink-0"
                            aria-label="Pending"
                          />
                        )}
                      </span>

                      {/* Label + URL */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {config.label}
                        </p>
                        <p
                          className="text-muted-foreground truncate text-xs"
                          title={url}
                        >
                          {url}
                        </p>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          {type}
                        </p>
                        {entry?.status === "error" && entry.error && (
                          <p
                            className="text-destructive mt-1 text-xs"
                            role="alert"
                          >
                            {entry.error}
                          </p>
                        )}
                        {/* Tools toggle */}
                        {entry?.status === "connected" && entry.tools.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleTools(config.label)}
                            className="text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1 text-xs"
                            aria-expanded={expandedTools.has(config.label)}
                          >
                            {expandedTools.has(config.label) ? (
                              <ChevronDown className="size-3" />
                            ) : (
                              <ChevronRight className="size-3" />
                            )}
                            <Wrench className="size-3" />
                            {entry.tools.length} tool{entry.tools.length !== 1 ? "s" : ""}
                          </button>
                        )}
                        {/* Tools list */}
                        {expandedTools.has(config.label) && entry?.tools && (
                          <ul className="mt-1.5 space-y-1" aria-label={`Tools from ${config.label}`}>
                            {entry.tools.map((tool) => {
                              const detailKey = `${config.label}::${tool.name}`;
                              const detailOpen = expandedToolDetails.has(detailKey);
                              const hasDetails = tool.description || (tool.parameters?.length ?? 0) > 0;
                              return (
                                <li
                                  key={tool.name}
                                  className="bg-background border-border rounded border"
                                >
                                  <button
                                    type="button"
                                    onClick={() => hasDetails && toggleToolDetails(config.label, tool.name)}
                                    className={cn(
                                      "flex w-full items-center gap-1 px-1.5 py-1 text-left",
                                      hasDetails ? "hover:bg-muted/50 cursor-pointer" : "cursor-default",
                                    )}
                                    aria-expanded={detailOpen}
                                    disabled={!hasDetails}
                                  >
                                    {hasDetails ? (
                                      detailOpen ? (
                                        <ChevronDown className="text-muted-foreground size-3 shrink-0" />
                                      ) : (
                                        <ChevronRight className="text-muted-foreground size-3 shrink-0" />
                                      )
                                    ) : (
                                      <span className="size-3 shrink-0" />
                                    )}
                                    <span className="font-mono text-xs font-semibold">{tool.name}</span>
                                  </button>
                                  {detailOpen && (
                                    <div className="border-border space-y-1 border-t px-2 py-1.5">
                                      {tool.description && (
                                        <p className="text-muted-foreground text-xs leading-snug">
                                          {tool.description}
                                        </p>
                                      )}
                                      {tool.parameters?.length > 0 && (
                                        <ul className="space-y-0.5" aria-label="Parameters">
                                          {tool.parameters.map((param) => (
                                            <li key={param.name} className="flex flex-wrap items-baseline gap-1 text-xs">
                                              <span className="text-foreground font-mono">{param.name}</span>
                                              <span className="text-muted-foreground font-mono">{param.type}</span>
                                              {!param.required && (
                                                <span className="text-muted-foreground italic">optional</span>
                                              )}
                                              {param.description && (
                                                <span className="text-muted-foreground">— {param.description}</span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={reload}
                          aria-label={`Reload ${config.label}`}
                          title="Reload connection"
                        >
                          <RefreshCw className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive size-7"
                          onClick={() => handleRemove(config.label)}
                          aria-label={`Remove ${config.label}`}
                          title="Remove server"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add server form */}
        <div className="border-border border-t px-4 py-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">
            Add server
          </h3>
          <div className="space-y-2">
            <Input
              placeholder="Label (e.g. Weather)"
              value={addLabel}
              onChange={(e) => {
                setAddLabel(e.target.value);
                setAddError(null);
              }}
              aria-label="Server label"
              className="h-8 text-xs"
            />
            <Input
              placeholder="URL (e.g. http://localhost:3001/mcp)"
              value={addUrl}
              onChange={(e) => {
                setAddUrl(e.target.value);
                setAddError(null);
              }}
              aria-label="Server URL"
              className="h-8 text-xs"
            />
            {/* Transport selector */}
            <select
              value={addTransport}
              onChange={(e) => setAddTransport(e.target.value as TransportType)}
              aria-label="Transport type"
              className={cn(
                "border-input bg-background text-foreground h-8 w-full rounded-md border px-2 text-xs shadow-xs",
                "focus:border-ring focus:ring-ring/50 focus:ring-[3px] focus:outline-none",
              )}
            >
              <option value="http">Streamable HTTP</option>
              <option value="sse">SSE</option>
            </select>

            {addError && (
              <p className="text-destructive text-xs" role="alert">
                {addError}
              </p>
            )}

            <Button
              size="sm"
              className="w-full"
              onClick={handleAdd}
              aria-label="Add MCP server"
            >
              <Plus className="size-3.5" />
              Add server
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
