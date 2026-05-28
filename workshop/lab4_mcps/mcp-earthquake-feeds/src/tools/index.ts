import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetEarthquakeFeedTool } from "./get-earthquake-feed.js";

export function registerEarthquakeFeedsTools(server: McpServer): void {
  registerGetEarthquakeFeedTool(server);
}
