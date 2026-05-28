"use client";

import type { Viewer } from "cesium";
import { cesium } from "./cesium-loader";

import type {
  FlyToOutput,
  CameraSetViewOutput,
  CameraLookAtOutput,
  CameraStartOrbitOutput,
  CameraStopOrbitOutput,
  CameraGetPositionOutput,
  CameraSetControllerOptionsOutput,
  ZoomToOutput,
} from "@/lib/ai/tools/cesium/schemas/camera";

// Orbit removal functions keyed by Viewer instance.
// WeakMap allows the Viewer to be GC-collected after unmount.
export const orbitListeners = new WeakMap<Viewer, () => void>();

/**
 * Stops any active orbit and releases any lookAt constraint so that
 * subsequent camera operations (flyTo, setView, lookAt) are not overridden
 * by a running orbit loop and behave as expected.
 */
async function releaseCameraConstraints(viewer: Viewer): Promise<void> {
  // Stop orbit listener if one is running.
  const removeOrbit = orbitListeners.get(viewer);
  if (removeOrbit) {
    removeOrbit();
    orbitListeners.delete(viewer);
  }
  // Cancel any in-progress flyTo animation so it cannot override the
  // subsequent setView / lookAt / flyTo call on the next render frame.
  viewer.camera.cancelFlight();
  // Release any entity-tracking lock. When trackedEntity is set, CesiumJS
  // re-positions the camera every frame to follow the entity, which overrides
  // manual camera commands (flyTo, setView, lookAt, orbit).
  if (viewer.trackedEntity) {
    viewer.trackedEntity = undefined;
  }
  // Release any lookAt lock (camera.lookAt sets a non-identity transform).
  const Cesium = await cesium();
  if (!Cesium.Matrix4.equals(viewer.camera.transform, Cesium.Matrix4.IDENTITY)) {
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }
}

export async function flyToLocation(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    heading?: number;
    pitch?: number;
    duration?: number;
    name?: string;
  },
): Promise<FlyToOutput> {
  const { latitude, longitude, altitude = 1_000, heading = 0, pitch = -90, duration = 3, name } = params;
  await releaseCameraConstraints(viewer);
  const Cesium = await cesium();

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
    orientation: {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: 0,
    },
    duration,
  });

  // NOTE: flyTo intentionally does NOT add an entity for the destination.
  // Use addEntity to place a named marker — mixing navigation and entity
  // creation in one tool pollutes entity counts and causes test failures.

  return { success: true, location: name ?? `${latitude}, ${longitude}` };
}

export async function setCameraView(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    heading?: number;
    pitch?: number;
    roll?: number;
  },
): Promise<CameraSetViewOutput> {
  const { latitude, longitude, altitude = 1_000, heading = 0, pitch = -90, roll = 0 } = params;
  await releaseCameraConstraints(viewer);
  const Cesium = await cesium();

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
    orientation: {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: Cesium.Math.toRadians(roll),
    },
  });

  return { success: true, location: `${latitude}, ${longitude}` };
}

export async function cameraLookAt(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    range?: number;
    pitch?: number;
    heading?: number;
  },
): Promise<CameraLookAtOutput> {
  const { latitude, longitude, altitude = 0, range = 1_000, pitch = -45, heading = 0 } = params;
  // Cancel any in-progress flight, stop orbit, and release any existing
  // lookAt lock before setting the new look-at target.
  await releaseCameraConstraints(viewer);
  const Cesium = await cesium();

  viewer.camera.lookAt(
    Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
    new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(heading),
      Cesium.Math.toRadians(pitch),
      range,
    ),
  );

  return { success: true, target: `${latitude}, ${longitude}`, range };
}

export async function startCameraOrbit(
  viewer: Viewer,
  params: {
    speed?: number;
    direction?: "clockwise" | "counterclockwise";
  },
): Promise<CameraStartOrbitOutput> {
  const { speed = 10, direction = "clockwise" } = params;

  // Cancel any existing orbit before starting a new one.
  orbitListeners.get(viewer)?.();
  orbitListeners.delete(viewer);
  // Cancel any in-progress flyTo so the animation cannot override the orbit.
  viewer.camera.cancelFlight();

  const Cesium = await cesium();
  const sign = direction === "counterclockwise" ? -1 : 1;
  const radiansPerSecond = Cesium.Math.toRadians(speed) * sign;
  let lastTime = Date.now();

  const onPreRender = () => {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -radiansPerSecond * dt);
    // Keep requesting renders so the orbit loop continues when requestRenderMode is true.
    viewer.scene.requestRender();
  };

  viewer.scene.preRender.addEventListener(onPreRender);
  orbitListeners.set(viewer, () =>
    viewer.scene.preRender.removeEventListener(onPreRender),
  );

  return { success: true, speed, direction };
}

