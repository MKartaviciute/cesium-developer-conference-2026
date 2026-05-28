"use client";

let _cesium: typeof import("cesium") | null = null;

export async function cesium(): Promise<typeof import("cesium")> {
  return (_cesium ??= await import("cesium"));
}

export function cesiumSync(): typeof import("cesium") {
  if (_cesium) return _cesium;
  const win = window as { __Cesium__?: typeof import("cesium") };
  if (win.__Cesium__) {
    _cesium = win.__Cesium__;
    return _cesium;
  }
  throw new Error("CesiumJS has not been loaded yet. Use the async cesium() instead.");
}
