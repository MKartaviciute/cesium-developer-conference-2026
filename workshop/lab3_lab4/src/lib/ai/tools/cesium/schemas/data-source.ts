import { z } from "zod";
import { isAllowedUrl } from "./shared";

// ---------------------------------------------------------------------------
// addGeoJsonLayer
// ---------------------------------------------------------------------------

export const addGeoJsonLayerSchema = z.object({
  url: z
    .string()
    .refine(isAllowedUrl, "Must be a public HTTPS URL or http://localhost for local dev")
    .optional()
    .describe("URL of a GeoJSON resource to load"),
  data: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Inline GeoJSON object to load directly (use instead of url when you have the data in-memory)"),
  name: z.string().describe("Unique data source label"),
});

export type AddGeoJsonLayerInput = z.infer<typeof addGeoJsonLayerSchema>;

export interface AddGeoJsonLayerOutput {
  success: boolean;
  name: string;
  entityCount: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// removeLayer
// ---------------------------------------------------------------------------

export const removeLayerSchema = z.object({
  name: z.string().describe("Data source name to remove"),
});

export type RemoveLayerInput = z.infer<typeof removeLayerSchema>;

export interface RemoveLayerOutput {
  success: boolean;
  removed: number;
}
