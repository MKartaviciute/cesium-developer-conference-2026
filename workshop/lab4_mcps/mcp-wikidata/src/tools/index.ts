import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSparqlQueryTool } from "./sparql-query.js";
import { registerGetEntityTool } from "./get-entity.js";

export function registerWikidataTools(server: McpServer): void {
  registerSparqlQueryTool(server);
  registerGetEntityTool(server);
}
