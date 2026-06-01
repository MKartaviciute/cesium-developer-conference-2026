"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import {
  flyToLocation,
  setCameraView,
  cameraLookAt,
  startCameraOrbit,
  stopCameraOrbit,
  getCameraPosition,
  setCameraControllerOptions,
  zoomTo,
} from "@/lib/cesium/camera";
import {
  flyToSchema,
  cameraSetViewSchema,
  cameraLookAtSchema,
  cameraStartOrbitSchema,
  cameraStopOrbitSchema,
  cameraGetPositionSchema,
  cameraSetControllerOptionsSchema,
  zoomToSchema,
  type FlyToOutput,
  type CameraSetViewOutput,
  type CameraLookAtOutput,
  type CameraStartOrbitOutput,
  type CameraStopOrbitOutput,
  type CameraGetPositionOutput,
  type CameraSetControllerOptionsOutput,
  type ZoomToOutput,
} from "./schemas/camera";

// ✏️  Lab 3, Section 3 — Part B: edit this tool description (the text the model reads to decide when and how to call this tool)
const FLY_TO_DESCRIPTION =
  "Fly the camera smoothly to a geographic location on the globe. " +
  "Use for pure navigation requests: 'go to', 'fly to', 'zoom in', " +
  "'zoom into', 'take me to', 'navigate to', 'gradually zoom in'. " +
  "Do NOT use for queries about places ('show me restaurants', " +
  "'find museums near', 'what's around') — those should go to a " +
  "search/POI tool instead. Does NOT add a marker — use addEntity " +
  "separately if a pin is needed.";

export function createCameraTools(viewerRef: RefObject<Viewer | null>) {
  return {
    flyTo: tool({
      description: FLY_TO_DESCRIPTION,
      inputSchema: flyToSchema,
      execute: async (params): Promise<FlyToOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, location: "viewer not ready" };
        return flyToLocation(viewer, params);
      },
    }),

    cameraSetView: tool({
      description:
        "Instantly set the camera position and orientation without any fly animation. Use flyTo for a smooth transition; use cameraSetView to jump immediately.",
      inputSchema: cameraSetViewSchema,
      execute: async (params): Promise<CameraSetViewOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, location: "viewer not ready" };
        return setCameraView(viewer, params);
      },
    }),

    cameraLookAt: tool({
      description:
        "Lock the camera to look at ('focus on', 'point at', 'target', 'centre on') a specific geographic point from a given range and pitch. " +
        "The camera is fixed in a spherical offset relative to the target, enabling orbiting. " +
        "REQUIRED before calling cameraStartOrbit — always call cameraLookAt first to set the orbit centre.",
      inputSchema: cameraLookAtSchema,
      execute: async (params): Promise<CameraLookAtOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, target: "viewer not ready", range: params.range ?? 1_000 };
        return cameraLookAt(viewer, params);
      },
    }),

    cameraStartOrbit: tool({
      description:
        "Start a continuous camera orbit around the current look-at target. Call cameraLookAt first to set the orbit centre. Call cameraStopOrbit to stop.",
      inputSchema: cameraStartOrbitSchema,
      execute: async (params): Promise<CameraStartOrbitOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, speed: params.speed ?? 10, direction: params.direction ?? "clockwise" };
        return startCameraOrbit(viewer, params);
      },
    }),

    cameraStopOrbit: tool({
      description:
        "Stop the active camera orbit. " +
        "Use for 'stop orbiting', 'stop rotating', 'stop spinning', 'stop the orbit', 'cancel the orbit', " +
        "or any request to end the continuous camera rotation started by cameraStartOrbit.",
      inputSchema: cameraStopOrbitSchema,
      execute: async (): Promise<CameraStopOrbitOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, wasOrbiting: false };
        return stopCameraOrbit(viewer);
      },
    }),

    cameraGetPosition: tool({
      description:
        "Get the current camera position, orientation, and view rectangle. Use this to understand what the user is currently looking at before performing navigation.",
      inputSchema: cameraGetPositionSchema,
      execute: async (): Promise<CameraGetPositionOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) {
          return {
            success: false,
            position: { latitude: 0, longitude: 0, altitude: 0 },
            orientation: { heading: 0, pitch: 0, roll: 0 },
            viewRectangle: null,
          };
        }
        return getCameraPosition(viewer);
      },
    }),

    cameraSetControllerOptions: tool({
      description:
        "Configure camera movement constraints and behaviour. " +
        "Use for 'lock the camera', 'freeze the view', 'disable zoom', 'prevent tilting', 'disable rotation', 'lock camera movement'. " +
        "To lock: set the relevant enable flags to false. To unlock: set them back to true. " +
        "Can also set minimum/maximum zoom distances to restrict how close or far the user can zoom.",
      inputSchema: cameraSetControllerOptionsSchema,
      execute: async (params): Promise<CameraSetControllerOptionsOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, settings: null };
        return setCameraControllerOptions(viewer, params);
      },
    }),

    zoomTo: tool({
      description:
        "Zoom the camera to frame a named entity using its bounding sphere with extra standoff so the entity is not too close. " +
        "Use this after addEntity, addBox, addCylinder, addPolygon, addPolyline, addRectangle, addEllipse, addCorridor, or addWall to show the newly added object. " +
        "Optional zoomOutFactor and minRange can be used to frame more context.",
      inputSchema: zoomToSchema,
      execute: async (params): Promise<ZoomToOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, name: params.name, error: "viewer not ready" };
        return zoomTo(viewer, params);
      },
    }),
  };
}
