import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStations } from "../cdo.js";

export function registerStationsTool(server: McpServer): void {
  server.registerTool(
    "get_cdo_stations",
    {
      description: "Search NOAA CDO climate stations. Filter by dataset, location, bounding box, data type, or date range. Returns station IDs, names, coordinates, and date coverage.",
      inputSchema: {
        datasetid: z.string().optional().describe("Dataset ID to filter stations (e.g. 'GHCND', 'GSOM'). Highly recommended to narrow results."),
        locationid: z.string().optional().describe("Location ID to filter stations (e.g. 'FIPS:06' for California, 'CITY:US390029' for New York City, 'FIPS:US' for all US)"),
        datatypeid: z.string().optional().describe("Data type ID to filter stations that measure this element (e.g. 'TMAX', 'TMIN', 'PRCP', 'SNOW')"),
        extent: z.string().optional().describe("Bounding box as 'minLat,minLon,maxLat,maxLon' (e.g. '37.0,-122.5,38.0,-121.5' for the San Francisco Bay Area)"),
        startdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Filter to stations with data on or after this date (YYYY-MM-DD)"),
        enddate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Filter to stations with data on or before this date (YYYY-MM-DD)"),
        limit: z.number().int().min(1).max(1000).default(25).describe("Maximum number of results (1–1000)"),
        offset: z.number().int().min(1).optional().describe("Pagination offset (1-based)"),
      },
    },
    async ({ datasetid, locationid, datatypeid, extent, startdate, enddate, limit, offset }) => {
      const page = await getStations({ datasetid, locationid, datatypeid, extent, startdate, enddate, limit, offset });
      return {
        content: [{ type: "text", text: JSON.stringify(page) }],
      };
    },
  );
}
