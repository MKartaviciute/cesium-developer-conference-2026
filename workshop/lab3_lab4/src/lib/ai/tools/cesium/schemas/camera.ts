import { z } from "zod";

// ---------------------------------------------------------------------------
// flyTo
// ---------------------------------------------------------------------------

export const flyToSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees (−90 … 90). Must be in range −90 to 90 — reject values outside this range."),
  longitude: z.number().min(-180).max(180).describe("Longitude in decimal degrees (−180 … 180). Must be in range −180 to 180 — reject values outside this range."),
  altitude: z
    .number()
    .optional()
    .describe("Camera altitude above the ellipsoid in metres (default 1 000)"),
  heading: z
    .number()
    .optional()
    .describe("Camera heading in degrees (0 = North, 90 = East; default 0)"),
  pitch: z
    .number()
    .optional()
    .describe(
      "Camera pitch in degrees (0 = horizontal, −90 = straight down; default −90)",
    ),
  duration: z
    .number()
    .optional()
    .describe("Flight duration in seconds (default 3). Use 6–10 for a gradual zoom-in effect."),
  name: z.string().optional().describe("Optional label used only in the return value for display — does NOT add an entity to the globe. Use addEntity separately if a marker is needed."),
});

export type FlyToInput = z.infer<typeof flyToSchema>;

export interface FlyToOutput {
  success: boolean;
  location: string;
}

// ---------------------------------------------------------------------------
// cameraSetView — instantly teleport the camera (no animation)
// ---------------------------------------------------------------------------

export const cameraSetViewSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees (−90 … 90). Must be in range −90 to 90."),
  longitude: z.number().min(-180).max(180).describe("Longitude in decimal degrees (−180 … 180). Must be in range −180 to 180."),
  altitude: z
    .number()
    .optional()
    .describe("Camera altitude above the ellipsoid in metres (default 1 000)"),
  heading: z
    .number()
    .optional()
    .describe("Camera heading in degrees (0 = North; default 0)"),
  pitch: z
    .number()
    .optional()
    .describe(
      "Camera pitch in degrees (0 = horizontal, −90 = straight down; default −90)",
    ),
  roll: z.number().optional().describe("Camera roll in degrees (default 0)"),
});

export type CameraSetViewInput = z.infer<typeof cameraSetViewSchema>;

export interface CameraSetViewOutput {
  success: boolean;
  location: string;
}

// ---------------------------------------------------------------------------
// cameraLookAt — lock the camera to look at a fixed point
// ---------------------------------------------------------------------------

export const cameraLookAtSchema = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .describe("Target latitude in decimal degrees (−90 … 90). Must be in range −90 to 90."),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Target longitude in decimal degrees (−180 … 180). Must be in range −180 to 180."),
  altitude: z
    .number()
    .optional()
    .describe("Target altitude in metres above ellipsoid (default 0)"),
  range: z
    .number()
    .optional()
    .describe("Distance from the target in metres (default 1 000)"),
  pitch: z
    .number()
    .optional()
    .describe("Camera pitch in degrees: 0 = horizontal/eye-level, −45 = looking diagonally down, −90 = straight down (nadir). Default −45"),
  heading: z
    .number()
    .optional()
    .describe("Camera heading offset in degrees (default 0)"),
});

export type CameraLookAtInput = z.infer<typeof cameraLookAtSchema>;

export interface CameraLookAtOutput {
  success: boolean;
  target: string;
  range: number;
}

// ---------------------------------------------------------------------------
// cameraStartOrbit — continuously orbit around the current look-at point
// ---------------------------------------------------------------------------

export const cameraStartOrbitSchema = z.object({
  speed: z
    .number()
    .optional()
    .describe("Orbit speed in degrees per second (default 10)"),
  direction: z
    .enum(["clockwise", "counterclockwise"])
    .optional()
    .describe("Orbit direction viewed from above (default 'clockwise')"),
});

