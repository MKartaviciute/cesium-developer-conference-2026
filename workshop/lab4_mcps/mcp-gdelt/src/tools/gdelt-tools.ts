import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchArticlesTool } from "./search-articles.js";
import { registerGetTimelineTool } from "./get-timeline.js";

export function registerGdeltTools(server: McpServer): void {
  registerSearchArticlesTool(server);
  registerGetTimelineTool(server);
}
