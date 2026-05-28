import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getTidePredictions } from "../coops.js";

export function registerTidePredictionsTool(server: McpServer): void {
  server.registerTool(
    "get_tide_predictions",
    {
      description: "Get predicted tide heights for a NOAA CO-OPS station over a date range. Use interval 'hilo' for high/low tide events only, 'h' for hourly, or '6' for 6-minute predictions.",
      inputSchema: {
        station: z.string().describe("7-digit CO-OPS station ID (e.g. '9414290' for San Francisco)"),
        begin_date: z.string().regex(/^\d{8}$/).describe("Start date in YYYYMMDD format (e.g. '20231001')"),
        end_date: z.string().regex(/^\d{8}$/).describe("End date in YYYYMMDD format (e.g. '20231007'). Max range: 2 years."),
        datum: z.enum(["MLLW", "MHHW", "MHW", "MLW", "MSL", "MTL", "NAVD", "STND"]).default("MLLW").describe("Tidal datum reference"),
        interval: z.enum(["hilo", "h", "6"]).default("hilo").describe("Prediction interval: 'hilo' for high/low events, 'h' for hourly, '6' for 6-minute"),
        units: z.enum(["english", "metric"]).default("metric").describe("Units: 'english' (feet) or 'metric' (meters)"),
        time_zone: z.enum(["GMT", "LST", "LST/LDT"]).default("GMT").describe("Time zone for timestamps"),
      },
    },
    async ({ station, begin_date, end_date, datum, interval, units, time_zone }) => {
      const data = await getTidePredictions(station, begin_date, end_date, datum, interval, units, time_zone);
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    },
  );
}
