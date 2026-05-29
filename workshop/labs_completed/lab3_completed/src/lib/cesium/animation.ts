"use client";

import * as Cesium from "cesium";
import type { Viewer, Entity } from "cesium";
import { orbitListeners } from "./camera";
import type {
  AnimationCreateOutput,
  AnimationControlOutput,
  AnimationRemoveOutput,
  AnimationListActiveOutput,
  AnimationUpdatePathOutput,
  AnimationCameraTrackingOutput,
} from "@/lib/ai/tools/cesium/schemas/animation";

// ---------------------------------------------------------------------------
// Per-viewer animation registry
// ---------------------------------------------------------------------------

export interface AnimationEntry {
  entity: Entity;
  name: string;
  startTime: string;
  stopTime: string;
  modelPreset: string;
  positionSamples: PositionSample[];
  interpolationAlgorithm: string;
}

// WeakMap allows the Viewer to be GC-collected after unmount.
const animationRegistry = new WeakMap<Viewer, Map<string, AnimationEntry>>();

export function getAnimationMap(viewer: Viewer): Map<string, AnimationEntry> {
  if (!animationRegistry.has(viewer)) {
    animationRegistry.set(viewer, new Map());
  }
  return animationRegistry.get(viewer)!;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PositionSample = { time: string; longitude: number; latitude: number; height?: number };

export async function createAnimation(
  viewer: Viewer,
  params: {
    positionSamples: PositionSample[];
    name?: string;
    startTime?: string;
    stopTime?: string;
    interpolationAlgorithm?: string;
    modelUri?: string;
    modelScale?: number;
    showPath?: boolean;
    loopMode?: string;
    speedMultiplier?: number;
    autoPlay?: boolean;
    trackCamera?: boolean;
  },
): Promise<AnimationCreateOutput> {
  const {
    positionSamples,
    name,
    startTime,
    stopTime,
    interpolationAlgorithm = "LAGRANGE",
    modelUri,
    modelScale = 1.0,
    showPath = true,
    loopMode = "none",
    speedMultiplier = 10,
    autoPlay = true,
    trackCamera = false,
  } = params;

  const property = new Cesium.SampledPositionProperty();

  const interpMap: Record<
    string,
    | typeof Cesium.LinearApproximation
    | typeof Cesium.LagrangePolynomialApproximation
    | typeof Cesium.HermitePolynomialApproximation
  > = {
    LINEAR: Cesium.LinearApproximation,
    LAGRANGE: Cesium.LagrangePolynomialApproximation,
    HERMITE: Cesium.HermitePolynomialApproximation,
  };

  property.setInterpolationOptions({
    interpolationAlgorithm:
      interpMap[interpolationAlgorithm] ?? Cesium.LagrangePolynomialApproximation,
    interpolationDegree: 2,
  });

  for (const sample of positionSamples) {
    const t = Cesium.JulianDate.fromIso8601(sample.time);
    const pos = Cesium.Cartesian3.fromDegrees(sample.longitude, sample.latitude, sample.height ?? 0);
    property.addSample(t, pos);
  }

  const clockStart = startTime
    ? Cesium.JulianDate.fromIso8601(startTime)
    : Cesium.JulianDate.fromIso8601(positionSamples[0].time);
  const clockStop = stopTime
    ? Cesium.JulianDate.fromIso8601(stopTime)
    : Cesium.JulianDate.fromIso8601(positionSamples[positionSamples.length - 1].time);

  const startIso = Cesium.JulianDate.toIso8601(clockStart);
  const stopIso = Cesium.JulianDate.toIso8601(clockStop);

  viewer.clock.startTime = clockStart.clone();
  viewer.clock.stopTime = clockStop.clone();
  viewer.clock.currentTime = clockStart.clone();
  viewer.clock.multiplier = speedMultiplier;
  viewer.clock.clockRange =
    loopMode === "loop" ? Cesium.ClockRange.LOOP_STOP : Cesium.ClockRange.CLAMPED;

  const animationId = `anim_${crypto.randomUUID()}`;
  const entityOptions: Parameters<typeof viewer.entities.add>[0] = {
    id: animationId,
    name: name ?? animationId,
    position: property,
    orientation: new Cesium.VelocityOrientationProperty(property),
  };

  if (showPath) {
    entityOptions.path = {
      show: true,
      leadTime: 60,
      trailTime: 60,
      width: 3,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        color: Cesium.Color.YELLOW,
      }),
    };
  }

  if (modelUri) {
    entityOptions.model = { uri: modelUri, scale: modelScale, minimumPixelSize: 64 };
  } else {
    entityOptions.point = {
      pixelSize: 10,
      color: Cesium.Color.YELLOW,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    };
  }

  const entity = viewer.entities.add(entityOptions);

  getAnimationMap(viewer).set(animationId, {
    entity,
    name: name ?? animationId,
    startTime: startIso,
    stopTime: stopIso,
    modelPreset: modelUri ? "custom" : "point",
    positionSamples: [...positionSamples],
    interpolationAlgorithm,
  });

  if (trackCamera) {
    viewer.trackedEntity = entity;
  }

  viewer.clock.shouldAnimate = autoPlay;

  return {
    success: true,
    animationId,
    startTime: startIso,
    stopTime: stopIso,
    modelPreset: modelUri ? "custom" : "point",
  };
}

