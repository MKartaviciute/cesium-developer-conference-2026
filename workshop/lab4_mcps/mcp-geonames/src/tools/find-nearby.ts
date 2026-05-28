import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findNearby } from "../geonames.js";

export function registerFindNearbyTool(server: McpServer): void {
  server.registerTool(
    "find_nearby",
    {
      description: "Find geographic features close to a coordinate using GeoNames",
      inputSchema: {
        lat: z.number().describe("WGS84 latitude"),
        lng: z.number().describe("WGS84 longitude"),
        radius: z.number().min(0).max(300).optional().describe("Search radius in km, default 10, max 300"),
        maxRows: z.number().int().min(1).max(100).optional().describe("Maximum results to return, default 10, max 100"),
        featureClass: z.string().optional().describe('GeoNames feature class filter (e.g. "P", "A", "H", "T")'),
      },
    },
    async ({ lat, lng, radius, maxRows, featureClass }) => {
      try {
        const data = await findNearby({ lat, lng, radius, maxRows, featureClass });
        return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
