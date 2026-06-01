import { z } from "zod";
import { isAllowedUrl, latLonAltSchema } from "./shared";

// ---------------------------------------------------------------------------
// addEntity
// ---------------------------------------------------------------------------

export const entityTypeSchema = z.enum(["point", "billboard", "label"]);
export type EntityType = z.infer<typeof entityTypeSchema>;

export const addEntitySchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees (−90 … 90)"),
  longitude: z.number().min(-180).max(180).describe("Longitude in decimal degrees (−180 … 180)"),
  altitude: z
    .number()
    .optional()
    .describe("Height above the ellipsoid in metres (default 0)"),
  name: z.string().describe("Human-readable name for the entity"),
  type: entityTypeSchema
    .optional()
    .describe("Visual representation type: 'point' = colored dot (default), 'billboard' = icon/image, 'label' = floating text only"),
  description: z.string().optional().describe("Optional description text"),
  color: z
    .string()
    .optional()
    .describe("CSS colour string for the marker (e.g. '#ff0000' or 'red')"),
});

export type AddEntityInput = z.infer<typeof addEntitySchema>;

export interface AddEntityOutput {
  success: boolean;
  entityId: string;
  name: string;
  /** Coordinates of the placed entity — use these to call flyTo */
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// removeEntity
// ---------------------------------------------------------------------------

export const removeEntitySchema = z
  .object({
    id: z.string().optional().describe("Stable entity ID to remove"),
    name: z.string().optional().describe("Entity name to remove (first match)"),
  })
  .refine((v) => v.id !== undefined || v.name !== undefined, {
    message: "Provide at least one of id or name",
  });

export type RemoveEntityInput = z.infer<typeof removeEntitySchema>;

export interface RemoveEntityOutput {
  success: boolean;
  removed: number;
}

// ---------------------------------------------------------------------------
// addPolygon — filled geographic polygon
// ---------------------------------------------------------------------------

export const addPolygonSchema = z.object({
  positions: z
    .array(latLonAltSchema)
    .min(3)
    .describe("Vertex positions of the polygon (minimum 3 points)"),
  extrudedHeight: z
    .number()
    .optional()
    .describe("Extrusion height in metres above the base for a 3D polygon"),
  material: z
    .string()
    .optional()
    .describe("CSS fill colour (default 'rgba(51,136,255,0.5)')"),
  outline: z.boolean().optional().describe("Show outline (default true)"),
  outlineColor: z
    .string()
    .optional()
    .describe("CSS outline colour (default 'white')"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddPolygonInput = z.infer<typeof addPolygonSchema>;

export interface AddPolygonOutput {
  success: boolean;
  entityId: string;
  vertexCount: number;
  /** Centroid of the polygon — use these to call flyTo */
  centroidLatitude: number;
  centroidLongitude: number;
}

// ---------------------------------------------------------------------------
// addPolyline — multi-segment line connecting positions
// ---------------------------------------------------------------------------

export const addPolylineSchema = z.object({
  positions: z
    .array(latLonAltSchema)
    .min(2)
    .describe("Ordered list of positions (minimum 2 points)"),
  width: z.number().optional().describe("Line width in pixels (default 2)"),
  material: z
    .string()
    .optional()
    .describe("CSS line colour (default 'white')"),
  clampToGround: z
    .boolean()
    .optional()
    .describe("Clamp the polyline to terrain surface (default false)"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddPolylineInput = z.infer<typeof addPolylineSchema>;

export interface AddPolylineOutput {
  success: boolean;
  entityId: string;
  pointCount: number;
  /** Midpoint of the polyline — use these to call flyTo */
  centroidLatitude: number;
  centroidLongitude: number;
}

// ---------------------------------------------------------------------------
// addRectangle — axis-aligned geographic rectangle
// ---------------------------------------------------------------------------

export const addRectangleSchema = z.object({
  west: z.number().min(-180).max(180).describe("Western boundary in decimal degrees (−180 … 180)"),
  south: z.number().min(-90).max(90).describe("Southern boundary in decimal degrees (−90 … 90)"),
  east: z.number().min(-180).max(180).describe("Eastern boundary in decimal degrees (−180 … 180)"),
  north: z.number().min(-90).max(90).describe("Northern boundary in decimal degrees (−90 … 90)"),
  height: z
    .number()
    .optional()
    .describe("Rectangle height above ground in metres (default 0)"),
  extrudedHeight: z
    .number()
    .optional()
    .describe("Extrusion height for a 3D rectangle in metres"),
  material: z
    .string()
    .optional()
    .describe("CSS fill colour (default 'rgba(51,136,255,0.5)')"),
  outline: z.boolean().optional().describe("Show outline (default true)"),
  outlineColor: z
    .string()
    .optional()
    .describe("CSS outline colour (default 'white')"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddRectangleInput = z.infer<typeof addRectangleSchema>;

export interface AddRectangleOutput {
  success: boolean;
  entityId: string;
  name: string | undefined;
  /** Centre of the rectangle — use these to call flyTo */
  centroidLatitude: number;
  centroidLongitude: number;
}

// ---------------------------------------------------------------------------
// addBox — 3D box entity (buildings, containers, volumetric markers)
// ---------------------------------------------------------------------------

export const addBoxSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Center latitude in decimal degrees (−90 … 90)"),
  longitude: z.number().min(-180).max(180).describe("Center longitude in decimal degrees (−180 … 180)"),
  altitude: z
    .number()
    .optional()
    .describe("Center altitude in metres above ellipsoid (default 0)"),
  width: z.number().describe("Box width (east-west extent) in metres"),
  length: z.number().describe("Box length (north-south extent) in metres"),
  height: z.number().describe("Box height in metres"),
  heading: z
    .number()
    .optional()
    .describe("Rotation heading in degrees (default 0)"),
  material: z
    .string()
    .optional()
    .describe("CSS fill colour (default 'rgba(0,128,255,0.7)')"),
  outline: z.boolean().optional().describe("Show outline (default true)"),
  outlineColor: z
    .string()
    .optional()
    .describe("CSS outline colour (default 'white')"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddBoxInput = z.infer<typeof addBoxSchema>;

export interface AddBoxOutput {
  success: boolean;
  entityId: string;
  name: string | undefined;
  /** Coordinates of the placed box — use these to call flyTo */
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// addCylinder — cylinder or cone entity (towers, pillars, coverage areas)
// ---------------------------------------------------------------------------

export const addCylinderSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Center latitude in decimal degrees (−90 … 90)"),
  longitude: z.number().min(-180).max(180).describe("Center longitude in decimal degrees (−180 … 180)"),
  altitude: z
    .number()
    .optional()
    .describe(
      "Altitude of the cylinder center in metres above ellipsoid (default 0)",
    ),
  length: z.number().describe("Cylinder height in metres"),
  topRadius: z
    .number()
    .describe("Top radius in metres (set to 0 to create a cone)"),
  bottomRadius: z.number().describe("Bottom radius in metres"),
  material: z
    .string()
    .optional()
    .describe("CSS fill colour (default 'rgba(0,128,255,0.7)')"),
  outline: z.boolean().optional().describe("Show outline (default true)"),
  outlineColor: z
    .string()
    .optional()
    .describe("CSS outline colour (default 'white')"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddCylinderInput = z.infer<typeof addCylinderSchema>;

export interface AddCylinderOutput {
  success: boolean;
  entityId: string;
  name: string | undefined;
  /** Coordinates of the placed cylinder — use these to call flyTo */
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// addModel — glTF / GLB 3D model entity
// ---------------------------------------------------------------------------

export const addModelSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees (−90 … 90)"),
  longitude: z.number().min(-180).max(180).describe("Longitude in decimal degrees (−180 … 180)"),
  altitude: z
    .number()
    .optional()
    .describe("Height above ellipsoid in metres (default 0)"),
  uri: z
    .string()
    .refine(isAllowedUrl, "Must be a public HTTPS URL or http://localhost for local dev")
    .describe("URL pointing to a glTF (.gltf) or GLB (.glb) file"),
  scale: z.number().optional().describe("Uniform scale factor (default 1.0)"),
  minimumPixelSize: z
    .number()
    .optional()
    .describe(
      "Minimum rendered size in pixels regardless of zoom (default 64)",
    ),
  heading: z
    .number()
    .optional()
    .describe("Model heading in degrees (default 0)"),
  pitch: z
    .number()
    .optional()
    .describe("Model pitch in degrees (default 0)"),
  roll: z.number().optional().describe("Model roll in degrees (default 0)"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddModelInput = z.infer<typeof addModelSchema>;

export interface AddModelOutput {
  success: boolean;
  entityId: string;
  name: string | undefined;
  /** Coordinates of the placed model — use these to call flyTo */
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// addCorridor — path with width (roads, pipelines, routes)
// ---------------------------------------------------------------------------

export const addCorridorSchema = z.object({
  positions: z
    .array(latLonAltSchema)
    .min(2)
    .describe("Ordered path positions for the corridor centreline (min 2)"),
  width: z.number().describe("Corridor width in metres"),
  height: z
    .number()
    .optional()
    .describe("Height above ground in metres (default 0)"),
  extrudedHeight: z
    .number()
    .optional()
    .describe("Extrusion height in metres for a 3D corridor"),
  material: z
    .string()
    .optional()
    .describe("CSS fill colour (default 'rgba(51,136,255,0.5)')"),
  outline: z.boolean().optional().describe("Show outline (default true)"),
  outlineColor: z
    .string()
    .optional()
    .describe("CSS outline colour (default 'white')"),
  cornerType: z
    .enum(["ROUNDED", "MITERED", "BEVELED"])
    .optional()
    .describe("Corner style (default 'ROUNDED')"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddCorridorInput = z.infer<typeof addCorridorSchema>;

export interface AddCorridorOutput {
  success: boolean;
  entityId: string;
  vertexCount: number;
  /** Midpoint of the corridor — use these to call flyTo */
  centroidLatitude: number;
  centroidLongitude: number;
}

// ---------------------------------------------------------------------------
// addEllipse — circle or ellipse area (zones, coverage regions)
// ---------------------------------------------------------------------------

export const addEllipseSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Center latitude in decimal degrees (−90 … 90)"),
  longitude: z.number().min(-180).max(180).describe("Center longitude in decimal degrees (−180 … 180)"),
  altitude: z
    .number()
    .optional()
    .describe("Center altitude above ellipsoid in metres (default 0)"),
  semiMajorAxis: z
    .number()
    .describe("Semi-major (longest) radius in metres"),
  semiMinorAxis: z
    .number()
    .describe("Semi-minor (shortest) radius in metres"),
  height: z
    .number()
    .optional()
    .describe("Height above ground for a floating ellipse in metres"),
  extrudedHeight: z
    .number()
    .optional()
    .describe("Extrusion height in metres for a 3D ellipse"),
  rotation: z
    .number()
    .optional()
    .describe("Rotation angle in degrees from North (default 0)"),
  material: z
    .string()
    .optional()
    .describe("CSS fill colour (default 'rgba(51,136,255,0.5)')"),
  outline: z.boolean().optional().describe("Show outline (default true)"),
  outlineColor: z
    .string()
    .optional()
    .describe("CSS outline colour (default 'white')"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddEllipseInput = z.infer<typeof addEllipseSchema>;

export interface AddEllipseOutput {
  success: boolean;
  entityId: string;
  name: string | undefined;
  /** Coordinates of the placed ellipse centre — use these to call flyTo */
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// addWall — vertical wall or fence from a series of positions
// ---------------------------------------------------------------------------

export const addWallSchema = z.object({
  positions: z
    .array(latLonAltSchema)
    .min(2)
    .describe("Positions defining the wall path (min 2)"),
  minimumHeights: z
    .array(z.number())
    .optional()
    .describe(
      "Per-position minimum heights in metres (parallel array to positions)",
    ),
  maximumHeights: z
    .array(z.number())
    .optional()
    .describe(
      "Per-position maximum heights in metres (parallel array to positions)",
    ),
  material: z
    .string()
    .optional()
    .describe("CSS fill colour (default 'rgba(51,136,255,0.5)')"),
  outline: z.boolean().optional().describe("Show outline (default true)"),
  outlineColor: z
    .string()
    .optional()
    .describe("CSS outline colour (default 'white')"),
  name: z.string().optional().describe("Entity name"),
  description: z.string().optional().describe("Optional description text"),
  id: z.string().optional().describe("Custom stable entity ID"),
});

export type AddWallInput = z.infer<typeof addWallSchema>;

export interface AddWallOutput {
  success: boolean;
  entityId: string;
  vertexCount: number;
  /** Midpoint of the wall — use these to call flyTo */
  centroidLatitude: number;
  centroidLongitude: number;
}

// ---------------------------------------------------------------------------
// listEntities — list all entities currently in the scene
// ---------------------------------------------------------------------------

export const listEntitiesSchema = z.object({
  filterByType: z
    .enum([
      "point",
      "billboard",
      "label",
      "model",
      "polygon",
      "polyline",
      "rectangle",
      "box",
      "cylinder",
      "ellipse",
      "corridor",
      "wall",
    ])
    .optional()
    .describe("Filter entities by the graphics type they carry"),
});

export type ListEntitiesInput = z.infer<typeof listEntitiesSchema>;

export interface ListEntityEntry {
  id: string;
  name: string | undefined;
  type: string;
  position?: { latitude: number; longitude: number; altitude: number };
}

export interface ListEntitiesOutput {
  entities: ListEntityEntry[];
  totalCount: number;
}
