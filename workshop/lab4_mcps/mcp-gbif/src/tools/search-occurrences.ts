import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gbifGet } from "../gbif-client.js";

export function registerSearchOccurrencesTool(server: McpServer): void {
  server.registerTool(
    "search_occurrences",
    {
      description: "Search biodiversity occurrence records from GBIF",
      inputSchema: {
        scientificName: z.string().optional().describe("Scientific name (e.g. 'Quercus robur')"),
        country: z.string().optional().describe("ISO 3166-1 alpha-2 country code (e.g. 'US')"),
        geometry: z.string().optional().describe("WKT polygon or bbox string 'minLng,minLat,maxLng,maxLat'"),
        year: z.string().optional().describe("Single year or range 'YYYY,YYYY'"),
        limit: z.number().int().min(1).max(300).optional().describe("Number of results (default 20, max 300)"),
      },
    },
    async ({ scientificName, country, geometry, year, limit }) => {
      const params: Record<string, string> = {};
      if (scientificName) params.scientificName = scientificName;
      if (country) params.country = country;
      if (geometry) params.geometry = geometry;
      if (year) params.year = year;
      params.limit = String(limit ?? 20);

      const data = await gbifGet("/occurrence/search", params) as { results: unknown[] };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data.results) }],
      };
    },
  );
}
