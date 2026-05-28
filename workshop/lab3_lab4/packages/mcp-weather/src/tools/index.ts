import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCurrentWeatherTool } from "./current-weather.js";
import { registerForecastTool } from "./forecast.js";
import { registerHistoricalWeatherTool } from "./historical-weather.js";

export function registerWeatherTools(server: McpServer): void {
  registerCurrentWeatherTool(server);
  registerForecastTool(server);
  registerHistoricalWeatherTool(server);
}
