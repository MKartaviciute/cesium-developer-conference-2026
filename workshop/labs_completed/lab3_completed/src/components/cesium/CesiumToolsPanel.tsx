"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Globe, X } from "lucide-react";
import type { Tool } from "ai";
import { z } from "zod";
import { createCesiumToolGroups } from "@/lib/ai/tools";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CesiumToolsPanelProps {
  /** Called when the user closes the panel. */
  onClose: () => void;
}

interface ToolParam {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

interface ToolInfo {
  name: string;
  description?: string;
  parameters: ToolParam[];
}

interface ToolCategory {
  key: string;
  title: string;
  tools: ToolInfo[];
}

/** Resolve the display type name from a Zod type definition. */
function zodTypeName(schema: unknown): string {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return zodTypeName(schema.unwrap() as unknown);
  }
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodBoolean) return "boolean";
  if (schema instanceof z.ZodArray) return "array";
  if (schema instanceof z.ZodObject) return "object";
  if (schema instanceof z.ZodEnum) {
    return "enum";
  }

  return "any";
}

function unwrapOptional(schema: unknown): {
  base: unknown;
  required: boolean;
} {
  if (schema instanceof z.ZodOptional) {
    return { base: schema.unwrap() as unknown, required: false };
  }
  if (schema instanceof z.ZodDefault) {
    return { base: schema.removeDefault() as unknown, required: false };
  }

  return { base: schema, required: true };
}

function getObjectShape(schema: z.ZodObject<z.ZodRawShape>): Record<string, unknown> {
  const shapeLike = (schema as { shape: unknown }).shape;
  if (typeof shapeLike === "function") {
    return shapeLike() as Record<string, unknown>;
  }
  if (shapeLike && typeof shapeLike === "object") {
    return shapeLike as Record<string, unknown>;
  }
  return {};
}

function getSchemaDescription(schema: unknown): string | undefined {
  if (!schema || typeof schema !== "object") return undefined;
  const desc = (schema as { description?: unknown }).description;
  return typeof desc === "string" ? desc : undefined;
}

/** Extract parameter metadata from a Zod object schema. */
function extractParams(inputSchema: unknown): ToolParam[] {
  if (!(inputSchema instanceof z.ZodObject)) {
    return [];
  }

  const shape = getObjectShape(inputSchema);
  return Object.entries(shape).map(([name, fieldSchema]) => {
    const { base, required } = unwrapOptional(fieldSchema);
    return {
      name,
      type: zodTypeName(base),
      description: getSchemaDescription(base),
      required,
    };
  });
}

/** Convert the raw `createCesiumTools` output into display-friendly metadata. */
function buildToolInfos(tools: Record<string, Tool>): ToolInfo[] {
  return Object.entries(tools)
    .map(([name, t]) => ({
      name,
      description: t.description,
      parameters: extractParams(t.inputSchema),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCategoriesFromToolGroups(): ToolCategory[] {
  return createCesiumToolGroups({ current: null })
    .map((group) => ({
      key: group.key,
      title: group.title,
      tools: buildToolInfos(group.tools),
    }))
    .filter((category) => category.tools.length > 0);
}

/**
 * CesiumToolsPanel — slide-over panel listing all built-in Cesium viewer tools.
 *
 * Mirrors the visual style of {@link McpServerPanel} but is read-only since
 * CesiumJS tools are statically defined and not user-configurable.
 */
export function CesiumToolsPanel({ onClose }: CesiumToolsPanelProps) {
  // createCesiumToolGroups only stores the ref; it never dereferences it at
  // definition time, so passing a dummy ref is safe for metadata extraction.
  const categories = useMemo(() => buildCategoriesFromToolGroups(), []);
  const toolCount = useMemo(
    () => categories.reduce((total, category) => total + category.tools.length, 0),
    [categories],
  );

  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(),
  );

  const toggle = (name: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

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
        aria-label="Cesium tools"
        className="bg-background border-border fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l shadow-xl"
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">
            Cesium Tools
            <span className="text-muted-foreground ml-2 font-normal">
              ({toolCount})
            </span>
          </h2>
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

        {/* Tools list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3" aria-label="Cesium viewer tools">
            {categories.map((category) => (
              <section key={category.key} aria-label={`${category.title} tools`}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category.key)}
                  className="hover:bg-muted mb-1 flex w-full items-center justify-between rounded px-1 py-1"
                  aria-expanded={expandedCategories.has(category.key)}
                >
                  <span className="flex items-center gap-1.5">
                    {expandedCategories.has(category.key) ? (
                      <ChevronDown className="text-muted-foreground size-3 shrink-0" />
                    ) : (
                      <ChevronRight className="text-muted-foreground size-3 shrink-0" />
                    )}
                    <h3 className="text-foreground text-[11px] font-semibold uppercase tracking-wide">
                      {category.title}
                    </h3>
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {category.tools.length}
                  </span>
                </button>
                {expandedCategories.has(category.key) && <ul className="space-y-1">
                  {category.tools.map((tool) => {
                    const isOpen = expandedTools.has(tool.name);
                    const hasDetails = !!tool.description || tool.parameters.length > 0;
                    return (
                      <li
                        key={tool.name}
                        className="bg-muted/50 border-border rounded-md border"
                      >
                        <button
                          type="button"
                          onClick={() => hasDetails && toggle(tool.name)}
                          className={cn(
                            "flex w-full items-center gap-1.5 px-3 py-2 text-left",
                            hasDetails
                              ? "hover:bg-muted cursor-pointer"
                              : "cursor-default",
                          )}
                          aria-expanded={isOpen}
                          disabled={!hasDetails}
                        >
                          <Globe className="text-muted-foreground size-3 shrink-0" />
                          {hasDetails ? (
                            isOpen ? (
                              <ChevronDown className="text-muted-foreground size-3 shrink-0" />
                            ) : (
                              <ChevronRight className="text-muted-foreground size-3 shrink-0" />
                            )
                          ) : (
                            <span className="size-3 shrink-0" />
                          )}
                          <span className="font-mono text-xs font-semibold">
                            {tool.name}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-border space-y-2 border-t px-3 py-2">
                            {tool.description && (
                              <p className="text-muted-foreground text-xs leading-snug">
                                {tool.description}
                              </p>
                            )}
                            {tool.parameters.length > 0 && (
                              <ul className="space-y-0.5" aria-label="Parameters">
                                {tool.parameters.map((param) => (
                                  <li
                                    key={param.name}
                                    className="flex flex-wrap items-baseline gap-1 text-xs"
                                  >
                                    <span className="text-foreground font-mono">
                                      {param.name}
                                    </span>
                                    <span className="text-muted-foreground font-mono">
                                      {param.type}
                                    </span>
                                    {!param.required && (
                                      <span className="text-muted-foreground italic">
                                        optional
                                      </span>
                                    )}
                                    {param.description && (
                                      <span className="text-muted-foreground">
                                        — {param.description}
                                      </span>
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
                </ul>}
              </section>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
