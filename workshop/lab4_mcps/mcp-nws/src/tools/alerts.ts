import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getActiveAlerts } from "../nws.js";

export function registerAlertsTool(server: McpServer): void {
  server.registerTool(
    "get_nws_alerts",
    {
      description: "Get active NWS weather alerts (warnings, watches, advisories) for a geographic coordinate. Only works for US locations.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Latitude in degrees"),
        longitude: z.number().min(-180).max(180).describe("Longitude in degrees"),
      },
    },
    async ({ latitude, longitude }) => {
      const data = await getActiveAlerts(latitude, longitude);
      const text =
        data.alerts.length === 0
          ? "No active weather alerts for this location."
          : JSON.stringify(data.alerts);
      return {
        content: [{ type: "text", text }],
      };
    },
  );
}
