import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchDatasetsTool } from "./search-datasets.js";
import { registerGetDatasetTool } from "./get-dataset.js";

export function registerHdxTools(server: McpServer): void {
  registerSearchDatasetsTool(server);
  registerGetDatasetTool(server);
}
