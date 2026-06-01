"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import { addTileset, listTilesets, removeTileset, styleTileset } from "@/lib/cesium/tileset";
import {
  addTilesetSchema,
  listTilesetsSchema,
  removeTilesetSchema,
  styleTilesetSchema,
  type AddTilesetOutput,
  type ListTilesetsOutput,
  type RemoveTilesetOutput,
  type StyleTilesetOutput,
} from "./schemas/tileset";

export function createTilesetTools(viewerRef: RefObject<Viewer | null>) {
  return {
    addTileset: tool({
      description:
        "Load a Cesium 3D Tiles tileset onto the globe from a Cesium Ion asset or a direct tileset.json URL. Returns a tilesetId for use with removeTileset and styleTileset.",
      inputSchema: addTilesetSchema,
      execute: async (params): Promise<AddTilesetOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, tilesetId: "", name: params.name ?? "" };
        return addTileset(viewer, params);
      },
    }),

    listTilesets: tool({
      description:
        "List all 3D Tiles tilesets currently loaded in the scene. Use the returned IDs with removeTileset and styleTileset.",
      inputSchema: listTilesetsSchema,
      execute: async (): Promise<ListTilesetsOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { tilesets: [], totalCount: 0 };
        return listTilesets(viewer);
      },
    }),

    removeTileset: tool({
      description:
        "Remove a 3D Tiles tileset from the scene by its ID (from addTileset), by name, or set removeAll=true to remove all tilesets at once.",
      inputSchema: removeTilesetSchema,
      execute: async (params): Promise<RemoveTilesetOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, removed: 0 };
        return removeTileset(viewer, params);
      },
    }),

    styleTileset: tool({
      description:
        "Apply a 3D Tiles style to a loaded tileset. " +
        "Use for 'color the buildings', 'highlight by height', 'change tileset color', 'make buildings red', 'color by property', 'show only tall buildings'. " +
        "Use color() expressions for a single solid color, or colorConditions for property-based conditional coloring (e.g. color by building height).",
      inputSchema: styleTilesetSchema,
      execute: async (params): Promise<StyleTilesetOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, tilesetId: params.id ?? "", name: params.name ?? "" };
        return styleTileset(viewer, params);
      },
    }),
  };
}
