import { z } from "zod";
import { isAllowedUrl } from "./shared";

// ---------------------------------------------------------------------------
// addTileset — load a Cesium 3D Tiles tileset
// ---------------------------------------------------------------------------

export const addTilesetSchema = z.object({
  type: z
    .enum(["ion", "url"])
    .describe(
      "Tileset source: 'ion' uses a Cesium Ion asset, 'url' uses a direct tileset.json URL",
    ),
  assetId: z
    .coerce
    .number()
    .int()
    .optional()
    .describe("Cesium Ion 3D Tiles asset ID (required for type 'ion')"),
  url: z
    .string()
    .refine(
      (v) => v === "" || isAllowedUrl(v),
      "Must be a public HTTPS URL or http://localhost for local dev",
    )
    .optional()
    .describe(
      "URL to tileset.json (required for type 'url')",
    ),
  name: z
    .string()
    .optional()
    .describe("Display name for the tileset (used by styleTileset/removeTileset)"),
  show: z
    .boolean()
    .optional()
    .describe("Initial visibility (default true)"),
});

export type AddTilesetInput = z.infer<typeof addTilesetSchema>;

export interface AddTilesetOutput {
  success: boolean;
  tilesetId: string;
  name: string;
}

// ---------------------------------------------------------------------------
// listTilesets — list all loaded 3D Tiles tilesets
// ---------------------------------------------------------------------------

export const listTilesetsSchema = z.object({});

export type ListTilesetsInput = z.infer<typeof listTilesetsSchema>;

export interface TilesetEntry {
  id: string;
  name: string;
  show: boolean;
}

export interface ListTilesetsOutput {
  tilesets: TilesetEntry[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// removeTileset — remove a loaded tileset by id or name
// ---------------------------------------------------------------------------

export const removeTilesetSchema = z
  .object({
    id: z.string().optional().describe("Tileset ID returned by addTileset"),
    name: z.string().optional().describe("Tileset display name (first match)"),
    removeAll: z
      .boolean()
      .optional()
      .describe("Remove all loaded tilesets (default false)"),
  })
  .refine((v) => v.id !== undefined || v.name !== undefined || v.removeAll === true, {
    message: "Provide id, name, or set removeAll=true",
  });

export type RemoveTilesetInput = z.infer<typeof removeTilesetSchema>;

export interface RemoveTilesetOutput {
  success: boolean;
  removed: number;
}

// ---------------------------------------------------------------------------
// styleTileset — apply a 3D Tiles style to a loaded tileset
// ---------------------------------------------------------------------------

export const styleTilesetSchema = z.object({
  id: z.string().optional().describe("Tileset ID returned by addTileset"),
  name: z.string().optional().describe("Tileset display name (first match)"),
  color: z
    .string()
    .optional()
    .describe(
      "Single color expression using the color() function, e.g. \"color('#ff0000')\" or \"color('red', 0.5)\"",
    ),
  colorConditions: z
    .array(
      z.object({
        condition: z
          .string()
          .min(1, "condition must not be empty")
          .describe(
            "Boolean condition expression in Cesium 3D Tiles style syntax. " +
            "Property names depend entirely on the tileset's batch table — inspect the data or check its documentation to know what properties are available (e.g. Height, name, type, or vendor-prefixed names). " +
            "Simple alphanumeric properties: \${Height} or \${BuildingType}. " +
            "Properties containing special characters (colon, hash, space) require bracket notation with SINGLE quotes: \${feature['prop:name']}. " +
            "Always guard numeric comparisons with !== undefined: \${Height} !== undefined && \${Height} > 50. " +
            "Do NOT use defined() — the 3D Tiles style language does not support it. " +
            "The catch-all rule must be the string \"true\"."
          ),
        colorExpr: z
          .string()
          .min(1, "colorExpr must not be empty")
          .refine(
            (v) => /^color\s*\(/.test(v.trim()),
            "colorExpr must be a color() expression, e.g. \"color('red')\" or \"color('#ff6600')\"",
          )
          .describe("Color expression, e.g. \"color('red')\" or \"color('#ff6600')\""),
      }),
    )
    .refine(
      (rules) => rules == null || rules.length === 0 || rules[rules.length - 1].condition.trim() === "true",
      "The last colorConditions entry must be a catch-all with condition=\"true\" to handle unmatched features",
    )
    .optional()
    .describe(
      "Conditional color rules evaluated top-to-bottom. Each rule has a 'condition' and a 'colorExpr'. " +
      "Always add a catch-all {condition: 'true', colorExpr: \"color('white')\"} as the last entry.",
    ),
  show: z.boolean().optional().describe("Tileset-wide visibility flag"),
  showConditions: z
    .array(
      z.object({
        condition: z.string().describe("Boolean condition expression"),
        showExpr: z.string().describe("Boolean show expression, e.g. 'true' or 'false'"),
      }),
    )
    .optional()
    .describe("Conditional show rules evaluated top-to-bottom."),
});

export type StyleTilesetInput = z.infer<typeof styleTilesetSchema>;

export interface StyleTilesetOutput {
  success: boolean;
  tilesetId: string;
  name: string;
  error?: string;
}
