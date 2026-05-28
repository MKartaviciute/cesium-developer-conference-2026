import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryTigerLayer, type TigerService } from "../tigerweb.js";

export function registerQueryTigerLayerTool(server: McpServer): void {
  server.registerTool(
    "query_tiger_layer",
    {
      description: "Query a TIGERweb geographic layer and return GeoJSON features",
      inputSchema: {
        service: z
          .enum(["tigerWMS_Current", "tigerWMS_ACS2023", "tigerWMS_Census2020"])
          .default("tigerWMS_Current")
          .describe("TIGERweb service name"),
        layer_id: z.number().int().describe(
          "ArcGIS layer ID. Call list_layers first to get valid layer IDs and names for the target service.",
        ),
        where: z
          .string()
          .optional()
          .describe("SQL WHERE clause to filter features (e.g. \"STATE='06'\" for California)"),
        geometry: z
          .string()
          .optional()
          .describe("Bounding box in WGS84: \"minX,minY,maxX,maxY\""),
        out_fields: z
          .array(
            z.enum([
              "GEOID",
              "NAME",
              "BASENAME",
              "STATE",
              "COUNTY",
              "AREALAND",
              "AREAWATER",
              "INTPTLAT",
              "INTPTLON",
              "CENTLAT",
              "CENTLON",
              "OID",
              "OBJECTID",
              "COUNTYNS",
              "LSADC",
              "FUNCSTAT",
              "COUNTYCC",
              "MTFCC",
            ])
          )
          .optional()
          .describe("Fields to return. Defaults to GEOID, NAME, AREALAND, AREAWATER, INTPTLAT, INTPTLON."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .default(50)
          .describe("Max features to return (max 500)"),
        return_geometry: z
          .boolean()
          .optional()
          .default(true)
          .describe("Whether to include geometry in the response. Set to false to return attributes only — much smaller responses when you only need properties like GEOID, NAME, or centroid coordinates."),
        max_allowable_offset: z
          .number()
          .optional()
          .default(0.01)
          .describe("Geometry simplification tolerance in degrees (WGS84). Higher values produce fewer coordinate points and smaller responses. E.g. 0.01 (default) for moderate simplification, 0.1 for aggressive, 0 for full-resolution geometry."),
      },
    },
    async ({ service, layer_id, where, geometry, out_fields, limit, return_geometry, max_allowable_offset }) => {
      const result = await queryTigerLayer({
        service: service as TigerService,
        layer_id,
        where,
        geometry,
        out_fields,
        limit,
        return_geometry,
        max_allowable_offset,
      });

      const geojson = result as { type: string; features?: unknown[] };
      let text = JSON.stringify(result);

      // If response exceeds ~30 KB, truncate features and add a warning
      const MAX_CHARS = 30_000;
      if (text.length > MAX_CHARS && Array.isArray(geojson.features) && geojson.features.length > 0) {
        let kept = geojson.features.length;
        while (kept > 1) {
          kept = Math.floor(kept / 2);
          const truncated = { ...geojson, features: geojson.features.slice(0, kept) };
          text = JSON.stringify(truncated);
          if (text.length <= MAX_CHARS) break;
        }
        const total = geojson.features.length;
        return {
          content: [
            {
              type: "text",
              text: `WARNING: Response truncated to ${kept} of ${total} features (exceeded ~30 KB limit). Use a higher max_allowable_offset (e.g. 0.05) or smaller limit to retrieve all features.\n\n${text}`,
            },
          ],
        };
      }

      return {
        content: [{ type: "text", text }],
      };
    },
  );
}
