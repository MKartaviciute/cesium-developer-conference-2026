import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDatasetsTool } from "./datasets.js";
import { registerStationsTool } from "./stations.js";
import { registerDataTool } from "./data.js";

export function registerCdoTools(server: McpServer): void {
  registerDatasetsTool(server);
  registerStationsTool(server);
  registerDataTool(server);
}
