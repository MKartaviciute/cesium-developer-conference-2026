import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetIndicatorDataTool } from "./get-indicator-data.js";
import { registerSearchIndicatorsTool } from "./search-indicators.js";

export function registerWorldBankTools(server: McpServer): void {
  registerGetIndicatorDataTool(server);
  registerSearchIndicatorsTool(server);
}
