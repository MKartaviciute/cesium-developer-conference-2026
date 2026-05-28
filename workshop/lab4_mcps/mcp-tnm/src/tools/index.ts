import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchProductsTool } from "./search-products.js";
import { registerListDatasetsTool } from "./list-datasets.js";

export function registerTnmTools(server: McpServer): void {
  registerSearchProductsTool(server);
  registerListDatasetsTool(server);
}
