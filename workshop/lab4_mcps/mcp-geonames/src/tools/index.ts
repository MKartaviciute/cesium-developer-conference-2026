import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchPlacesTool } from "./search-places.js";
import { registerFindNearbyTool } from "./find-nearby.js";

export function registerGeonamesTools(server: McpServer): void {
  registerSearchPlacesTool(server);
  registerFindNearbyTool(server);
}
