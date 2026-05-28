import type { Cartographic, Viewer } from "cesium";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Camera position and orientation snapshot. All angles are in decimal degrees. */
export interface CameraState {
  /** Longitude in decimal degrees (−180 … 180). */
  longitude: number;
  /** Latitude in decimal degrees (−90 … 90). */
  latitude: number;
  /** Height above the WGS84 ellipsoid in metres. */
  altitude: number;
  /** Heading in degrees (0 = North, 90 = East). */
  heading: number;
  /** Pitch in degrees (0 = horizontal, −90 = straight down). */
  pitch: number;
  /** Roll in degrees. */
  roll: number;
}

/** Snapshot of a single visible entity. */
export interface EntityState {
  /** Stable entity ID assigned by CesiumJS. */
  id: string;
  /** Human-readable name (may be undefined if never set). */
  name: string | undefined;
  /**
   * World position at the current clock time.
   * Absent when the entity has no `position` property (e.g. a pure polygon).
   */
  position?: {
    longitude: number;
    latitude: number;
    altitude: number;
  };
}

/** Snapshot of a single data source (KML, GeoJSON, CZML, …). */
export interface DataSourceState {
  /** Data source name (e.g. the filename or a user-assigned label). */
  name: string;
  /** Whether the data source is currently visible. */
  show: boolean;
  /** Number of entities contained in this data source. */
  entityCount: number;
}

/**
 * Full snapshot of the CesiumJS viewer state at a given instant.
 * This is injected into the LLM system prompt so the agent "sees" what is
 * on the globe (see Architecture §8.2).
 */
export interface ViewerState {
  /** Current camera position and orientation. */
  camera: CameraState;
  /** All entities whose `show` flag is `true` at the time of the call. */
  entities: EntityState[];
  /** All data sources currently loaded in the viewer. */
  dataSources: DataSourceState[];
  /** Current scene clock time as an ISO 8601 string. */
  clockTime: string;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/** Converts radians to decimal degrees without a CesiumJS runtime import. */
function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Extracts a lightweight snapshot of the current CesiumJS viewer state.
 *
 * All angles are returned in decimal degrees for human readability.
 * The function is synchronous and performs no I/O — it is safe to call on
 * every chat message without noticeable performance overhead.
 *
 * @param viewer - A live, non-destroyed CesiumJS {@link Viewer} instance.
 * @returns A {@link ViewerState} object describing the current globe state.
 */
export function getViewerState(viewer: Viewer): ViewerState {
  const currentTime = viewer.clock.currentTime;

  // --- Camera ---
  const carto: Cartographic = viewer.camera.positionCartographic;
  const camera: CameraState = {
    longitude: radToDeg(carto.longitude),
    latitude: radToDeg(carto.latitude),
    altitude: carto.height,
    heading: radToDeg(viewer.camera.heading),
    pitch: radToDeg(viewer.camera.pitch),
    roll: radToDeg(viewer.camera.roll),
  };

  // --- Visible entities ---
  // Use the globe ellipsoid to convert Cartesian3 → Cartographic so we avoid
  // a runtime import of the Cesium module (the Viewer reference is sufficient).
  const ellipsoid = viewer.scene.globe.ellipsoid;
  const entities: EntityState[] = viewer.entities.values
    .filter((e) => e.show)
    .map((e) => {
      const posCart = e.position?.getValue(currentTime);
      let position: EntityState["position"];
      if (posCart) {
        const posCartographic = ellipsoid.cartesianToCartographic(posCart);
        position = {
          longitude: radToDeg(posCartographic.longitude),
          latitude: radToDeg(posCartographic.latitude),
          altitude: posCartographic.height,
        };
      }
      return { id: e.id, name: e.name, position };
    });

  // --- Data sources ---
  const dataSources: DataSourceState[] = Array.from(
    { length: viewer.dataSources.length },
    (_, i) => {
      const ds = viewer.dataSources.get(i);
      return {
        name: ds.name,
        show: ds.show,
        entityCount: ds.entities.values.length,
      };
    },
  );

  // --- Clock time ---
  // CesiumJS JulianDate.prototype.toString() delegates to JulianDate.toIso8601()
  // and returns a string such as "2025-01-15T12:00:00Z".
  const clockTime = currentTime.toString();

  return { camera, entities, dataSources, clockTime };
}
