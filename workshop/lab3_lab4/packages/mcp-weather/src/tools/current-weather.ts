import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCurrentWeather } from "../open-meteo.js";

export function registerCurrentWeatherTool(server: McpServer): void {
  server.registerTool(
    "get_current_weather",
    {
      description: "Get current weather conditions at a geographic coordinate",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
        longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
      },
    },
    async ({ latitude, longitude }) => {
      const data = await getCurrentWeather(latitude, longitude);
      return {
        content: [{ type: "text", text: JSON.stringify(data.current_weather) }],
      };
    },
  );
}
