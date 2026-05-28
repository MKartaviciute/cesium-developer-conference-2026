import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListNaturalEventsTool } from "./list-natural-events.js";
import { registerListEventCategoriesTool } from "./list-event-categories.js";

export function registerEonetTools(server: McpServer): void {
  registerListNaturalEventsTool(server);
  registerListEventCategoriesTool(server);
}
