import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListCountriesTool } from "./list-countries.js";
import { registerQueryFootprintsByBboxTool } from "./query-footprints-by-bbox.js";

export function registerBuildingFootprintTools(server: McpServer): void {
  registerListCountriesTool(server);
  registerQueryFootprintsByBboxTool(server);
}
