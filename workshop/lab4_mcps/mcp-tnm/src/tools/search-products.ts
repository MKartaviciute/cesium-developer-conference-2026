import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchProducts } from "../tnm.js";

export function registerSearchProductsTool(server: McpServer): void {
  server.registerTool(
    "search_products",
    {
      description:
        "Search downloadable geospatial products from USGS The National Map (TNM) Access API. Returns { total, items[] } — use offset+limit to paginate when total > items.length.",
      inputSchema: {
        datasets: z
          .string()
          .optional()
          .describe(
            'Comma-separated dataset tag(s), e.g. "National Elevation Dataset (NED) 1 arc-second"',
          ),
        bbox: z
          .string()
          .optional()
          .describe(
            "Bounding box as \"minX,minY,maxX,maxY\" in WGS84 decimal degrees",
          ),
        start: z
          .string()
          .optional()
          .describe("Product publication date lower bound (YYYY-MM-DD)"),
        stop: z
          .string()
          .optional()
          .describe("Product publication date upper bound (YYYY-MM-DD)"),
        q: z
          .string()
          .optional()
          .describe("Keyword search against product title/description"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(10)
          .optional()
          .describe("Maximum number of results to return (max 100, default 10). Use offset to paginate — check total in the response."),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .optional()
          .describe("Offset for pagination"),
      },
    },
    async ({ datasets, bbox, start, stop, q, limit, offset }) => {
      try {
        const result = await searchProducts({ datasets, bbox, start, stop, q, limit, offset });
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (err) {
        const message = err instanceof Error
          ? `${err.message}${(err as NodeJS.ErrnoException).cause ? ` (cause: ${String((err as NodeJS.ErrnoException).cause)})` : ""}`
          : String(err);
        return {
          content: [{ type: "text", text: `Error searching TNM products: ${message}` }],
        };
      }
    },
  );
}
