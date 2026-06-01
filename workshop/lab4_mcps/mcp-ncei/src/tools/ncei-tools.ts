import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetStationDataTool } from "./get-station-data.js";
import { registerListDatasetsTool } from "./list-datasets.js";

export function registerNceiTools(server: McpServer): void {
  registerGetStationDataTool(server);
  registerListDatasetsTool(server);
}
