import * as Cesium from "cesium";

/**
 * Lab 1 — Section 3 (📖 Review only)
 *
 * This file is pre-populated — no edits needed here.
 * Your work for Lab 1 is in src/lib/ai/tools/cesium/camera-tools.ts.
 */

/** Fly the camera to a lat/lon coordinate. */
export function flyToLocation(
  // Reference to the 3D viewer - used to call CesiumJS functions.
  viewer: Cesium.Viewer,
  // All input parameters required and optional for flyTo.
  params: {
    latitude: number;     // latitude in degrees
    longitude: number;    // longitude in degrees
    altitude?: number;    // altitude in meters
    duration?: number;    // how long animation should last in seconds
  },
): Promise<void> {
  // Instantiate variables with defaults for optional parameters.
  const { latitude, longitude, altitude = 1_000_000, duration = 3 } = params;

  // Execute the flyTo function and return an async promise.
  return new Promise((resolve, reject) => {
    viewer.camera.flyTo({
      // Destination is a Cartesian3 object calculated
      // using longitude, latitude, and altitude.
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
      duration,
      complete: resolve,
      cancel: reject,
    });
  });
}
