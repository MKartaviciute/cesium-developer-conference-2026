import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDatasets } from "../cdo.js";

export function registerDatasetsTool(server: McpServer): void {
  server.registerTool(
    "get_cdo_datasets",
    {
      description: "List available NOAA CDO datasets (e.g. GHCND for daily summaries, GSOM for monthly summaries, GHCNDMS for normals). Optionally filter by data type, location, or station.",
      inputSchema: {
        datatypeid: z.string().optional().describe("Filter to datasets containing this data type (e.g. 'TMAX', 'PRCP')"),
        locationid: z.string().optional().describe("Filter to datasets available for this location ID (e.g. 'FIPS:06' for California, 'CITY:US390029' for New York)"),
        stationid: z.string().optional().describe("Filter to datasets available for this station ID (e.g. 'GHCND:USW00094728')"),
        startdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Filter to datasets with data on or after this date (YYYY-MM-DD)"),
        enddate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Filter to datasets with data on or before this date (YYYY-MM-DD)"),
        limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of results to return (1–100)"),
        offset: z.number().int().min(1).optional().describe("Pagination offset (1-based)"),
      },
    },
    async ({ datatypeid, locationid, stationid, startdate, enddate, limit, offset }) => {
      const page = await getDatasets({ datatypeid, locationid, stationid, startdate, enddate, limit, offset });
      return {
        content: [{ type: "text", text: JSON.stringify(page) }],
      };
    },
  );
}
