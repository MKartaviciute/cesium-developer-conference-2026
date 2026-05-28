import { z } from "zod";
import { isAllowedUrl } from "./shared";

// ---------------------------------------------------------------------------
// addImageryLayer — add a map imagery layer to the globe
// ---------------------------------------------------------------------------

export const addImageryLayerSchema = z.object({
  type: z
    .enum(["osm", "ion", "url", "wms", "arcgis"])
    .describe(
      "Imagery provider type: 'osm' (OpenStreetMap — no url needed, has built-in tile URL), 'ion' (Cesium Ion — needs assetId), 'url' (tile URL template — needs url), 'wms' (OGC WMS — needs url + layers), 'arcgis' (ArcGIS MapServer — needs url)",
    ),
  url: z
    .string()
    .refine(
      (v) => !v || isAllowedUrl(v),
      "Must be a public HTTPS URL or http://localhost for local dev",
    )
    .optional()
    .describe(
      "Provider URL — required for types 'url', 'wms', and 'arcgis'. For 'url' type use a tile template like 'https://tile.example.com/{z}/{x}/{y}.png'. Omit entirely for type 'osm'.",
    ),
  assetId: z
    .coerce
    .number()
    .int()
    .optional()
    .describe("Cesium Ion asset ID (required for type 'ion')"),
  layers: z
    .string()
    .optional()
    .describe("Comma-separated WMS layer names (required for type 'wms')"),
  name: z.string().optional().describe("Display name for the layer"),
  alpha: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Layer transparency 0 (transparent) to 1 (opaque; default 1)"),
  show: z
    .boolean()
    .optional()
    .describe("Whether the layer is initially visible (default true)"),
});

export type AddImageryLayerInput = z.infer<typeof addImageryLayerSchema>;

export interface AddImageryLayerOutput {
  success: boolean;
  index: number;
  name: string;
  providerType: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// listImageryLayers — list all imagery layers on the globe
// ---------------------------------------------------------------------------

export const listImageryLayersSchema = z.object({});

export type ListImageryLayersInput = z.infer<typeof listImageryLayersSchema>;

export interface ListImageryLayerEntry {
  index: number;
  name: string;
  show: boolean;
  alpha: number;
}

export interface ListImageryLayersOutput {
  layers: ListImageryLayerEntry[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// removeImageryLayer — remove a layer by index or name
// ---------------------------------------------------------------------------

export const removeImageryLayerSchema = z.object({
  index: z
    .number()
    .optional()
    .describe("Zero-based layer index (from listImageryLayers)"),
  name: z.string().optional().describe("Layer name to remove (first match)"),
  removeAll: z
    .boolean()
    .optional()
    .describe("Remove all non-base imagery layers (default false)"),
});

export type RemoveImageryLayerInput = z.infer<typeof removeImageryLayerSchema>;

export interface RemoveImageryLayerOutput {
  success: boolean;
  removed: number;
  error?: string;
}
