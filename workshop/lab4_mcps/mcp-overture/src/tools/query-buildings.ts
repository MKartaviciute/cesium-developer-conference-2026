import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryWithTimeout, buildingsSource, isReady } from "../duckdb-client.js";

export function registerQueryBuildingsTool(server: McpServer): void {
  server.registerTool(
    "query_buildings",
    {
      description:
        "Query Overture Maps building footprints within a bounding box. Optionally filter by minimum height.",
      inputSchema: {
        bbox: z
          .string()
          .describe(
            "Bounding box as 'minLon,minLat,maxLon,maxLat' (WGS-84 decimal degrees)",
          ),
        min_height: z
          .number()
          .optional()
          .describe("Minimum building height in metres (optional)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Maximum rows to return (default 100, max 1000)"),
      },
    },
    async ({ bbox, min_height, limit }) => {
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
      const resolvedLimit = limit ?? 100;

      const heightFilter =
        min_height !== undefined && min_height !== null
          ? `AND height >= ${min_height}`
          : "";

      const source = buildingsSource(minLon, minLat, maxLon, maxLat);
      const sql = `
        SELECT
          id,
          height,
          class,
          ST_AsGeoJSON(geometry) AS geometry
        FROM read_parquet(${source}, hive_partitioning=false)
        WHERE
          bbox.xmin <= ${maxLon}
          AND bbox.xmax >= ${minLon}
          AND bbox.ymin <= ${maxLat}
          AND bbox.ymax >= ${minLat}
          ${heightFilter}
        LIMIT ${resolvedLimit}
      `;

      try {
        const rows = await queryWithTimeout(sql);
        return { content: [{ type: "text", text: JSON.stringify(rows) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error querying buildings: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}
