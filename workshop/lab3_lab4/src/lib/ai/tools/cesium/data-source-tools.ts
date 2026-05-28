"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import { addGeoJsonLayer, removeLayer } from "@/lib/cesium/data-source";
import {
  addGeoJsonLayerSchema,
  removeLayerSchema,
  type AddGeoJsonLayerOutput,
  type RemoveLayerOutput,
} from "./schemas/data-source";

export function createDataSourceTools(viewerRef: RefObject<Viewer | null>) {
  return {
    addGeoJsonLayer: tool({
      description:
        "Load a GeoJSON or geographic data source onto the globe from a URL or inline object. Use for 'load geographic data', 'display spatial features', 'show this GeoJSON', 'import a data layer', 'visualize boundaries'. After loading, call flyTo to the geographic centre so the user can see what was added.",
      inputSchema: addGeoJsonLayerSchema,
      execute: async (params): Promise<AddGeoJsonLayerOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, name: params.name, entityCount: 0 };
        return addGeoJsonLayer(viewer, params);
      },
    }),

    removeLayer: tool({
      description: "Remove a GeoJSON or data source layer from the globe by name. Use this only for layers added with addGeoJsonLayer — for point/shape entities use removeEntity, for 3D tilesets use removeTileset, for imagery use removeImageryLayer.",
      inputSchema: removeLayerSchema,
      execute: async (params): Promise<RemoveLayerOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, removed: 0 };
        return removeLayer(viewer, params);
      },
    }),
  };
}
