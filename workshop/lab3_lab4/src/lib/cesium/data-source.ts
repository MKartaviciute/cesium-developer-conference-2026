"use client";

import * as Cesium from "cesium";
import type { Viewer } from "cesium";
import type { AddGeoJsonLayerOutput, RemoveLayerOutput } from "@/lib/ai/tools/cesium/schemas/data-source";

function describeGeoJsonError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  const fallback = String(error).trim();
  if (fallback && fallback !== "[object Object]") {
    return fallback;
  }

  return "Request has failed.";
}

export async function addGeoJsonLayer(
  viewer: Viewer,
  params: { url?: string; data?: unknown; name: string },
): Promise<AddGeoJsonLayerOutput> {
  const { url, data, name } = params;
  if (!url && !data) {
    return {
      success: false,
      name,
      entityCount: 0,
      message: "Provide either a GeoJSON URL or inline GeoJSON data.",
    };
  }

  try {
    const dataSource = await Cesium.GeoJsonDataSource.load((url ?? data)!, {
      credit: name,
    });
    dataSource.name = name;
    await viewer.dataSources.add(dataSource);

    return {
      success: true,
      name,
      entityCount: dataSource.entities.values.length,
    };
  } catch (error) {
    const sourceLabel = url ? ` from ${url}` : " from inline data";
    return {
      success: false,
      name,
      entityCount: 0,
      message: `Could not load GeoJSON${sourceLabel}: ${describeGeoJsonError(error)}`,
    };
  }
}

export function removeLayer(
  viewer: Viewer,
  params: { name: string },
): RemoveLayerOutput {
  const { name } = params;
  let removed = 0;
  const { dataSources } = viewer;

  // Iterate in reverse so removal doesn't shift indices mid-scan.
  for (let i = dataSources.length - 1; i >= 0; i--) {
    const ds = dataSources.get(i);
    if (ds.name === name) {
      dataSources.remove(ds, true);
      removed++;
    }
  }

  return { success: removed > 0, removed };
}
