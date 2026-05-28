import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchItems } from "../planetarycomputer.js";

export function registerSearchItemsTool(server: McpServer): void {
  server.registerTool(
    "search_items",
    {
      description: "Search earth observation items across collections in Microsoft Planetary Computer STAC API. Returns compact scene metadata and a nextToken for cursor-based pagination.",
      inputSchema: {
        collections: z.array(z.string()).optional().describe('Collection IDs to restrict search (e.g. ["sentinel-2-l2a", "landsat-c2-l2"])'),
        bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("Bounding box [minLon, minLat, maxLon, maxLat]"),
        datetime: z.string().optional().describe('ISO 8601 date or interval (e.g. "2023-01-01" or "2023-01-01/2023-03-31")'),
        limit: z.number().int().min(1).max(100).optional().describe("Number of items to return, default 10, max 100"),
        token: z.string().optional().describe("Pagination cursor — pass the nextToken value from a previous search_items response to retrieve the next page"),
      },
    },
    async ({ collections, bbox, datetime, limit, token }) => {
      try {
        const result = await searchItems({ collections, bbox, datetime, limit, token });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
