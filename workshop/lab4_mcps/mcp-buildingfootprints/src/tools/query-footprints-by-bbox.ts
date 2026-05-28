import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ensureCsvLoaded } from "../db.js";
import { streamFootprintsByBbox } from "../stream.js";
import type { Bbox } from "../quadkey.js";

export function registerQueryFootprintsByBboxTool(server: McpServer): void {
  server.registerTool(
    "query_footprints_by_bbox",
    {
      description:
        "Query Microsoft ML building footprints for a country by bounding box. Downloads only the relevant geographic shards on demand — no pre-indexing required.",
      inputSchema: {
        country: z
          .string()
          .describe(
            "Country/region name matching the Location column in dataset-links.csv. Use list_countries to see valid values.",
          ),
        bbox: z
          .string()
          .describe(
            "Bounding box as 'minLon,minLat,maxLon,maxLat' (WGS-84 decimal degrees)",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(2000)
          .optional()
          .describe("Maximum footprints to return (default 200, max 2000)"),
        count_only: z
          .boolean()
          .optional()
          .describe(
            "When true, return only the count and shard stats without geometry — avoids token-limit errors for large bboxes.",
          ),
      },
    },
    async ({ country, bbox, limit, count_only }) => {
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
      const queryBbox: Bbox = { minLon, maxLon, minLat, maxLat };
      const resolvedLimit = limit ?? 200;

      let csvRows;
      try {
        csvRows = await ensureCsvLoaded();
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error loading dataset index: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }

      const countryExists = csvRows.some((r) => r.Location === country);
      if (!countryExists) {
        return {
          content: [
            {
              type: "text",
              text: `Country '${country}' not found. Use list_countries to see valid values.`,
            },
          ],
        };
      }

      try {
        const { results, shardsChecked, shardsMatched } =
          await streamFootprintsByBbox(csvRows, country, queryBbox, resolvedLimit);

        const features = results.map((f) => {
          const geom = JSON.parse(f.geometry_geojson);
          // Trim coordinate precision to 6 decimal places (~11 cm accuracy)
          if (geom.coordinates) {
            geom.coordinates = geom.coordinates.map((ring: number[][]) =>
              ring.map(([lon, lat]) => [
                Math.round(lon * 1e6) / 1e6,
                Math.round(lat * 1e6) / 1e6,
              ]),
            );
          }
          const feature: Record<string, unknown> = { geometry: geom };
          if (f.height !== -1) feature.height = f.height;
          if (f.confidence !== -1) feature.confidence = f.confidence;
          return feature;
        });

        const payload: Record<string, unknown> = {
          count: features.length,
          shardsChecked,
          shardsMatched,
        };
        if (!count_only) payload.features = features;

        return {
          content: [{ type: "text", text: JSON.stringify(payload) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error querying footprints: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
