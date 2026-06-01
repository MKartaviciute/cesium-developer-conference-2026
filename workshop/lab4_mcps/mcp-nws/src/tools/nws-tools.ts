import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerForecastTool } from "./forecast.js";
import { registerHourlyForecastTool } from "./hourly-forecast.js";
import { registerAlertsTool } from "./alerts.js";

export function registerNwsTools(server: McpServer): void {
  registerForecastTool(server);
  registerHourlyForecastTool(server);
  registerAlertsTool(server);
}
