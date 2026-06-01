import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchOccurrencesTool } from "./search-occurrences.js";
import { registerGetSpeciesTool } from "./get-species.js";

export function registerGbifTools(server: McpServer): void {
  registerSearchOccurrencesTool(server);
  registerGetSpeciesTool(server);
}
