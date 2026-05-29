import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQueryEarthquakesTool } from "./query-earthquakes.js";
import { registerGetEarthquakeCountTool } from "./get-earthquake-count.js";

export function registerEarthquakeTools(server: McpServer): void {
  registerQueryEarthquakesTool(server);
  registerGetEarthquakeCountTool(server);
}
