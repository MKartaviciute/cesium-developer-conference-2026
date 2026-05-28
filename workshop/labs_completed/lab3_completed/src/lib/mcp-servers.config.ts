import type { McpServerConfig } from "@/types/mcp";

/**
 * MCP servers available to the AI agent in the browser.
 *
 * Only SSE (`type: "sse"`) and Streamable HTTP (`type: "http"`) transports
 * are supported — stdio is not available in the browser.
 *
 * Add or remove entries here to change which MCP servers are connected.
 */
export const MCP_SERVERS: McpServerConfig[] = [
  {
    label: "POI",
    transport: { type: "http", url: "http://localhost:3001/mcp" },
  },
  {
    label: "Weather",
    transport: { type: "http", url: "http://localhost:3002/mcp" },
  },
];
