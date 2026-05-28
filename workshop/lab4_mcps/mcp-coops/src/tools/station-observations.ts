import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStationObservations } from "../coops.js";

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  air_temperature: "Air temperature in °C (metric) or °F (english)",
  water_temperature: "Water temperature in °C (metric) or °F (english)",
  wind: "Wind speed, direction (degrees), and gust speed",
  air_pressure: "Barometric pressure in mb (metric) or inches Hg (english)",
  humidity: "Relative humidity (%)",
};

export function registerStationObservationsTool(server: McpServer): void {
  server.registerTool(
    "get_station_observations",
    {
      description: `Get meteorological observations from a NOAA CO-OPS station. Available products: ${Object.entries(PRODUCT_DESCRIPTIONS).map(([k, v]) => `${k} (${v})`).join("; ")}.`,
      inputSchema: {
        station: z.string().describe("7-digit CO-OPS station ID (e.g. '9414290' for San Francisco)"),
        product: z.enum(["air_temperature", "water_temperature", "wind", "air_pressure", "humidity"]).describe("Observation product to retrieve"),
        begin_date: z.string().regex(/^\d{8}$/).describe("Start date in YYYYMMDD format (e.g. '20231001')"),
        end_date: z.string().regex(/^\d{8}$/).describe("End date in YYYYMMDD format (e.g. '20231007'). Max range: 31 days."),
        interval: z.enum(["6", "h"]).default("h").describe("Sampling interval: 'h' for hourly (default), '6' for 6-minute. Use '6' only for short ranges (1–2 days) to avoid response size limits."),
        units: z.enum(["english", "metric"]).default("metric").describe("Units: 'english' or 'metric'"),
        time_zone: z.enum(["GMT", "LST", "LST/LDT"]).default("GMT").describe("Time zone for timestamps"),
      },
    },
    async ({ station, product, begin_date, end_date, interval, units, time_zone }) => {
      const data = await getStationObservations(station, product, begin_date, end_date, units, time_zone, interval);
      const slim = {
        stationId: data.stationId,
        stationName: data.stationName,
        product: data.product,
        units: data.units,
        // Strip sigma (s) to reduce response size. Wind direction (d) and gust (g)
        // are kept — they're signal, not QC metadata.
        readings: data.data.map(({ t, v, d, g }) =>
          d !== undefined || g !== undefined ? { t, v, d, g } : { t, v },
        ),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(slim) }],
      };
    },
  );
}
