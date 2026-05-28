import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryWithTimeout, PLACES_URL, isReady } from "../duckdb-client.js";

export function registerQueryPlacesTool(server: McpServer): void {
  server.registerTool(
    "query_places",
    {
      description:
        "Query Overture Maps places (POIs) from a bounding box. Optionally filter by category substring. Use limit + offset for pagination. Returns { total, offset, rows } so callers know whether a next page exists.",
      inputSchema: {
        bbox: z
          .string()
          .describe(
            "Bounding box as 'minLon,minLat,maxLon,maxLat' (WGS-84 decimal degrees)",
          ),
        category: z
          .string()
          .optional()
          .describe("Optional substring filter on category name"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum rows to return (default 50, max 100)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of rows to skip for pagination (default 0)"),
      },
    },
    async ({ bbox, category, limit, offset }) => {
      if (!isReady()) {
        return {
          content: [
            { type: "text", text: "DuckDB initialising — retry in a moment" },
          ],
        };
      }

      const parts = bbox.split(",").map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) {
        return {
          content: [
            {
              type: "text",
              text: "Invalid bbox. Expected 'minLon,minLat,maxLon,maxLat'.",
            },
          ],
        };
      }
      const [minLon, minLat, maxLon, maxLat] = parts;
      const resolvedLimit = limit ?? 50;
      const resolvedOffset = offset ?? 0;

      const categoryFilter = category
        ? `AND lower(categories.primary) LIKE lower('%${category.replace(/'/g, "''")}%')`
        : "";

      const whereClause = `
        bbox.xmin <= ${maxLon}
        AND bbox.xmax >= ${minLon}
        AND bbox.ymin <= ${maxLat}
        AND bbox.ymax >= ${minLat}
        ${categoryFilter}
      `;

      const countSql = `
        SELECT COUNT(*) AS total
        FROM read_parquet('${PLACES_URL}', hive_partitioning=false)
        WHERE ${whereClause}
      `;

      const sql = `
        SELECT
          id,
          names.primary AS name,
          categories.primary AS category,
          bbox.xmin AS lon,
          bbox.ymin AS lat
        FROM read_parquet('${PLACES_URL}', hive_partitioning=false)
        WHERE ${whereClause}
        LIMIT ${resolvedLimit} OFFSET ${resolvedOffset}
      `;

      try {
        const [countRows, rows] = await Promise.all([
          queryWithTimeout(countSql),
          queryWithTimeout(sql),
        ]);
        const total = Number((countRows[0] as { total: bigint | number }).total);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ total, offset: resolvedOffset, rows }),
            },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error querying places: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}
