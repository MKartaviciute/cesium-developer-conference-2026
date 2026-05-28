"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { Viewer } from "cesium";

/** Lightweight snapshot of a single CesiumJS entity. */
export interface EntityInfo {
  id: string;
  name: string | undefined;
}

/** Lightweight snapshot of a single imagery layer. */
export interface LayerInfo {
  index: number;
  show: boolean;
  alpha: number;
}

/** Value provided by {@link CesiumProvider} and consumed via {@link useCesiumViewer}. */
export interface CesiumContextValue {
  viewerRef: RefObject<Viewer | null>;
  registerViewer: (viewer: Viewer) => () => void;
  entities: EntityInfo[];
  layers: LayerInfo[];
}

function snapshotEntities(viewer: Viewer): EntityInfo[] {
  const values = viewer.entities.values;
  return Array.from({ length: values.length }, (_, i) => ({
    id: values[i].id,
    name: values[i].name,
  }));
}

function snapshotLayers(viewer: Viewer): LayerInfo[] {
  const collection = viewer.imageryLayers;
  return Array.from({ length: collection.length }, (_, i) => {
    const layer = collection.get(i);
    return { index: i, show: layer.show, alpha: layer.alpha };
  });
}

const CesiumContext = createContext<CesiumContextValue | null>(null);

export function useCesiumContext(): CesiumContextValue {
  const ctx = useContext(CesiumContext);
  if (!ctx) {
    throw new Error("useCesiumContext must be used inside <CesiumProvider>");
  }
  return ctx;
}

export function useCesiumContextOptional(): CesiumContextValue | null {
  return useContext(CesiumContext);
}

export function CesiumProvider({ children }: { children: ReactNode }) {
  const viewerRef = useRef<Viewer | null>(null);
  const [entities, setEntities] = useState<EntityInfo[]>([]);
  const [layers, setLayers] = useState<LayerInfo[]>([]);

  const registerViewer = useCallback((viewer: Viewer): (() => void) => {
    viewerRef.current = viewer;

    setEntities(snapshotEntities(viewer));
    setLayers(snapshotLayers(viewer));

    const onEntitiesChanged = () => setEntities(snapshotEntities(viewer));
    viewer.entities.collectionChanged.addEventListener(onEntitiesChanged);

    const onLayersChanged = () => setLayers(snapshotLayers(viewer));
    viewer.imageryLayers.layerAdded.addEventListener(onLayersChanged);
    viewer.imageryLayers.layerRemoved.addEventListener(onLayersChanged);
    viewer.imageryLayers.layerMoved.addEventListener(onLayersChanged);
    viewer.imageryLayers.layerShownOrHidden.addEventListener(onLayersChanged);

    return () => {
      viewer.entities.collectionChanged.removeEventListener(onEntitiesChanged);
      viewer.imageryLayers.layerAdded.removeEventListener(onLayersChanged);
      viewer.imageryLayers.layerRemoved.removeEventListener(onLayersChanged);
      viewer.imageryLayers.layerMoved.removeEventListener(onLayersChanged);
      viewer.imageryLayers.layerShownOrHidden.removeEventListener(onLayersChanged);
      viewerRef.current = null;
      setEntities([]);
      setLayers([]);
    };
  }, []);

  return (
    <CesiumContext.Provider value={{ viewerRef, registerViewer, entities, layers }}>
      {children}
    </CesiumContext.Provider>
  );
}
