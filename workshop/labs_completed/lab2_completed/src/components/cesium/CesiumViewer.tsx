"use client";

import { useEffect, useRef } from "react";
import { useCesiumContextOptional } from "@/components/cesium/CesiumProvider";

type WindowWithCesium = Window & {
  CESIUM_BASE_URL?: string;
  __cesiumViewer__?: import("cesium").Viewer;
  __Cesium__?: typeof import("cesium");
};

const BING_MAPS_AERIAL_ASSET_ID = 2;

export interface CesiumViewerProps {
  longitude?: number;
  latitude?: number;
  height?: number;
  heading?: number;
  pitch?: number;
}

export default function CesiumViewer({
  longitude = 0,
  latitude = 0,
  height = 15_000_000,
  heading = 0,
  pitch = -90,
}: CesiumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cesiumContext = useCesiumContextOptional();

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: import("cesium").Viewer | null = null;
    let cancelled = false;
    let contextCleanup: (() => void) | null = null;

    (async () => {
      (window as WindowWithCesium).CESIUM_BASE_URL =
        process.env.CESIUM_BASE_URL ?? "/cesium";

      const Cesium = await import("cesium");

      if (cancelled || !containerRef.current) return;

      if (process.env.CESIUM_ION_ACCESS_TOKEN) {
        Cesium.Ion.defaultAccessToken = process.env.CESIUM_ION_ACCESS_TOKEN;
      }

      viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain({
          requestWaterMask: true,
          requestVertexNormals: true,
        }),
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(
          Cesium.IonImageryProvider.fromAssetId(BING_MAPS_AERIAL_ASSET_ID),
          {},
        ),
        baseLayerPicker: false,
        navigationHelpButton: true,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        animation: true,
        timeline: true,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        scene3DOnly: true,
        requestRenderMode: true,
      });

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
          heading: Cesium.Math.toRadians(heading),
          pitch: Cesium.Math.toRadians(pitch),
          roll: 0.0,
        },
      });

      (window as WindowWithCesium).__cesiumViewer__ = viewer;
      (window as WindowWithCesium).__Cesium__ = Cesium;

      if (cesiumContext) {
        contextCleanup = cesiumContext.registerViewer(viewer);
      }
    })();

    return () => {
      cancelled = true;
      contextCleanup?.();
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      const win = window as WindowWithCesium;
      if (win.__cesiumViewer__ === viewer) {
        win.__cesiumViewer__ = undefined;
        win.__Cesium__ = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
