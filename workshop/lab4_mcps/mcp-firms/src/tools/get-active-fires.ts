import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchActiveFires, getMapKey } from "../firms.js";

export function registerGetActiveFiresTool(server: McpServer): void {
  server.registerTool(
    "get_active_fires",
    {
      description:
        "Fetch active fire/hotspot detections for a region from NASA FIRMS.",
      inputSchema: {
        source: z
          .enum(["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "MODIS_NRT"])
          .default("VIIRS_SNPP_NRT")
          .describe("Satellite/instrument source for fire detections"),
        area: z
          .string()
          .default("world")
          .describe(
            '"world" for global coverage, or bounding box as "minLon,minLat,maxLon,maxLat"',
          ),
        day_range: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(1)
          .describe("Number of days back from date (1–10)"),
        date: z
          .string()
          .optional()
          .describe("ISO date string (YYYY-MM-DD); defaults to today UTC"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .describe("Return only the top N hotspots sorted by FRP descending"),
        min_frp: z
          .number()
          .min(0)
          .optional()
          .describe("Exclude detections below this Fire Radiative Power threshold (MW)"),
        confidence: z
          .enum(["h", "n", "l"])
          .optional()
          .describe('Filter by confidence level: "h" high, "n" nominal, "l" low'),
      },
    },
    async ({ source, area, day_range, date, limit, min_frp, confidence }) => {
      const mapKey = getMapKey();
      if (!mapKey) {
        return {
          content: [
            {
              type: "text",
              text: "Error: FIRMS_MAP_KEY environment variable is not set. Please configure your NASA FIRMS MAP key.",
            },
          ],
        };
      }
      try {
        const fires = await fetchActiveFires(mapKey, source, area, day_range, date, {
          limit,
          min_frp,
          confidence,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(fires) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error fetching fire data: ${message}` }],
        };
      }
    },
  );
}
