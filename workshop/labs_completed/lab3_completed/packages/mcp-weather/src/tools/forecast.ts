import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getForecast } from "../open-meteo.js";

export function registerForecastTool(server: McpServer): void {
  server.registerTool(
    "get_forecast",
    {
      description: "Get a multi-day weather forecast at a geographic coordinate",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
        longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
        days: z.number().int().min(1).max(16).default(7).describe("Number of forecast days (1–16)"),
      },
    },
    async ({ latitude, longitude, days }) => {
      const data = await getForecast(latitude, longitude, days);
      return {
        content: [{ type: "text", text: JSON.stringify(data.daily) }],
      };
    },
  );
}
