import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQueryPlacesTool } from "./query-places.js";
import { registerQueryBuildingsTool } from "./query-buildings.js";
import { registerQueryAdminDivisionsTool } from "./query-admin-divisions.js";

export function registerOvertureTools(server: McpServer): void {
  registerQueryPlacesTool(server);
  registerQueryBuildingsTool(server);
  registerQueryAdminDivisionsTool(server);
}
