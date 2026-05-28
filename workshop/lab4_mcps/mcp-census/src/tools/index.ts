import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetAcsDataTool } from "./get-acs-data.js";
import { registerListAcsVariablesTool } from "./list-acs-variables.js";

export function registerCensusTools(server: McpServer): void {
  registerGetAcsDataTool(server);
  registerListAcsVariablesTool(server);
}
