import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStationData } from "../ncei.js";

export function registerGetStationDataTool(server: McpServer): void {
  server.registerTool(
    "get_station_data",
    {
      description: "Retrieve observational data for one or more NCEI stations",
      inputSchema: {
        dataset: z.string().describe('NCEI dataset identifier (e.g. "daily-summaries", "global-hourly")'),
        stations: z.string().describe('Comma-separated NCEI station IDs. For daily-summaries: bare or prefixed GHCND IDs (e.g. "USW00094728" or "GHCND:USW00094728"). For global-hourly: use USAF-WBAN hyphenated format (e.g. "725053-94728") or the 11-digit compound form (e.g. "72505394728").'),
        startDate: z.string().describe("ISO date (YYYY-MM-DD)"),
        endDate: z.string().describe("ISO date (YYYY-MM-DD)"),
        dataTypes: z.string().optional().describe('Comma-separated variable codes (e.g. "TMAX,TMIN,PRCP")'),
        fields: z.string().optional().describe('Comma-separated response field names to keep (e.g. "DATE,TMP,WND"). DATE is always included. Use to reduce payload size for wide datasets like global-hourly.'),
        limit: z.number().int().min(1).max(1000).optional().describe("Number of records to return, default 100, max 1000"),
      },
    },
    async ({ dataset, stations, startDate, endDate, dataTypes, fields, limit }) => {
      try {
        const data = await getStationData({ dataset, stations, startDate, endDate, dataTypes, fields, limit: limit ?? 100 });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
