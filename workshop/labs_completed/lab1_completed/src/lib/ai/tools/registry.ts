"use client";

import type { Tool } from "ai";

/** The origin of a registered tool — either a built-in CesiumJS tool or an externally-loaded MCP tool. */
export type ToolOrigin = "cesium" | "mcp";

/** Metadata attached to each registered tool. */
export interface ToolEntry {
  name: string;
  origin: ToolOrigin;
  tool: Tool;
}

/**
 * Central registry for all AI agent tools.
 *
 * Tracks each tool's origin ("cesium" | "mcp") so tools can be filtered,
 * listed, or passed wholesale to the AI SDK.
 *
 * Register MCP tools first, then Cesium tools — later registrations win on
 * name collision, so Cesium tools always take precedence.
 */
export class ToolRegistry {
  private readonly entries = new Map<string, ToolEntry>();

  /**
   * Register a map of tools from `origin`.
   * On name collision the incoming tool **overwrites** the existing one,
   * so call order matters (Cesium should be registered last to win).
   */
  private register(
    tools: Record<string, Tool>,
    origin: ToolOrigin,
  ): void {
    for (const [name, tool] of Object.entries(tools)) {
      this.entries.set(name, {
        name,
        origin,
        tool,
      });
    }
  }

  /** Register MCP tools.  Called first so Cesium tools can override on collision. */
  registerMcp(tools: Record<string, Tool>): this {
    this.register(tools, "mcp");
    return this;
  }

  /** Register CesiumJS tools.  Called after MCP so they win on name collision. */
  registerCesium(tools: Record<string, Tool>): this {
    this.register(tools, "cesium");
    return this;
  }

  /** Return all registered tools as a flat record, ready to pass to `useAIChat`. */
  getAll(): Record<string, Tool> {
    return Object.fromEntries(
      Array.from(this.entries.values()).map(({ name, tool }) => [name, tool]),
    );
  }

  /** Return only tools from the given origin. */
  getByOrigin(origin: ToolOrigin): Record<string, Tool> {
    return Object.fromEntries(
      Array.from(this.entries.values())
        .filter((e) => e.origin === origin)
        .map(({ name, tool }) => [name, tool]),
    );
  }

  /** Return metadata for all registered tools, sorted by origin then name. */
  list(): ToolEntry[] {
    return Array.from(this.entries.values()).sort((a, b) =>
      a.origin !== b.origin
        ? a.origin.localeCompare(b.origin)
        : a.name.localeCompare(b.name),
    );
  }

  /** Return a name → origin map, ready to pass as `toolOrigins` to `useAIChat`. */
  getOrigins(): Record<string, ToolOrigin> {
    return Object.fromEntries(
      Array.from(this.entries.values()).map(({ name, origin }) => [name, origin]),
    );
  }
}
