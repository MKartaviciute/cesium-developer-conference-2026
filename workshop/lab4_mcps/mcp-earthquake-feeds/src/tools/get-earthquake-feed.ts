import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchEarthquakeFeed } from "../usgs-client.js";

export function registerGetEarthquakeFeedTool(server: McpServer): void {
  server.registerTool(
    "get_earthquake_feed",
    {
      description:
        "Fetch a pre-bucketed USGS summary feed of recent earthquakes. " +
        "Returns a slimmed feature list with: id, mag, magType, place, time, status, tsunami, sig, alert, felt, cdi, mmi, coordinates [lon, lat, depth_km]. " +
        "Also returns feed metadata (generated timestamp, api version, count) and pagination fields (offset, count, hasMore, nextOffset). " +
        "Results are paginated — use limit (default 100, max 100) and offset to page through large feeds.",
      inputSchema: {
        period: z
          .enum(["hour", "day", "week", "month"])
          .default("day")
          .describe("Time window for the feed"),
        min_magnitude: z
          .enum(["all", "1.0", "2.5", "4.5", "significant"])
          .default("2.5")
          .describe("Minimum magnitude bucket"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(100)
          .describe("Number of events to return (1–100, default 100)."),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe("Zero-based index of the first event to return. Increment by limit to page through results."),
      },
    },
    async ({ period, min_magnitude, limit, offset }) => {
      const data = await fetchEarthquakeFeed(min_magnitude, period);
      const page = data.features.slice(offset, offset + limit);
      const hasMore = offset + page.length < data.count;
      const { generated, api, count: metaCount } = data.metadata;
      const result = {
        metadata: { generated, api, count: metaCount },
        offset,
        count: page.length,
        hasMore,
        nextOffset: hasMore ? offset + page.length : undefined,
        features: page,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
