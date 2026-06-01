import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQueryTigerLayerTool } from "./query-tiger-layer.js";
import { registerListLayersTool } from "./list-layers.js";

export function registerTigerwebTools(server: McpServer): void {
  registerQueryTigerLayerTool(server);
  registerListLayersTool(server);
}
