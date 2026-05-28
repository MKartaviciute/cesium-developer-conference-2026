import type { MCPClientConfig } from "@ai-sdk/mcp";

/**
 * Configuration for a single MCP server connection.
 *
 * Browser-side MCP clients can only use SSE (`type: "sse"`) or
 * Streamable HTTP (`type: "http"`) transport — `stdio` is not available
 * in the browser environment.  See Architecture §8.3.
 */
export interface McpServerConfig {
  /** Human-readable label displayed in the UI. */
  label: string;
  /** Transport to use when connecting to this server. */
  transport: MCPClientConfig["transport"];
}

/**
 * Connection status for a single MCP server.
 */
export type McpServerStatus = "connecting" | "connected" | "error";

/**
 * Metadata for a single parameter of an MCP tool.
 */
export interface McpToolParameter {
  /** Parameter name. */
  name: string;
  /** JSON Schema type (e.g. "string", "number", "boolean"). */
  type: string;
  /** Human-readable description, if provided by the server. */
  description?: string;
  /** Whether this parameter is required. */
  required: boolean;
}

/**
 * Rich metadata for a single tool exposed by an MCP server.
 */
export interface McpToolInfo {
  /** Tool name (may be prefixed if there is a cross-server collision). */
  name: string;
  /** Human-readable description provided by the server. */
  description?: string;
  /** Input parameters inferred from the tool's JSON Schema. */
  parameters: McpToolParameter[];
}

/**
 * Runtime state for a managed MCP server connection.
 */
export interface McpServerEntry {
  /** Original configuration supplied by the caller. */
  config: McpServerConfig;
  /** Current connection status. */
  status: McpServerStatus;
  /** User-facing error description, set when `status === "error"`. */
  error: string | null;
  /** Rich metadata for tools exposed by this server, populated once connected. */
  tools: McpToolInfo[];
}
