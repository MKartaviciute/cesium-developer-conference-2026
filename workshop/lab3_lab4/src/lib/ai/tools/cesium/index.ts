"use client";

import type { Tool } from "ai";
import type { RefObject } from "react";
import type { Viewer } from "cesium";
import { createCameraTools }     from "./camera-tools";
import { createEntityTools }     from "./entity-tools";
import { createDataSourceTools } from "./data-source-tools";
import { createImageryTools }    from "./imagery-tools";
import { createTerrainTools }    from "./terrain-tools";
import { createTilesetTools }    from "./tileset-tools";
import { createClockTools }      from "./clock-tools";
import { createAnimationTools }  from "./animation-tools";

export type CesiumToolCategoryKey =
  | "camera"
  | "entities"
  | "data"
  | "imagery"
  | "terrain"
  | "tilesets"
  | "clock"
  | "animation";

export interface CesiumToolGroup {
  key: CesiumToolCategoryKey;
  title: string;
  tools: Record<string, Tool>;
}

/**
 * Wraps every tool's `execute` function with error handling so that any
 * unexpected exception thrown by a CesiumJS API call is caught and returned as
 * `{ success: false, message }` instead of propagating up the call stack.
 * The AI SDK `options` argument (which carries `abortSignal`) is forwarded.
 */
function applyErrorHandling<T extends Record<string, Tool>>(tools: T): T {
  const result: Record<string, Tool> = {};
  for (const [name, t] of Object.entries(tools)) {
    if (typeof t.execute !== "function") {
      result[name] = t;
      continue;
    }
    const original = t.execute as (
      input: unknown,
      options: unknown,
    ) => Promise<{ success: boolean }>;
    result[name] = {
      ...t,
      execute: async (input: unknown, options: unknown) => {
        try {
          return await original(input, options);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : `${name} failed unexpectedly`;
          console.error(`[Tool: ${name}]`, err);
          return { success: false, message };
        }
      },
    } as Tool;
  }
  return result as T;
}

/**
 * Build Cesium tools grouped by their owning domain module.
 *
 * This is the canonical source for UI groupings, ensuring category lists stay
 * in sync with the concrete tool modules without name-based heuristics.
 */
export function createCesiumToolGroups(
  viewerRef: RefObject<Viewer | null>,
): CesiumToolGroup[] {
  return [
    { key: "camera", title: "Camera", tools: createCameraTools(viewerRef) },
    { key: "entities", title: "Entities", tools: createEntityTools(viewerRef) },
    {
      key: "data",
      title: "Data Sources",
      tools: createDataSourceTools(viewerRef),
    },
    { key: "imagery", title: "Imagery", tools: createImageryTools(viewerRef) },
    { key: "terrain", title: "Terrain", tools: createTerrainTools(viewerRef) },
    { key: "tilesets", title: "3D Tiles", tools: createTilesetTools(viewerRef) },
    { key: "clock", title: "Clock", tools: createClockTools(viewerRef) },
    {
      key: "animation",
      title: "Animation",
      tools: createAnimationTools(viewerRef),
    },
  ];
}

/**
 * Assembles all Cesium viewer tool definitions into a single map.
 *
 * Each domain module owns its own schemas, types, and any module-level state
 * (e.g. orbit listeners, tileset registry). This factory merges them via
 * closure over the same {@link Viewer} ref.
 *
 * All tool `execute` functions are wrapped with {@link applyErrorHandling} so
 * that unexpected CesiumJS errors are caught and returned as structured failure
 * results rather than crashing the agent loop.
 *
 * @param viewerRef - React ref pointing at the live {@link Viewer} instance.
 *   Tools return a failure result when `viewerRef.current` is `null` rather
 *   than throwing (see Architecture §8.1).
 *
 * Domain breakdown:
 * - **camera** — flyTo, cameraSetView, cameraLookAt, cameraStartOrbit, cameraStopOrbit, cameraGetPosition, cameraSetControllerOptions
 * - **entity** — addEntity, removeEntity, addPolygon, addPolyline, addRectangle, addBox, addCylinder, addModel, addCorridor, addEllipse, addWall, listEntities
 * - **data-source** — addGeoJsonLayer, removeLayer
 * - **imagery** — addImageryLayer, listImageryLayers, removeImageryLayer
 * - **terrain** — setTerrain, removeTerrain, getTerrain
 * - **tileset** — addTileset, listTilesets, removeTileset, styleTileset
 * - **clock** — setTime, getViewerState, clockControl, setGlobeLighting
 * - **animation** — animationCreate, animationControl, animationRemove, animationListActive, animationUpdatePath, animationCameraTracking
 */
export function createCesiumTools(viewerRef: RefObject<Viewer | null>) {
  const grouped = createCesiumToolGroups(viewerRef);
  const merged = Object.assign({}, ...grouped.map((group) => group.tools));
  return applyErrorHandling(merged);
}

/** Union type of all tool names produced by {@link createCesiumTools}. */
export type CesiumToolName = keyof ReturnType<typeof createCesiumTools>;
