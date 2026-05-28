import { tool } from "ai";
import { z } from "zod";
import type { RefObject } from "react";
import type * as CesiumType from "cesium";
import { flyToLocation } from "@/lib/cesium/camera";

export function createCameraTools(
  viewerRef: RefObject<CesiumType.Viewer | null>,
) {
  return {
    flyTo: tool({
      description:
        "Fly the camera to a geographic location. " +
        "Use when the user asks to navigate, go to, show, or visit a place.",
      inputSchema: z.object({
        latitude: z.number().describe("Decimal degrees, positive = north"),
        longitude: z.number().describe("Decimal degrees, positive = east"),
        altitude: z
          .number()
          .optional()
          .describe("Camera height above ground in metres. Default: 1 000 000"),
        duration: z
          .number()
          .optional()
          .describe("Flight duration in seconds. Default: 3"),
        locationName: z
          .string()
          .describe("Human-readable name shown in the result card"),
      }),
      execute: async ({ latitude, longitude, altitude, duration }) => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) {
          return { success: false, error: "Viewer not ready" };
        }
        await flyToLocation(viewer, { latitude, longitude, altitude, duration });
        return { success: true, latitude, longitude, altitude };
      },
    }),
  };
}