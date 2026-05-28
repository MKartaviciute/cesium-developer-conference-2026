import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchPlaces } from "../geonames.js";

export function registerSearchPlacesTool(server: McpServer): void {
  server.registerTool(
    "search_places",
    {
      description: "Search for place names and geographic features using GeoNames",
      inputSchema: {
        q: z.string().describe("Place name search term"),
        country: z.string().optional().describe("ISO 3166-1 alpha-2 country code to restrict results (e.g. \"US\")"),
        featureClass: z.string().optional().describe('GeoNames feature class (e.g. "P" for populated places, "A" for admin divisions, "H" for water bodies, "T" for terrain)'),
        maxRows: z.number().int().min(1).max(100).optional().describe("Maximum results to return, default 10, max 100"),
      },
    },
    async ({ q, country, featureClass, maxRows }) => {
      try {
        const data = await searchPlaces({ q, country, featureClass, maxRows });
        return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
