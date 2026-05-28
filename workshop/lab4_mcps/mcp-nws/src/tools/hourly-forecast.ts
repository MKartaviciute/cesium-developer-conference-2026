import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getHourlyForecast } from "../nws.js";

export function registerHourlyForecastTool(server: McpServer): void {
  server.registerTool(
    "get_nws_hourly_forecast",
    {
      description: "Get the hourly NWS weather forecast for a geographic coordinate. Only works for US locations.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
        longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
        hours: z
          .number()
          .int()
          .min(1)
          .max(156)
          .default(24)
          .describe("Number of hourly periods to return (1–156, default 24)"),
      },
    },
    async ({ latitude, longitude, hours }) => {
      const data = await getHourlyForecast(latitude, longitude, hours);
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    },
  );
}