export function controlAnimation(
  viewer: Viewer,
  params: { animationId: string; action: string },
): AnimationControlOutput {
  const { animationId, action } = params;
  const entry = getAnimationMap(viewer).get(animationId);
  if (!entry) return { success: false, animationId, action };

  viewer.clock.shouldAnimate = action === "play";
  return { success: true, animationId, action };
}

export function removeAnimation(
  viewer: Viewer,
  params: { animationId?: string; name?: string },
): AnimationRemoveOutput {
  const { animationId, name } = params;
  const animMap = getAnimationMap(viewer);

  let resolvedId = animationId;
  if (!resolvedId && name) {
    // Find animation by name (case-insensitive)
    for (const [id, entry] of animMap.entries()) {
      if (entry.name.toLowerCase() === name.toLowerCase()) {
        resolvedId = id;
        break;
      }
    }
  }

  // If not found in registry, fall back to searching viewer.entities by name
  // (handles the case where the animation registry was cleared, e.g. by HMR)
  if (!resolvedId || !animMap.has(resolvedId)) {
    const searchName = name ?? (resolvedId ? undefined : animationId);
    if (searchName) {
      const entities = viewer.entities.values;
      for (let i = 0; i < entities.length; i++) {
        const e = entities[i];
        if (e.name && e.name.toLowerCase() === searchName.toLowerCase()) {
          if (viewer.trackedEntity === e) viewer.trackedEntity = undefined;
          viewer.entities.remove(e);
          return { success: true, animationId: resolvedId ?? searchName };
        }
      }
    }
    if (!resolvedId) return { success: false, animationId: animationId ?? name ?? "" };
  }

  const entry = animMap.get(resolvedId!);
  if (!entry) return { success: false, animationId: resolvedId! };

  viewer.entities.remove(entry.entity);

  if (viewer.trackedEntity === entry.entity) {
    viewer.trackedEntity = undefined;
  }

  animMap.delete(resolvedId!);
  return { success: true, animationId: resolvedId! };
}

export function listActiveAnimations(viewer: Viewer): AnimationListActiveOutput {
  const animations = [];
  for (const [animationId, entry] of getAnimationMap(viewer).entries()) {
    animations.push({
      animationId,
      name: entry.name,
      startTime: entry.startTime,
      stopTime: entry.stopTime,
      modelPreset: entry.modelPreset,
      isAnimating: viewer.clock.shouldAnimate,
      clockMultiplier: viewer.clock.multiplier,
    });
  }
  return { success: true, animations, totalCount: animations.length };
}

