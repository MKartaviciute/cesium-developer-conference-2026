import type * as CesiumType from "cesium";

/** Fly the camera to a lat/lon coordinate. */
export async function flyToLocation(
  viewer: CesiumType.Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    duration?: number;
  },
): Promise<void> {
  const Cesium = await import("cesium");
  const { latitude, longitude, altitude = 1_000_000, duration = 3 } = params;

  return new Promise((resolve, reject) => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
      duration,
      complete: resolve,
      cancel: reject,
    });
  });
}
