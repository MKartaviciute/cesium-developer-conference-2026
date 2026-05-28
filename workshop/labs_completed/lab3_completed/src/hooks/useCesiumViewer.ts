"use client";

import { useCesiumContext } from "@/components/cesium/CesiumProvider";

export type { CesiumContextValue, EntityInfo, LayerInfo } from "@/components/cesium/CesiumProvider";

export function useCesiumViewer() {
  return useCesiumContext();
}
