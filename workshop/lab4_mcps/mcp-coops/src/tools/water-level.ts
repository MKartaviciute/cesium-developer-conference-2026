import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getWaterLevel } from "../coops.js";

export function registerWaterLevelTool(server: McpServer): void {
  server.registerTool(
    "get_water_level",
    {
      description: "Get verified or preliminary water level readings for a NOAA CO-OPS tide station over a date range. Returns time-series data with water height, sigma (standard deviation), and quality flag.",
      inputSchema: {
        station: z.string().describe("7-digit CO-OPS station ID (e.g. '9414290' for San Francisco)"),
        begin_date: z.string().regex(/^\d{8}$/).describe("Start date in YYYYMMDD format (e.g. '20231001')"),
        end_date: z.string().regex(/^\d{8}$/).describe("End date in YYYYMMDD format (e.g. '20231007'). Max range: 31 days for 6-min data, 1 year for hourly."),
        datum: z.enum(["MLLW", "MHHW", "MHW", "MLW", "MSL", "MTL", "NAVD", "STND"]).default("MLLW").describe("Tidal datum reference"),
        interval: z.enum(["6", "h"]).default("h").describe("Sampling interval: '6' for 6-minute, 'h' for hourly"),
        units: z.enum(["english", "metric"]).default("metric").describe("Units: 'english' (feet) or 'metric' (meters)"),
        time_zone: z.enum(["GMT", "LST", "LST/LDT"]).default("GMT").describe("Time zone for timestamps"),
      },
    },
    async ({ station, begin_date, end_date, datum, interval, units, time_zone }) => {
      const data = await getWaterLevel(station, begin_date, end_date, datum, interval, units, time_zone);
      // Strip sigma (s) and quality flags (q/f) — LLMs only need timestamp and value.
      // A 3-day 6-minute dataset is ~750 records; keeping all fields inflates the
      // response past the MCP token limit and provides no useful signal to the model.
      const slim = {
        stationId: data.stationId,
        stationName: data.stationName,
        datum: data.datum,
        units: data.units,
        readings: data.data.map(({ t, v }) => ({ t, v })),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(slim) }],
      };
    },
  );
}
