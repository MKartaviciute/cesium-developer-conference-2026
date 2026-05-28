"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import { setTerrain, removeTerrain, getTerrainInfo } from "@/lib/cesium/terrain";
import {
  setTerrainSchema,
  removeTerrainSchema,
  getTerrainSchema,
  type SetTerrainOutput,
  type RemoveTerrainOutput,
  type GetTerrainOutput,
} from "./schemas/terrain";

export function createTerrainTools(viewerRef: RefObject<Viewer | null>) {
  return {
    setTerrain: tool({
      description:
        "Set the terrain elevation provider for the globe. Use for 'show 3D terrain', 'add elevation data', 'enable mountains', 'make terrain 3D', 'show topography'. Use type='ion' with assetId=1 for Cesium World Terrain (recommended). Use type='ellipsoid' for a flat globe. Use type='url' to load from a custom Quantized-Mesh server.",
      inputSchema: setTerrainSchema,
      execute: async (params): Promise<SetTerrainOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, terrainType: params.type };
        return setTerrain(viewer, params);
      },
    }),

    removeTerrain: tool({
      description:
        "Remove the current terrain provider and reset the globe to a flat WGS84 ellipsoid. Use for 'remove terrain', 'flatten the globe', 'disable elevation', 'reset terrain'.",
      inputSchema: removeTerrainSchema,
      execute: async (): Promise<RemoveTerrainOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false };
        return removeTerrain(viewer);
      },
    }),

    getTerrain: tool({
      description:
        "Get information about the currently active terrain provider: type (ellipsoid, cesium, custom), name, and capability flags.",
      inputSchema: getTerrainSchema,
      execute: async (): Promise<GetTerrainOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) {
          return {
            success: false,
            terrainType: "unknown",
            providerName: "unknown",
            hasVertexNormals: false,
            hasWaterMask: false,
          };
        }
        return getTerrainInfo(viewer);
      },
    }),
  };
}
