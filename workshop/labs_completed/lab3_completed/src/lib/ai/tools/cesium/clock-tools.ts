"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import { getViewerState } from "@/lib/cesium/viewer-state";
import { setClockTime, controlClock, setGlobeLighting } from "@/lib/cesium/clock";
import {
  setTimeSchema,
  getViewerStateSchema,
  clockControlSchema,
  setGlobeLightingSchema,
  type SetTimeOutput,
  type GetViewerStateOutput,
  type ClockControlOutput,
  type SetGlobeLightingOutput,
} from "./schemas/clock";

export function createClockTools(viewerRef: RefObject<Viewer | null>) {
  return {
    setTime: tool({
      description:
        "Jump the scene clock to a specific date and time (ISO 8601 format). " +
        "Use for simple point-in-time requests like 'set the time to', 'change the date to', 'go to [date]', 'simulate [historical event date]'. " +
        "Prefer clockControl when playback speed, loop mode, or time window also need to change.",
      inputSchema: setTimeSchema,
      execute: async ({ datetime }): Promise<SetTimeOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, clockTime: datetime };
        return setClockTime(viewer, datetime);
      },
    }),

    getViewerState: tool({
      description:
        "Get a full snapshot of the CesiumJS viewer: camera position, all visible entities, loaded data sources, imagery layers, and scene clock time. " +
        "Call this proactively before broad operations ('what's on the globe?', 'show me everything', 'clear the scene') " +
        "or when you need to know what is already loaded before making changes.",
      inputSchema: getViewerStateSchema,
      execute: async (): Promise<GetViewerStateOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) {
          return {
            camera: { latitude: 0, longitude: 0, altitude: 0, heading: 0, pitch: 0, roll: 0 },
            entities: [],
            dataSources: [],
            clockTime: new Date().toISOString(),
          };
        }
        const state = getViewerState(viewer);
        return {
          camera: state.camera,
          entities: state.entities,
          dataSources: state.dataSources,
          clockTime: state.clockTime,
        };
      },
    }),

    clockControl: tool({
      description:
        "The preferred tool for all clock operations — use this over setTime for most requests. " +
        "Use action='setTime' to jump to a specific datetime ('set clock to', 'travel to [date]', 'simulate [event]'). " +
        "Use action='setMultiplier' for playback speed ('speed up time', 'slow down', 'fast-forward', '10× speed'). " +
        "Use action='configure' to set multiple properties at once (time window, loop mode, animation on/off).",
      inputSchema: clockControlSchema,
      execute: async (params): Promise<ClockControlOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) {
          return {
            success: false,
            clockTime: new Date().toISOString(),
            multiplier: 1,
            shouldAnimate: false,
          };
        }
        return controlClock(viewer, params);
      },
    }),

    setGlobeLighting: tool({
      description:
        "Enable or disable dynamic globe lighting based on the sun's position, creating realistic day/night effects. Optionally control atmospheric scattering.",
      inputSchema: setGlobeLightingSchema,
      execute: async (params): Promise<SetGlobeLightingOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, enableLighting: params.enableLighting };
        return setGlobeLighting(viewer, params);
      },
    }),
  };
}
