import type { McpServerConfig } from "@/types/mcp";

/**
 * MCP server configuration.
 *
 * No MCP servers are configured yet — in Lab 2 you will build one and
 * register it here so the AI agent can discover and call your custom tools.
 */
export const MCP_SERVERS: McpServerConfig[] = [
   {
    label: "POI",
    transport: { type: "http", url: "http://localhost:3001/mcp" },
  },
];
