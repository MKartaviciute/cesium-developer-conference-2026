"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import {
  addImageryLayer,
  listImageryLayers,
  removeImageryLayer,
} from "@/lib/cesium/imagery";
import {
  addImageryLayerSchema,
  listImageryLayersSchema,
  removeImageryLayerSchema,
  type AddImageryLayerOutput,
  type ListImageryLayersOutput,
  type RemoveImageryLayerOutput,
} from "./schemas/imagery";

export function createImageryTools(viewerRef: RefObject<Viewer | null>) {
  return {
    addImageryLayer: tool({
      description:
        "Add a map imagery layer on top of the globe. Supports OpenStreetMap (osm), Cesium Ion assets (ion), tile URL templates (url), OGC WMS (wms), and ArcGIS MapServer (arcgis) providers.",
      inputSchema: addImageryLayerSchema,
      execute: async (params): Promise<AddImageryLayerOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) {
          return { success: false, index: -1, name: params.name ?? params.type, providerType: params.type };
        }
        return addImageryLayer(viewer, params);
      },
    }),

    listImageryLayers: tool({
      description:
        "List all imagery layers currently applied to the globe, including the base layer at index 0, with each layer's index, name, visibility, and transparency.",
      inputSchema: listImageryLayersSchema,
      execute: async (): Promise<ListImageryLayersOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { layers: [], totalCount: 0 };
        return listImageryLayers(viewer);
      },
    }),

    removeImageryLayer: tool({
      description:
        "Remove an imagery layer from the globe by its index or display name. Use removeAll=true to clear all non-base layers at once.",
      inputSchema: removeImageryLayerSchema,
      execute: async (params): Promise<RemoveImageryLayerOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, removed: 0 };
        return removeImageryLayer(viewer, params);
      },
    }),
  };
}
