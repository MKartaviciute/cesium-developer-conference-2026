import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchItemsTool } from "./search-items.js";
import { registerListCollectionsTool } from "./list-collections.js";

export function registerPlanetaryComputerTools(server: McpServer): void {
  registerSearchItemsTool(server);
  registerListCollectionsTool(server);
}
