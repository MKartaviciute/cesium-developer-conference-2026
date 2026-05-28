"use client";

import { tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import {
  createAnimation,
  controlAnimation,
  removeAnimation,
  listActiveAnimations,
  updateAnimationPath,
  setCameraTracking,
} from "@/lib/cesium/animation";
import {
  animationCreateSchema,
  animationControlSchema,
  animationRemoveSchema,
  animationListActiveSchema,
  animationUpdatePathSchema,
  animationCameraTrackingSchema,
  type AnimationCreateOutput,
  type AnimationControlOutput,
  type AnimationRemoveOutput,
  type AnimationListActiveOutput,
  type AnimationUpdatePathOutput,
  type AnimationCameraTrackingOutput,
} from "./schemas/animation";

export function createAnimationTools(viewerRef: RefObject<Viewer | null>) {
  return {
    animationCreate: tool({
      description:
        "Create an entity animated along a series of timed position samples. The scene clock is configured to drive the animation. Provide at least two position samples with ISO 8601 timestamps.",
      inputSchema: animationCreateSchema,
      execute: async (params): Promise<AnimationCreateOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) {
          return {
            success: false,
            animationId: "",
            startTime: "",
            stopTime: "",
            modelPreset: "",
          };
        }
        return createAnimation(viewer, params);
      },
    }),

    animationControl: tool({
      description:
        "Play or pause an animation created with animationCreate. The scene clock is shared by all animations, so this affects all currently running animations.",
      inputSchema: animationControlSchema,
      execute: async (params): Promise<AnimationControlOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, animationId: params.animationId, action: params.action };
        return controlAnimation(viewer, params);
      },
    }),

    animationRemove: tool({
      description:
        "Remove an animated entity from the scene by its ID or name, and clear it from the animation registry.",
      inputSchema: animationRemoveSchema,
      execute: async (params): Promise<AnimationRemoveOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, animationId: params.animationId ?? params.name ?? "" };
        return removeAnimation(viewer, params);
      },
    }),

    animationListActive: tool({
      description:
        "List all animations that have been created and not yet removed, including their time range and current playback state.",
      inputSchema: animationListActiveSchema,
      execute: async (): Promise<AnimationListActiveOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, animations: [], totalCount: 0 };
        return listActiveAnimations(viewer);
      },
    }),

    animationUpdatePath: tool({
      description:
        "Update an existing animation. Use this to append waypoints (appendPositionSamples), replace the full path (replacePositionSamples), and/or adjust the path trail appearance (lead/trail time, line width, colour).",
      inputSchema: animationUpdatePathSchema,
      execute: async (params): Promise<AnimationUpdatePathOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, animationId: params.animationId };
        return updateAnimationPath(viewer, params);
      },
    }),

    animationCameraTracking: tool({
      description:
        "Lock the camera to follow an animated entity (track=true) or release camera control back to the user (track=false). If animationId is omitted with track=true, the newest active animation is tracked.",
      inputSchema: animationCameraTrackingSchema,
      execute: async (params): Promise<AnimationCameraTrackingOutput> => {
        const viewer = viewerRef.current;
        if (!viewer) return { success: false, isTracking: false };
        return setCameraTracking(viewer, params);
      },
    }),
  };
}