export function stopCameraOrbit(viewer: Viewer): CameraStopOrbitOutput {
  const remove = orbitListeners.get(viewer);
  if (remove) {
    remove();
    orbitListeners.delete(viewer);
    return { success: true, wasOrbiting: true };
  }
  return { success: true, wasOrbiting: false };
}

export async function getCameraPosition(viewer: Viewer): Promise<CameraGetPositionOutput> {
  const Cesium = await cesium();
  const camera = viewer.camera;
  const carto = camera.positionCartographic;

  const position = {
    latitude: Cesium.Math.toDegrees(carto.latitude),
    longitude: Cesium.Math.toDegrees(carto.longitude),
    altitude: carto.height,
  };

  const orientation = {
    heading: Cesium.Math.toDegrees(camera.heading),
    pitch: Cesium.Math.toDegrees(camera.pitch),
    roll: Cesium.Math.toDegrees(camera.roll),
  };

  let viewRectangle: CameraGetPositionOutput["viewRectangle"] = null;
  try {
    const rect = camera.computeViewRectangle();
    if (rect) {
      viewRectangle = {
        west: Cesium.Math.toDegrees(rect.west),
        south: Cesium.Math.toDegrees(rect.south),
        east: Cesium.Math.toDegrees(rect.east),
        north: Cesium.Math.toDegrees(rect.north),
      };
    }
  } catch {
    // computeViewRectangle can throw when camera is not in a valid state
  }

  return { success: true, position, orientation, viewRectangle };
}

export function setCameraControllerOptions(
  viewer: Viewer,
  params: {
    enableCollisionDetection?: boolean;
    minimumZoomDistance?: number;
    maximumZoomDistance?: number;
    enableTilt?: boolean;
    enableRotate?: boolean;
    enableTranslate?: boolean;
    enableZoom?: boolean;
    enableLook?: boolean;
  },
): CameraSetControllerOptionsOutput {
  const {
    enableCollisionDetection,
    minimumZoomDistance,
    maximumZoomDistance,
    enableTilt,
    enableRotate,
    enableTranslate,
    enableZoom,
    enableLook,
  } = params;
  const ctrl = viewer.scene.screenSpaceCameraController;

  if (enableCollisionDetection !== undefined) ctrl.enableCollisionDetection = enableCollisionDetection;
  if (minimumZoomDistance !== undefined) ctrl.minimumZoomDistance = minimumZoomDistance;
  if (maximumZoomDistance !== undefined) ctrl.maximumZoomDistance = maximumZoomDistance;
  if (enableTilt !== undefined) ctrl.enableTilt = enableTilt;
  if (enableRotate !== undefined) ctrl.enableRotate = enableRotate;
  if (enableTranslate !== undefined) ctrl.enableTranslate = enableTranslate;
  if (enableZoom !== undefined) ctrl.enableZoom = enableZoom;
  if (enableLook !== undefined) ctrl.enableLook = enableLook;

  return {
    success: true,
    settings: {
      enableCollisionDetection: ctrl.enableCollisionDetection,
      minimumZoomDistance: ctrl.minimumZoomDistance,
      maximumZoomDistance: ctrl.maximumZoomDistance,
      enableTilt: ctrl.enableTilt,
      enableRotate: ctrl.enableRotate,
      enableTranslate: ctrl.enableTranslate,
      enableZoom: ctrl.enableZoom,
      enableLook: ctrl.enableLook,
    },
  };
}

export async function zoomTo(
  viewer: Viewer,
  params: {
    name: string;
    pitch?: number;
    heading?: number;
    zoomOutFactor?: number;
    minRange?: number;
  },
): Promise<ZoomToOutput> {
  const {
    name,
    pitch = -45,
    heading = 0,
    zoomOutFactor = 2.5,
    minRange = 1200,
  } = params;

  const entity = viewer.entities.getById(name) ??
    viewer.entities.values.find((e) => e.name === name);

  if (!entity) {
    return { success: false, name, error: `No entity found with name "${name}"` };
  }

  await releaseCameraConstraints(viewer);
  const Cesium = await cesium();

  try {
    await viewer.zoomTo(
      entity,
      new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(heading),
        Cesium.Math.toRadians(pitch),
        0,
      ),
    );

    const currentHeight = viewer.camera.positionCartographic.height;
    const targetHeight = Math.max(currentHeight * zoomOutFactor, minRange);
    const zoomOutDelta = targetHeight - currentHeight;
    if (zoomOutDelta > 0) {
      viewer.camera.zoomOut(zoomOutDelta);
    }

    // requestRenderMode suppresses idle redraws — kick one so the new
    // camera position is applied immediately.
    viewer.scene.requestRender();
    return { success: true, name };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, name, error: msg };
  }
}
