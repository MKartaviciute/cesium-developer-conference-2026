import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetLocationsTool } from "./get-locations.js";
import { registerGetMeasurementsTool } from "./get-measurements.js";

export function registerOpenAqTools(server: McpServer): void {
  registerGetLocationsTool(server);
  registerGetMeasurementsTool(server);
}
