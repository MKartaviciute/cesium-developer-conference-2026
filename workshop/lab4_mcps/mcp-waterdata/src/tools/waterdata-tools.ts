import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetStreamflowTool } from "./get-streamflow.js";
import { registerGetSiteInfoTool } from "./get-site-info.js";
import { registerGetSiteStatsTool } from "./get-site-stats.js";

export function registerWaterdataTools(server: McpServer): void {
  registerGetStreamflowTool(server);
  registerGetSiteInfoTool(server);
  registerGetSiteStatsTool(server);
}
