import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWaterLevelTool } from "./water-level.js";
import { registerTidePredictionsTool } from "./tide-predictions.js";
import { registerStationObservationsTool } from "./station-observations.js";

export function registerCoopsTools(server: McpServer): void {
  registerWaterLevelTool(server);
  registerTidePredictionsTool(server);
  registerStationObservationsTool(server);
}
