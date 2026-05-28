import { z } from "zod";
import { isAllowedUrl } from "./shared";

// ---------------------------------------------------------------------------
// setTerrain — set the terrain provider
// ---------------------------------------------------------------------------

export const setTerrainSchema = z
  .object({
    type: z
      .enum(["ion", "url", "ellipsoid"])
      .describe(
        "Terrain source: 'ion' (Cesium Ion), 'url' (Quantized-Mesh server), 'ellipsoid' (flat WGS84, no elevation)",
      ),
    assetId: z
      .coerce
      .number()
      .int()
      .optional()
      .describe(
        "Cesium Ion terrain asset ID (required for type 'ion'; use 1 for Cesium World Terrain)",
      ),
    url: z
      .string()
      .optional()
      .describe(
        "Quantized-Mesh terrain server URL — required only when type='url'. Must be a public HTTPS URL. Omit for type='ion' or type='ellipsoid'.",
      ),
    requestVertexNormals: z
      .boolean()
      .optional()
      .describe("Request vertex normals for better lighting (default false)"),
    requestWaterMask: z
      .boolean()
      .optional()
      .describe("Request water mask data (default false)"),
  })
  .superRefine((v, ctx) => {
    if (v.type === "ion" && v.assetId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "assetId is required when type is 'ion' (use assetId=1 for Cesium World Terrain)",
        path: ["assetId"],
      });
    }
    if (v.type === "url") {
      const urlVal = v.url ?? "";
      if (!urlVal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "url is required when type is 'url'",
          path: ["url"],
        });
      } else if (!isAllowedUrl(urlVal)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "url must be a public HTTPS URL or http://localhost",
          path: ["url"],
        });
      }
    }
  });

export type SetTerrainInput = z.infer<typeof setTerrainSchema>;

export interface SetTerrainOutput {
  success: boolean;
  terrainType: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// removeTerrain — reset to flat WGS84 ellipsoid (no elevation)
// ---------------------------------------------------------------------------

export const removeTerrainSchema = z.object({});

export type RemoveTerrainInput = z.infer<typeof removeTerrainSchema>;

export interface RemoveTerrainOutput {
  success: boolean;
}

// ---------------------------------------------------------------------------
// getTerrain — query the active terrain provider
// ---------------------------------------------------------------------------

export const getTerrainSchema = z.object({});

export type GetTerrainInput = z.infer<typeof getTerrainSchema>;

export interface GetTerrainOutput {
  success: boolean;
  terrainType: string;
  providerName: string;
  hasVertexNormals: boolean;
  hasWaterMask: boolean;
}