export async function updateAnimationPath(
  viewer: Viewer,
  params: {
    animationId: string;
    appendPositionSamples?: PositionSample[];
    replacePositionSamples?: PositionSample[];
    leadTime?: number;
    trailTime?: number;
    width?: number;
    color?: string;
  },
): Promise<AnimationUpdatePathOutput> {
  const {
    animationId,
    appendPositionSamples,
    replacePositionSamples,
    leadTime,
    trailTime,
    width,
    color,
  } = params;
  const entry = getAnimationMap(viewer).get(animationId);
  if (!entry) return { success: false, animationId };

  if (replacePositionSamples || appendPositionSamples) {
    const nextSamples = replacePositionSamples
      ? [...replacePositionSamples]
      : [...entry.positionSamples, ...(appendPositionSamples ?? [])];

    if (nextSamples.length < 2) return { success: false, animationId };

    nextSamples.sort((a, b) => {
      const at = Cesium.JulianDate.fromIso8601(a.time);
      const bt = Cesium.JulianDate.fromIso8601(b.time);
      return Cesium.JulianDate.compare(at, bt);
    });

    const property = new Cesium.SampledPositionProperty();
    const interpMap: Record<
      string,
      | typeof Cesium.LinearApproximation
      | typeof Cesium.LagrangePolynomialApproximation
      | typeof Cesium.HermitePolynomialApproximation
    > = {
      LINEAR: Cesium.LinearApproximation,
      LAGRANGE: Cesium.LagrangePolynomialApproximation,
      HERMITE: Cesium.HermitePolynomialApproximation,
    };

    property.setInterpolationOptions({
      interpolationAlgorithm:
        interpMap[entry.interpolationAlgorithm] ?? Cesium.LagrangePolynomialApproximation,
      interpolationDegree: 2,
    });

    for (const sample of nextSamples) {
      const t = Cesium.JulianDate.fromIso8601(sample.time);
      const pos = Cesium.Cartesian3.fromDegrees(sample.longitude, sample.latitude, sample.height ?? 0);
      property.addSample(t, pos);
    }

    entry.entity.position = property;
    entry.entity.orientation = new Cesium.VelocityOrientationProperty(property);
    entry.positionSamples = nextSamples;

    const start = Cesium.JulianDate.fromIso8601(nextSamples[0].time);
    const stop = Cesium.JulianDate.fromIso8601(nextSamples[nextSamples.length - 1].time);
    entry.startTime = Cesium.JulianDate.toIso8601(start);
    entry.stopTime = Cesium.JulianDate.toIso8601(stop);
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();

    if (Cesium.JulianDate.lessThan(viewer.clock.currentTime, start)) {
      viewer.clock.currentTime = start.clone();
    } else if (Cesium.JulianDate.greaterThan(viewer.clock.currentTime, stop)) {
      viewer.clock.currentTime = stop.clone();
    }
  }

  const path = entry.entity.path;
  if (!path) {
    return {
      success: true,
      animationId,
      sampleCount: entry.positionSamples.length,
      startTime: entry.startTime,
      stopTime: entry.stopTime,
    };
  }

  if (leadTime !== undefined) path.leadTime = new Cesium.ConstantProperty(leadTime);
  if (trailTime !== undefined) path.trailTime = new Cesium.ConstantProperty(trailTime);
  if (width !== undefined) path.width = new Cesium.ConstantProperty(width);
  if (color)
    path.material = new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString(color));

  return {
    success: true,
    animationId,
    sampleCount: entry.positionSamples.length,
    startTime: entry.startTime,
    stopTime: entry.stopTime,
  };
}

export function setCameraTracking(
  viewer: Viewer,
  params: {
    track: boolean;
    animationId?: string;
    range?: number;
    pitch?: number;
    heading?: number;
  },
): AnimationCameraTrackingOutput {
  const { track, animationId, range = 1000, pitch = -45, heading = 0 } = params;

  // Tracking must own the camera; stop orbit/camera flight and clear lookAt
  // transform so Cesium can lock the camera to the tracked entity.
  orbitListeners.get(viewer)?.();
  orbitListeners.delete(viewer);
  viewer.camera.cancelFlight();

  if (!track) {
    viewer.trackedEntity = undefined;
    viewer.scene.requestRender();
    return { success: true, isTracking: false };
  }

  const animMap = getAnimationMap(viewer);
  const resolvedAnimationId = animationId ?? Array.from(animMap.keys()).at(-1);
  if (!resolvedAnimationId) return { success: false, isTracking: false };

  const entry = animMap.get(resolvedAnimationId);
  if (!entry) return { success: false, isTracking: false };

  if (!Cesium.Matrix4.equals(viewer.camera.transform, Cesium.Matrix4.IDENTITY)) {
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }

  // viewFrom controls the default follow offset used by trackedEntity.
  entry.entity.viewFrom = new Cesium.ConstantPositionProperty(
    new Cesium.Cartesian3(
      -range * Math.cos(Cesium.Math.toRadians(pitch)) * Math.cos(Cesium.Math.toRadians(heading)),
      range * Math.cos(Cesium.Math.toRadians(pitch)) * Math.sin(Cesium.Math.toRadians(heading)),
      range * Math.sin(-Cesium.Math.toRadians(pitch)),
    ),
  );

  viewer.trackedEntity = entry.entity;
  viewer.scene.requestRender();
  return { success: true, isTracking: true, trackedAnimationId: resolvedAnimationId };
}
