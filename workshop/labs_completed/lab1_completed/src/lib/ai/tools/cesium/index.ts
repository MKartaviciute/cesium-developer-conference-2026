"use client";

import type { Tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";

import { createCameraTools } from "./camera-tools";

export type CesiumToolCategoryKey = "camera";

export interface CesiumToolGroup {
  key: CesiumToolCategoryKey;
  title: string;
  tools: Record<string, Tool>;
}

/**
 * Build Cesium tools grouped by their owning domain module.
 *
 * Lab 1 — Camera tools only. Once you implement camera-tools.ts,
 * update the import statement at the top to use it:
 *   import { createCameraTools } from "./camera-tools";
 */
export function createCesiumToolGroups(
  viewerRef: RefObject<Viewer | null>,
): CesiumToolGroup[] {
  return [
    { key: "camera", title: "Camera", tools: createCameraTools(viewerRef) },
  ];
}

/**
 * Assembles all Cesium viewer tools into a single map.
 */
export function createCesiumTools(viewerRef: RefObject<Viewer | null>): Record<string, Tool> {
  const groups = createCesiumToolGroups(viewerRef);
  const tools: Record<string, Tool> = {};
  for (const group of groups) {
    Object.assign(tools, group.tools);
  }
  return tools;
}