export type CameraStartOrbitInput = z.infer<typeof cameraStartOrbitSchema>;

export interface CameraStartOrbitOutput {
  success: boolean;
  speed: number;
  direction: string;
}

// ---------------------------------------------------------------------------
// cameraStopOrbit — stop a running orbit
// ---------------------------------------------------------------------------

export const cameraStopOrbitSchema = z.object({});

export type CameraStopOrbitInput = z.infer<typeof cameraStopOrbitSchema>;

export interface CameraStopOrbitOutput {
  success: boolean;
  wasOrbiting: boolean;
}

// ---------------------------------------------------------------------------
// cameraGetPosition — query current camera position and orientation
// ---------------------------------------------------------------------------

export const cameraGetPositionSchema = z.object({});

export type CameraGetPositionInput = z.infer<typeof cameraGetPositionSchema>;

export interface CameraGetPositionOutput {
  success: boolean;
  position: { latitude: number; longitude: number; altitude: number };
  orientation: { heading: number; pitch: number; roll: number };
  viewRectangle: {
    west: number;
    south: number;
    east: number;
    north: number;
  } | null;
}

// ---------------------------------------------------------------------------
// cameraSetControllerOptions — configure camera movement constraints
// ---------------------------------------------------------------------------

export const cameraSetControllerOptionsSchema = z.object({
  enableCollisionDetection: z
    .boolean()
    .optional()
    .describe("Detect collisions with terrain (default true)"),
  minimumZoomDistance: z
    .number()
    .optional()
    .describe("Minimum camera distance from the surface in metres"),
  maximumZoomDistance: z
    .number()
    .optional()
    .describe("Maximum camera distance from the surface in metres"),
  enableTilt: z
    .boolean()
    .optional()
    .describe("Allow camera tilt with right-mouse drag (default true)"),
  enableRotate: z
    .boolean()
    .optional()
    .describe("Allow camera rotation with left-mouse drag (default true)"),
  enableTranslate: z
    .boolean()
    .optional()
    .describe("Allow camera translation with mouse drag (default true)"),
  enableZoom: z
    .boolean()
    .optional()
    .describe("Allow camera zoom with scroll wheel (default true)"),
  enableLook: z
    .boolean()
    .optional()
    .describe("Allow camera look with right-mouse drag in 2D (default true)"),
});

export type CameraSetControllerOptionsInput = z.infer<
  typeof cameraSetControllerOptionsSchema
>;

export interface CameraSetControllerOptionsOutput {
  success: boolean;
  settings: {
    enableCollisionDetection: boolean;
    minimumZoomDistance: number;
    maximumZoomDistance: number;
    enableTilt: boolean;
    enableRotate: boolean;
    enableTranslate: boolean;
    enableZoom: boolean;
    enableLook: boolean;
  } | null;
}

// ---------------------------------------------------------------------------
// zoomTo — fit the camera to a named entity's bounding sphere
// ---------------------------------------------------------------------------

export const zoomToSchema = z.object({
  name: z
    .string()
    .describe("Display name of the entity to zoom to (must match the name used when the entity was created)"),
  pitch: z
    .number()
    .optional()
    .describe("Camera pitch in degrees: 0 = horizontal, −45 = diagonal (default), −90 = straight down (nadir)"),
  heading: z
    .number()
    .optional()
    .describe("Camera heading offset in degrees (default 0 = north)"),
  zoomOutFactor: z
    .number()
    .min(1)
    .optional()
    .describe("Multiplier applied to the computed bounding-sphere radius to keep extra context around the entity (default 2.5)"),
  minRange: z
    .number()
    .min(0)
    .optional()
    .describe("Minimum camera range in metres when framing small entities (default 1200)"),
});

export type ZoomToInput = z.infer<typeof zoomToSchema>;

export interface ZoomToOutput {
  success: boolean;
  name: string;
  error?: string;
}
