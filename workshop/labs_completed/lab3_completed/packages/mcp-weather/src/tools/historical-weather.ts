import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getHistoricalWeather } from "../open-meteo.js";

export function registerHistoricalWeatherTool(server: McpServer): void {
  server.registerTool(
    "get_historical_weather",
    {
      description: "Get historical daily weather for a date range",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
        longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
        start_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Start date in YYYY-MM-DD format"),
        end_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("End date in YYYY-MM-DD format"),
      },
    },
    async ({ latitude, longitude, start_date, end_date }) => {
      const data = await getHistoricalWeather(latitude, longitude, start_date, end_date);
      return {
        content: [{ type: "text", text: JSON.stringify(data.daily) }],
      };
    },
  );
}
