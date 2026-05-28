import { z } from "zod";

// ---------------------------------------------------------------------------
// animationCreate — create an entity animated along position samples
// ---------------------------------------------------------------------------

export const animationPositionSampleSchema = z.object({
  time: z.string().describe("ISO 8601 timestamp for this sample"),
  longitude: z.number().describe("Longitude in decimal degrees"),
  latitude: z.number().describe("Latitude in decimal degrees"),
  height: z
    .number()
    .optional()
    .describe("Height above ellipsoid in metres (default 0)"),
});

export const animationCreateSchema = z.object({
  positionSamples: z
    .array(animationPositionSampleSchema)
    .min(2)
    .describe("Ordered array of timed position samples (min 2)"),
  name: z.string().optional().describe("Human-readable animation name"),
  startTime: z
    .string()
    .optional()
    .describe(
      "ISO 8601 clock start time (defaults to first sample time)",
    ),
  stopTime: z
    .string()
    .optional()
    .describe(
      "ISO 8601 clock stop time (defaults to last sample time)",
    ),
  interpolationAlgorithm: z
    .enum(["LINEAR", "LAGRANGE", "HERMITE"])
    .optional()
    .describe("Position smoothing algorithm (default 'LAGRANGE')"),
  modelUri: z
    .string()
    .optional()
    .describe(
      "glTF / GLB model URL to represent the entity (uses a point marker if omitted)",
    ),
  modelScale: z
    .number()
    .optional()
    .describe("Uniform scale for the model (default 1.0)"),
  showPath: z
    .boolean()
    .optional()
    .describe("Show the path trail (default true)"),
  loopMode: z
    .enum(["none", "loop"])
    .optional()
    .describe("Playback loop behaviour (default 'none')"),
  clampToGround: z
    .boolean()
    .optional()
    .describe("Clamp entity to terrain surface (default false)"),
  speedMultiplier: z
    .number()
    .optional()
    .describe("Scene clock speed multiplier (default 10)"),
  autoPlay: z
    .boolean()
    .optional()
    .describe("Start playback immediately after creation (default true)"),
  trackCamera: z
    .boolean()
    .optional()
    .describe("Lock the camera to follow the entity (default false)"),
});

export type AnimationCreateInput = z.infer<typeof animationCreateSchema>;

export interface AnimationCreateOutput {
  success: boolean;
  animationId: string;
  startTime: string;
  stopTime: string;
  modelPreset: string;
}

// ---------------------------------------------------------------------------
// animationControl — play or pause an animation
// ---------------------------------------------------------------------------

export const animationControlSchema = z.object({
  animationId: z.string().describe("Animation ID returned by animationCreate"),
  action: z
    .enum(["play", "pause"])
    .describe("'play' to start/resume, 'pause' to pause"),
});

export type AnimationControlInput = z.infer<typeof animationControlSchema>;

export interface AnimationControlOutput {
  success: boolean;
  animationId: string;
  action: string;
}

// ---------------------------------------------------------------------------
// animationRemove — remove an animation and its entity
// ---------------------------------------------------------------------------

export const animationRemoveSchema = z.object({
  animationId: z.string().optional().describe("Animation ID to remove (from animationCreate or animationListActive)"),
  name: z.string().optional().describe("Animation name to remove (first match)"),
}).refine((v) => v.animationId !== undefined || v.name !== undefined, {
  message: "Provide animationId or name",
});

export type AnimationRemoveInput = z.infer<typeof animationRemoveSchema>;

export interface AnimationRemoveOutput {
  success: boolean;
  animationId: string;
}

// ---------------------------------------------------------------------------
// animationListActive — list all active animations
// ---------------------------------------------------------------------------

export const animationListActiveSchema = z.object({});

export type AnimationListActiveInput = z.infer<typeof animationListActiveSchema>;

export interface ActiveAnimationEntry {
  animationId: string;
  name: string;
  startTime: string;
  stopTime: string;
  modelPreset: string;
  isAnimating: boolean;
  clockMultiplier: number;
}

export interface AnimationListActiveOutput {
  success: boolean;
  animations: ActiveAnimationEntry[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// animationUpdatePath — update path trail appearance
// ---------------------------------------------------------------------------

export const animationUpdatePathSchema = z
  .object({
    animationId: z.string().describe("Animation ID to update"),
    appendPositionSamples: z
      .array(animationPositionSampleSchema)
      .min(1)
      .optional()
      .describe("Timed waypoints to append to the current animation path"),
    replacePositionSamples: z
      .array(animationPositionSampleSchema)
      .min(2)
      .optional()
      .describe("Replace the animation path with a new full timed sample set"),
    leadTime: z
      .number()
      .optional()
      .describe("Seconds of path trail to show ahead of entity"),
    trailTime: z
      .number()
      .optional()
      .describe("Seconds of path trail to show behind entity"),
    width: z.number().optional().describe("Trail line width in pixels"),
    color: z.string().optional().describe("CSS colour for the trail"),
  })
  .refine(
    (v) => !(v.appendPositionSamples && v.replacePositionSamples),
    {
      message: "Use either appendPositionSamples or replacePositionSamples, not both",
    },
  );

export type AnimationUpdatePathInput = z.infer<typeof animationUpdatePathSchema>;

export interface AnimationUpdatePathOutput {
  success: boolean;
  animationId: string;
  sampleCount?: number;
  startTime?: string;
  stopTime?: string;
}

// ---------------------------------------------------------------------------
// animationCameraTracking — follow an animated entity or release
// ---------------------------------------------------------------------------

export const animationCameraTrackingSchema = z.object({
  track: z
    .boolean()
    .describe("true to start tracking, false to stop and return camera control"),
  animationId: z
    .string()
    .optional()
    .describe(
      "Animation ID to track (optional; if omitted while track=true, the most recently created active animation is tracked)",
    ),
  range: z
    .number()
    .optional()
    .describe("Distance from entity in metres (default 1000)"),
  pitch: z
    .number()
    .optional()
    .describe("Camera pitch offset in degrees (default −45)"),
  heading: z
    .number()
    .optional()
    .describe("Camera heading offset in degrees (default 0)"),
});

export type AnimationCameraTrackingInput = z.infer<
  typeof animationCameraTrackingSchema
>;

export interface AnimationCameraTrackingOutput {
  success: boolean;
  isTracking: boolean;
  trackedAnimationId?: string;
}
