import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQueryOsmFeaturesTool } from "./query-osm-features.js";

export function registerOverpassTools(server: McpServer): void {
  registerQueryOsmFeaturesTool(server);
}
