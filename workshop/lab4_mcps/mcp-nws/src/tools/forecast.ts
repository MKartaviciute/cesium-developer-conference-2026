import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getForecast } from "../nws.js";

export function registerForecastTool(server: McpServer): void {
  server.registerTool(
    "get_nws_forecast",
    {
      description: "Get the 7-day NWS weather forecast (14 day/night periods) for a geographic coordinate. Only works for US locations.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
        longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
      },
    },
    async ({ latitude, longitude }) => {
      const data = await getForecast(latitude, longitude);
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    },
  );
}
