import { z } from "zod";

// ---------------------------------------------------------------------------
// setTime
// ---------------------------------------------------------------------------

export const setTimeSchema = z.object({
  datetime: z
    .string()
    .describe("ISO 8601 datetime string (e.g. '2025-06-21T12:00:00Z')"),
});

export type SetTimeInput = z.infer<typeof setTimeSchema>;

export interface SetTimeOutput {
  success: boolean;
  clockTime: string;
}

// ---------------------------------------------------------------------------
// getViewerState
// ---------------------------------------------------------------------------

export const getViewerStateSchema = z.object({});

export type GetViewerStateInput = z.infer<typeof getViewerStateSchema>;

export interface GetViewerStateOutput {
  camera: {
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    pitch: number;
    roll: number;
  };
  entities: Array<{
    id: string;
    name: string | undefined;
    position?: { latitude: number; longitude: number; altitude: number };
  }>;
  dataSources: Array<{
    name: string;
    show: boolean;
    entityCount: number;
  }>;
  clockTime: string;
}

// ---------------------------------------------------------------------------
// clockControl — advanced scene clock configuration
// ---------------------------------------------------------------------------

export const clockControlSchema = z.object({
  action: z
    .enum(["configure", "setTime", "setMultiplier", "pause", "resume"])
    .describe(
      "'configure' sets multiple clock properties at once; 'setTime' moves the clock to a specific instant; 'setMultiplier' adjusts playback speed; 'pause' stops the clock; 'resume' starts the clock",
    ),
  currentTime: z
    .string()
    .optional()
    .describe(
      "ISO 8601 datetime to set as the current clock time (used with 'setTime' or 'configure')",
    ),
  multiplier: z
    .number()
    .optional()
    .describe(
      "Clock speed multiplier (1 = real-time, 60 = 1 min/sec; used with 'setMultiplier' or 'configure')",
    ),
  shouldAnimate: z
    .boolean()
    .optional()
    .describe("Whether the clock auto-advances (used with 'configure')"),
  clockRange: z
    .enum(["UNBOUNDED", "CLAMPED", "LOOP_STOP"])
    .optional()
    .describe(
      "Clock range behaviour — UNBOUNDED (default), CLAMPED (stops at limits), LOOP_STOP (loops; used with 'configure')",
    ),
  startTime: z
    .string()
    .optional()
    .describe(
      "ISO 8601 start time for the simulation window (used with 'configure')",
    ),
  stopTime: z
    .string()
    .optional()
    .describe(
      "ISO 8601 stop time for the simulation window (used with 'configure')",
    ),
});

export type ClockControlInput = z.infer<typeof clockControlSchema>;

export interface ClockControlOutput {
  success: boolean;
  clockTime: string;
  multiplier: number;
  shouldAnimate: boolean;
}

// ---------------------------------------------------------------------------
// setGlobeLighting — enable / disable dynamic sun lighting
// ---------------------------------------------------------------------------

export const setGlobeLightingSchema = z.object({
  enableLighting: z
    .boolean()
    .describe(
      "Enable or disable dynamic globe lighting based on sun position (creates day/night effect)",
    ),
  enableDynamicAtmosphere: z
    .boolean()
    .optional()
    .describe(
      "Enable atmospheric scattering effects (default: unchanged from current state)",
    ),
});

export type SetGlobeLightingInput = z.infer<typeof setGlobeLightingSchema>;

export interface SetGlobeLightingOutput {
  success: boolean;
  enableLighting: boolean;
}
