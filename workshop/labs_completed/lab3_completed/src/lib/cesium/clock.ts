"use client";

import * as Cesium from "cesium";
import type { Viewer } from "cesium";
import type {
  SetTimeOutput,
  ClockControlOutput,
  SetGlobeLightingOutput,
} from "@/lib/ai/tools/cesium/schemas/clock";

export async function setClockTime(
  viewer: Viewer,
  datetime: string,
): Promise<SetTimeOutput> {
  const julianDate = Cesium.JulianDate.fromIso8601(datetime);
  viewer.clock.currentTime = julianDate;
  viewer.clock.shouldAnimate = false;
  return { success: true, clockTime: julianDate.toString() };
}

export async function controlClock(
  viewer: Viewer,
  params: {
    action: string;
    currentTime?: string;
    multiplier?: number;
    shouldAnimate?: boolean;
    clockRange?: string;
    startTime?: string;
    stopTime?: string;
  },
): Promise<ClockControlOutput> {
  const { action, currentTime, multiplier, shouldAnimate, clockRange, startTime, stopTime } = params;
  const clock = viewer.clock;

  if (action === "pause") {
    clock.shouldAnimate = false;
  } else if (action === "resume") {
    clock.shouldAnimate = true;
    if (multiplier !== undefined) clock.multiplier = multiplier;
    // requestRenderMode:true suppresses idle renders; kick one so the clock
    // actually starts ticking immediately after resume.
    viewer.scene.requestRender();
  } else if (action === "setTime" && currentTime) {
    clock.currentTime = Cesium.JulianDate.fromIso8601(currentTime);
    // Do NOT touch shouldAnimate here — pause/resume actions own that state.
    // Forcing shouldAnimate=false causes a race condition when parallel tool
    // calls execute setTime concurrently with resume.
  } else if (action === "setMultiplier" && multiplier !== undefined) {
    clock.multiplier = multiplier;
  } else if (action === "configure") {
    if (currentTime) clock.currentTime = Cesium.JulianDate.fromIso8601(currentTime);
    if (startTime)   clock.startTime   = Cesium.JulianDate.fromIso8601(startTime);
    if (stopTime)    clock.stopTime    = Cesium.JulianDate.fromIso8601(stopTime);
    if (multiplier !== undefined)    clock.multiplier    = multiplier;
    if (shouldAnimate !== undefined) clock.shouldAnimate = shouldAnimate;
    if (clockRange !== undefined) {
      const rangeMap: Record<string, number> = {
        UNBOUNDED: Cesium.ClockRange.UNBOUNDED,
        CLAMPED:   Cesium.ClockRange.CLAMPED,
        LOOP_STOP: Cesium.ClockRange.LOOP_STOP,
      };
      clock.clockRange = rangeMap[clockRange] ?? Cesium.ClockRange.UNBOUNDED;
    }
  }

  return {
    success: true,
    clockTime: Cesium.JulianDate.toIso8601(clock.currentTime),
    multiplier: clock.multiplier,
    shouldAnimate: clock.shouldAnimate,
  };
}

export async function setGlobeLighting(
  viewer: Viewer,
  params: {
    enableLighting: boolean;
    enableDynamicAtmosphere?: boolean;
  },
): Promise<SetGlobeLightingOutput> {
  const { enableLighting, enableDynamicAtmosphere } = params;
  viewer.scene.globe.enableLighting = enableLighting;

  if (enableDynamicAtmosphere !== undefined) {
    viewer.scene.atmosphere.dynamicLighting = enableDynamicAtmosphere
      ? Cesium.DynamicAtmosphereLightingType.SUNLIGHT
      : Cesium.DynamicAtmosphereLightingType.NONE;
  }

  return { success: true, enableLighting };
}
