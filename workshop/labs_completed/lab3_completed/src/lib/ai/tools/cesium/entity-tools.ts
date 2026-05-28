"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import {
  addEntity,
  removeEntity,
  addPolygon,
  addPolyline,
  addRectangle,
  addBox,
  addCylinder,
  addModel,
  addCorridor,
  addEllipse,
  addWall,
  listEntities,
} from "@/lib/cesium/entity";
import {
  addEntitySchema,
  removeEntitySchema,
  addPolygonSchema,
  addPolylineSchema,
  addRectangleSchema,
  addBoxSchema,
  addCylinderSchema,
  addModelSchema,
  addCorridorSchema,
  addEllipseSchema,
  addWallSchema,
  listEntitiesSchema,
  type AddEntityOutput,
  type RemoveEntityOutput,
  type AddPolygonOutput,
  type AddPolylineOutput,
  type AddRectangleOutput,
  type AddBoxOutput,
  type AddCylinderOutput,
  type AddModelOutput,
  type AddCorridorOutput,
  type AddEllipseOutput,
  type AddWallOutput,
  type ListEntitiesOutput,
} from "./schemas/entity";

export function createEntityTools(viewerRef: RefObject<Viewer | null>) {
  return {
    addEntity: tool({
      description:
        "Add a named point, billboard, or label marker to the 3D globe at the given coordinates. Use for requests like 'drop a pin', 'place a marker', 'mark this location', 'add a waypoint', 'flag this spot', or 'put a dot on the map'. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned latitude and longitude to show the user the new marker.",
      inputSchema: addEntitySchema,
      execute: async (params): Promise<AddEntityOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", name: params.name, latitude: 0, longitude: 0 };
        return addEntity(viewer, params);
      },
    }),

    removeEntity: tool({
      description:
        "Remove an entity from the globe by its ID or name. Provide at least one of 'id' or 'name'.",
      inputSchema: removeEntitySchema,
      execute: async (params): Promise<RemoveEntityOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, removed: 0 };
        return removeEntity(viewer, params);
      },
    }),

    addPolygon: tool({
      description:
        "Add a filled geographic polygon to the globe defined by an array of lat/lon vertices. Supports optional extrusion for a 3D effect. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned centroidLatitude and centroidLongitude to show the user the new polygon.",
      inputSchema: addPolygonSchema,
      execute: async (params): Promise<AddPolygonOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", vertexCount: 0, centroidLatitude: 0, centroidLongitude: 0 };
        return addPolygon(viewer, params);
      },
    }),

    addPolyline: tool({
      description:
        "Add a polyline connecting multiple geographic positions to the globe. Useful for paths, routes, and connections. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned centroidLatitude and centroidLongitude to show the user the new line.",
      inputSchema: addPolylineSchema,
      execute: async (params): Promise<AddPolylineOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", pointCount: 0, centroidLatitude: 0, centroidLongitude: 0 };
        return addPolyline(viewer, params);
      },
    }),

    addRectangle: tool({
      description:
        "Add an axis-aligned geographic rectangle defined by west/south/east/north boundaries. Supports optional extrusion for a 3D box effect. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned centroidLatitude and centroidLongitude to show the user the new rectangle.",
      inputSchema: addRectangleSchema,
      execute: async (params): Promise<AddRectangleOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", name: params.name, centroidLatitude: 0, centroidLongitude: 0 };
        return addRectangle(viewer, params);
      },
    }),

    addBox: tool({
      description:
        "Add a 3D box entity at a geographic position. Useful for representing buildings, containers, or volumetric markers. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned latitude and longitude to show the user the new box.",
      inputSchema: addBoxSchema,
      execute: async (params): Promise<AddBoxOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", name: params.name, latitude: 0, longitude: 0 };
        return addBox(viewer, params);
      },
    }),

    addCylinder: tool({
      description:
        "Add a cylinder or cone entity at a geographic position. Set topRadius to 0 to create a cone. Useful for towers, coverage indicators, and vertical structures. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned latitude and longitude to show the user the new cylinder.",
      inputSchema: addCylinderSchema,
      execute: async (params): Promise<AddCylinderOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", name: params.name, latitude: 0, longitude: 0 };
        return addCylinder(viewer, params);
      },
    }),

    addModel: tool({
      description:
        "Add a 3D model (glTF or GLB format) at a geographic position. Provide a publicly accessible URL to the model file. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned latitude and longitude to show the user the new model.",
      inputSchema: addModelSchema,
      execute: async (params): Promise<AddModelOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", name: params.name, latitude: 0, longitude: 0 };
        return addModel(viewer, params);
      },
    }),

    addCorridor: tool({
      description:
        "Add a corridor (path with width) to the globe. Useful for roads, pipelines, routes, and any linear area with a specific width. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned centroidLatitude and centroidLongitude to show the user the new corridor.",
      inputSchema: addCorridorSchema,
      execute: async (params): Promise<AddCorridorOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", vertexCount: 0, centroidLatitude: 0, centroidLongitude: 0 };
        return addCorridor(viewer, params);
      },
    }),

    addEllipse: tool({
      description:
        "Add an ellipse (or circle when semiMajorAxis === semiMinorAxis) at a geographic position. Useful for zones, coverage areas, and circular regions of interest. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned latitude and longitude to show the user the new ellipse.",
      inputSchema: addEllipseSchema,
      execute: async (params): Promise<AddEllipseOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", name: params.name, latitude: 0, longitude: 0 };
        return addEllipse(viewer, params);
      },
    }),

    addWall: tool({
      description:
        "Add a vertical wall or fence defined by a series of positions. Supports variable per-position heights. Useful for barriers, fences, and vertical structures. IMPORTANT: after a successful result you MUST immediately call flyTo using the returned centroidLatitude and centroidLongitude to show the user the new wall.",
      inputSchema: addWallSchema,
      execute: async (params): Promise<AddWallOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, entityId: "", vertexCount: 0, centroidLatitude: 0, centroidLongitude: 0 };
        return addWall(viewer, params);
      },
    }),

    listEntities: tool({
      description:
        "List all entities currently in the CesiumJS scene. Optionally filter by type (point, polygon, polyline, etc.).",
      inputSchema: listEntitiesSchema,
      execute: async (params): Promise<ListEntitiesOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { entities: [], totalCount: 0 };

        return listEntities(viewer, params);
      },
    }),
  };
}

