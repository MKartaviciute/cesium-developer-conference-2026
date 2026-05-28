import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getData } from "../cdo.js";

export function registerDataTool(server: McpServer): void {
  server.registerTool(
    "get_cdo_data",
    {
      description: "Retrieve historical climate data records from NOAA CDO. Returns time-series values for weather elements like temperature, precipitation, and snowfall. Use get_cdo_stations first to find valid station IDs.",
      inputSchema: {
        datasetid: z.string().describe("Dataset ID (e.g. 'GHCND' for daily summaries, 'GSOM' for monthly summaries, 'GSOY' for annual summaries)"),
        startdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start of date range (YYYY-MM-DD). GHCND max range: 1 year; GSOM/GSOY: 10 years."),
        enddate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End of date range (YYYY-MM-DD)"),
        datatypeid: z.string().optional().describe("Comma-separated data type IDs to retrieve (e.g. 'TMAX,TMIN,PRCP'). Omit to get all available types."),
        stationid: z.string().optional().describe("Station ID to retrieve data for (e.g. 'GHCND:USW00094728'). Use get_cdo_stations to find IDs."),
        locationid: z.string().optional().describe("Location ID to retrieve data for (e.g. 'CITY:US390029', 'FIPS:06'). Alternative to stationid."),
        units: z.enum(["standard", "metric"]).default("metric").describe("Unit system: 'metric' (°C, mm) or 'standard' (°F, inches)"),
        limit: z.number().int().min(1).max(1000).default(1000).describe("Maximum records to return (1–1000). Use offset to paginate."),
        offset: z.number().int().min(1).optional().describe("Pagination offset (1-based)"),
      },
    },
    async ({ datasetid, startdate, enddate, datatypeid, stationid, locationid, units, limit, offset }) => {
      const page = await getData({ datasetid, startdate, enddate, datatypeid, stationid, locationid, units, limit, offset });
      return {
        content: [{ type: "text", text: JSON.stringify(page) }],
      };
    },
  );
}
