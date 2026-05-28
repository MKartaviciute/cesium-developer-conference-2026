"use client";

import type { Viewer } from "cesium";
import { cesium } from "./cesium-loader";
import type {
  AddImageryLayerOutput,
  ListImageryLayersOutput,
  RemoveImageryLayerOutput,
} from "@/lib/ai/tools/cesium/schemas/imagery";

// Display names for imagery layers (WeakMap so GC can collect removed layers).
const imageryLayerNames = new WeakMap<object, string>();

export async function addImageryLayer(
  viewer: Viewer,
  params: {
    type: "osm" | "ion" | "url" | "wms" | "arcgis";
    url?: string;
    assetId?: number;
    layers?: string;
    name?: string;
    alpha?: number;
    show?: boolean;
  },
): Promise<AddImageryLayerOutput> {
  const { type, url, assetId, layers, name, alpha = 1, show = true } = params;
  const Cesium = await cesium();
  let provider: InstanceType<typeof Cesium.ImageryProvider> | undefined;

  try {
    switch (type) {
      case "osm":
        // Use UrlTemplateImageryProvider instead of the deprecated
        // OpenStreetMapImageryProvider which triggers an async readyPromise check
        // in the browser that can hang indefinitely if the tile request stalls.
        provider = new Cesium.UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          credit: "© OpenStreetMap contributors",
        });
        break;
      case "ion":
        if (assetId === undefined) {
          return { success: false, index: -1, name: name ?? "ion", providerType: type };
        }
        provider = await Cesium.IonImageryProvider.fromAssetId(assetId);
        break;
      case "url":
        if (!url) {
          return { success: false, index: -1, name: name ?? "url", providerType: type };
        }
        provider = new Cesium.UrlTemplateImageryProvider({ url });
        break;
      case "wms":
        if (!url || !layers) {
          return { success: false, index: -1, name: name ?? "wms", providerType: type };
        }
        provider = new Cesium.WebMapServiceImageryProvider({ url, layers });
        break;
      case "arcgis":
        if (!url) {
          return { success: false, index: -1, name: name ?? "arcgis", providerType: type };
        }
        provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(url);
        break;
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, index: -1, name: name ?? type, providerType: type, error };
  }

  if (!provider) {
    return { success: false, index: -1, name: name ?? type, providerType: type };
  }

  const layer = viewer.imageryLayers.addImageryProvider(provider);
  layer.alpha = alpha;
  layer.show = show;

  const displayName = name ?? type;
  imageryLayerNames.set(layer, displayName);

  return {
    success: true,
    index: viewer.imageryLayers.indexOf(layer),
    name: displayName,
    providerType: type,
  };
}

export function listImageryLayers(viewer: Viewer): ListImageryLayersOutput {
  const { imageryLayers } = viewer;
  const layers = Array.from({ length: imageryLayers.length }, (_, i) => {
    const layer = imageryLayers.get(i);
    return {
      index: i,
      name:
        (imageryLayerNames.get(layer) as string | undefined) ??
        (i === 0 ? "Base Imagery" : `Layer ${i}`),
      show: layer.show,
      alpha: layer.alpha,
    };
  });
  return { layers, totalCount: layers.length };
}

export function removeImageryLayer(
  viewer: Viewer,
  params: { index?: number; name?: string; removeAll?: boolean },
): RemoveImageryLayerOutput {
  const { index, name, removeAll = false } = params;
  const { imageryLayers } = viewer;
  let removed = 0;

  if (removeAll) {
    for (let i = imageryLayers.length - 1; i > 0; i--) {
      imageryLayers.remove(imageryLayers.get(i), true);
      removed++;
    }
  } else if (index !== undefined) {
    if (index < 0 || index >= imageryLayers.length) {
      return { success: false, removed: 0, error: `No imagery layer at index ${index} (total layers: ${imageryLayers.length})` };
    }
    const layer = imageryLayers.get(index);
    if (layer) { imageryLayers.remove(layer, true); removed++; }
  } else if (name !== undefined) {
    for (let i = imageryLayers.length - 1; i >= 0; i--) {
      if (imageryLayerNames.get(imageryLayers.get(i)) === name) {
        imageryLayers.remove(imageryLayers.get(i), true);
        removed++;
        break;
      }
    }
    if (removed === 0) {
      return { success: false, removed: 0, error: `No imagery layer named "${name}" found` };
    }
  } else {
    return { success: false, removed: 0, error: "Provide index, name, or removeAll=true" };
  }

  return { success: removed > 0, removed };
}
