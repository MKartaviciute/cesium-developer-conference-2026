"use client";

import type { Viewer } from "cesium";
import { cesium } from "./cesium-loader";
import type {
  SetTerrainOutput,
  RemoveTerrainOutput,
  GetTerrainOutput,
} from "@/lib/ai/tools/cesium/schemas/terrain";

/** Wraps a promise with a timeout rejection. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

export async function setTerrain(
  viewer: Viewer,
  params: {
    type: "ellipsoid" | "ion" | "url";
    assetId?: number;
    url?: string;
    requestVertexNormals?: boolean;
    requestWaterMask?: boolean;
  },
): Promise<SetTerrainOutput> {
  const { type, assetId, url, requestVertexNormals = false, requestWaterMask = false } = params;
  const Cesium = await cesium();

  try {
    switch (type) {
      case "ellipsoid":
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        return { success: true, terrainType: "ellipsoid" };

      case "ion": {
        if (assetId === undefined) return { success: false, terrainType: type };
        const provider = await withTimeout(
          Cesium.CesiumTerrainProvider.fromIonAssetId(assetId, {
            requestVertexNormals,
            requestWaterMask,
          }),
          30_000,
          `CesiumTerrainProvider.fromIonAssetId(${assetId})`,
        );
        viewer.terrainProvider = provider;
        return { success: true, terrainType: "ion" };
      }

      case "url": {
        if (!url) return { success: false, terrainType: type };
        const provider = await withTimeout(
          Cesium.CesiumTerrainProvider.fromUrl(url, {
            requestVertexNormals,
            requestWaterMask,
          }),
          30_000,
          `CesiumTerrainProvider.fromUrl`,
        );
        viewer.terrainProvider = provider;
        return { success: true, terrainType: "url" };
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, terrainType: type, error };
  }

  return { success: false, terrainType: type };
}

export async function removeTerrain(viewer: Viewer): Promise<RemoveTerrainOutput> {
  const Cesium = await cesium();
  viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  return { success: true };
}

export async function getTerrainInfo(viewer: Viewer): Promise<GetTerrainOutput> {
  const Cesium = await cesium();
  const provider = viewer.terrainProvider;

  let terrainType = "custom";
  if (provider instanceof Cesium.EllipsoidTerrainProvider) {
    terrainType = "ellipsoid";
  } else if (provider instanceof Cesium.CesiumTerrainProvider) {
    terrainType = "cesium";
  }

  return {
    success: true,
    terrainType,
    providerName: provider.constructor.name,
    hasVertexNormals: provider.hasVertexNormals ?? false,
    hasWaterMask: provider.hasWaterMask ?? false,
  };
}
