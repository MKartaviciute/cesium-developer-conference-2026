"use client";

import type { Viewer } from "cesium";
import { cesium } from "./cesium-loader";
import type {
  AddEntityOutput,
  RemoveEntityOutput,
  AddPolygonOutput,
  AddPolylineOutput,
  AddRectangleOutput,
  AddBoxOutput,
  AddCylinderOutput,
  AddModelOutput,
  AddCorridorOutput,
  AddEllipseOutput,
  AddWallOutput,
  ListEntitiesOutput,
} from "@/lib/ai/tools/cesium/schemas/entity";

type CesiumModule = typeof import("cesium");
type LatLonAlt = { longitude: number; latitude: number; altitude?: number };

export function toCartesianArray(Cesium: CesiumModule, positions: LatLonAlt[]) {
  return positions.map((p) =>
    Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.altitude ?? 0),
  );
}

export async function addEntity(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    name: string;
    type?: "point" | "label" | "billboard";
    description?: string;
    color?: string;
  },
): Promise<AddEntityOutput> {
  const { latitude, longitude, altitude = 0, name, type = "point", description, color } = params;
  const Cesium = await cesium();
  const cesiumColor = color ? Cesium.Color.fromCssColorString(color) : Cesium.Color.RED;

  const entityOptions: Parameters<typeof viewer.entities.add>[0] = {
    name,
    description,
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
  };

  if (type === "point" || type === undefined) {
    entityOptions.point = {
      pixelSize: 10,
      color: cesiumColor,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    };
  }

  if (type === "label" || type === "billboard") {
    entityOptions.label = {
      text: name,
      font: "14px sans-serif",
      fillColor: cesiumColor,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -20),
    };
  }

  const entity = viewer.entities.add(entityOptions);
  return { success: true, entityId: entity.id, name, latitude, longitude };
}

export function removeEntity(
  viewer: Viewer,
  params: { id?: string; name?: string },
): RemoveEntityOutput {
  const { id, name } = params;
  let removed = 0;

  if (id) {
    const entity = viewer.entities.getById(id);
    if (entity) {
      viewer.entities.remove(entity);
      removed++;
    }
  } else if (name) {
    for (const entity of viewer.entities.values.filter((e) => e.name === name)) {
      viewer.entities.remove(entity);
      removed++;
    }
  }

  return { success: removed > 0, removed };
}

export async function addPolygon(
  viewer: Viewer,
  params: {
    positions: LatLonAlt[];
    extrudedHeight?: number;
    material?: string;
    outline?: boolean;
    outlineColor?: string;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddPolygonOutput> {
  const {
    positions,
    extrudedHeight,
    material = "rgba(51,136,255,0.5)",
    outline = true,
    outlineColor = "white",
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();
  const cartesians = toCartesianArray(Cesium, positions);

  const entity = viewer.entities.add({
    name,
    description,
    id,
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(cartesians),
      material: Cesium.Color.fromCssColorString(material),
      outline,
      outlineColor: Cesium.Color.fromCssColorString(outlineColor),
      ...(extrudedHeight !== undefined && { extrudedHeight }),
    },
  });

  const centroidLatitude = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
  const centroidLongitude = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
  return { success: true, entityId: entity.id, vertexCount: positions.length, centroidLatitude, centroidLongitude };
}

export async function addPolyline(
  viewer: Viewer,
  params: {
    positions: LatLonAlt[];
    width?: number;
    material?: string;
    clampToGround?: boolean;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddPolylineOutput> {
  const {
    positions,
    width = 2,
    material = "white",
    clampToGround = false,
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();
  const cartesians = toCartesianArray(Cesium, positions);

  const entity = viewer.entities.add({
    name,
    description,
    id,
    polyline: {
      positions: cartesians,
      width,
      material: Cesium.Color.fromCssColorString(material),
      clampToGround,
    },
  });

  const centroidLatitude = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
  const centroidLongitude = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
  return { success: true, entityId: entity.id, pointCount: positions.length, centroidLatitude, centroidLongitude };
}

export async function addRectangle(
  viewer: Viewer,
  params: {
    west: number;
    south: number;
    east: number;
    north: number;
    height?: number;
    extrudedHeight?: number;
    material?: string;
    outline?: boolean;
    outlineColor?: string;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddRectangleOutput> {
  const {
    west,
    south,
    east,
    north,
    height = 0,
    extrudedHeight,
    material = "rgba(51,136,255,0.5)",
    outline = true,
    outlineColor = "white",
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();

  const entity = viewer.entities.add({
    name,
    description,
    id,
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(west, south, east, north),
      height,
      material: Cesium.Color.fromCssColorString(material),
      outline,
      outlineColor: Cesium.Color.fromCssColorString(outlineColor),
      ...(extrudedHeight !== undefined && { extrudedHeight }),
    },
  });

  const centroidLatitude = (south + north) / 2;
  const centroidLongitude = (west + east) / 2;
  return { success: true, entityId: entity.id, name, centroidLatitude, centroidLongitude };
}

export async function addBox(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    width: number;
    length: number;
    height: number;
    heading?: number;
    material?: string;
    outline?: boolean;
    outlineColor?: string;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddBoxOutput> {
  const {
    latitude,
    longitude,
    altitude = 0,
    width,
    length,
    height,
    heading = 0,
    material = "rgba(0,128,255,0.7)",
    outline = true,
    outlineColor = "white",
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();
  const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0),
  );

  const entity = viewer.entities.add({
    name,
    description,
    id,
    position,
    orientation,
    box: {
      dimensions: new Cesium.Cartesian3(width, length, height),
      material: Cesium.Color.fromCssColorString(material),
      outline,
      outlineColor: Cesium.Color.fromCssColorString(outlineColor),
    },
  });

  return { success: true, entityId: entity.id, name, latitude, longitude };
}

export async function addCylinder(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    length: number;
    topRadius: number;
    bottomRadius: number;
    material?: string;
    outline?: boolean;
    outlineColor?: string;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddCylinderOutput> {
  const {
    latitude,
    longitude,
    altitude = 0,
    length,
    topRadius,
    bottomRadius,
    material = "rgba(0,128,255,0.7)",
    outline = true,
    outlineColor = "white",
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();

  const entity = viewer.entities.add({
    name,
    description,
    id,
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
    cylinder: {
      length,
      topRadius,
      bottomRadius,
      material: Cesium.Color.fromCssColorString(material),
      outline,
      outlineColor: Cesium.Color.fromCssColorString(outlineColor),
    },
  });

  return { success: true, entityId: entity.id, name, latitude, longitude };
}

export async function addModel(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    uri: string;
    scale?: number;
    minimumPixelSize?: number;
    heading?: number;
    pitch?: number;
    roll?: number;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddModelOutput> {
  const {
    latitude,
    longitude,
    altitude = 0,
    uri,
    scale = 1.0,
    minimumPixelSize = 64,
    heading = 0,
    pitch = 0,
    roll = 0,
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();
  const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(heading),
      Cesium.Math.toRadians(pitch),
      Cesium.Math.toRadians(roll),
    ),
  );

  const entity = viewer.entities.add({
    name,
    description,
    id,
    position,
    orientation,
    model: { uri, scale, minimumPixelSize },
  });

  return { success: true, entityId: entity.id, name, latitude, longitude };
}

export async function addCorridor(
  viewer: Viewer,
  params: {
    positions: LatLonAlt[];
    width: number;
    height?: number;
    extrudedHeight?: number;
    material?: string;
    outline?: boolean;
    outlineColor?: string;
    cornerType?: string;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddCorridorOutput> {
  const {
    positions,
    width,
    height,
    extrudedHeight,
    material = "rgba(51,136,255,0.5)",
    outline = true,
    outlineColor = "white",
    cornerType = "ROUNDED",
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();
  const cartesians = toCartesianArray(Cesium, positions);

  const cornerTypeMap: Record<string, number> = {
    ROUNDED: Cesium.CornerType.ROUNDED,
    MITERED: Cesium.CornerType.MITERED,
    BEVELED: Cesium.CornerType.BEVELED,
  };

  const entity = viewer.entities.add({
    name,
    description,
    id,
    corridor: {
      positions: cartesians,
      width,
      ...(height !== undefined && { height }),
      ...(extrudedHeight !== undefined && { extrudedHeight }),
      material: Cesium.Color.fromCssColorString(material),
      outline,
      outlineColor: Cesium.Color.fromCssColorString(outlineColor),
      cornerType: cornerTypeMap[cornerType] ?? Cesium.CornerType.ROUNDED,
    },
  });

  const centroidLatitude = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
  const centroidLongitude = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
  return { success: true, entityId: entity.id, vertexCount: positions.length, centroidLatitude, centroidLongitude };
}

export async function addEllipse(
  viewer: Viewer,
  params: {
    latitude: number;
    longitude: number;
    altitude?: number;
    semiMajorAxis: number;
    semiMinorAxis: number;
    height?: number;
    extrudedHeight?: number;
    rotation?: number;
    material?: string;
    outline?: boolean;
    outlineColor?: string;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddEllipseOutput> {
  const {
    latitude,
    longitude,
    altitude = 0,
    semiMajorAxis,
    semiMinorAxis,
    height,
    extrudedHeight,
    rotation = 0,
    material = "rgba(51,136,255,0.5)",
    outline = true,
    outlineColor = "white",
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();

  const entity = viewer.entities.add({
    name,
    description,
    id,
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
    ellipse: {
      semiMajorAxis,
      semiMinorAxis,
      ...(height !== undefined && { height }),
      ...(extrudedHeight !== undefined && { extrudedHeight }),
      material: Cesium.Color.fromCssColorString(material),
      outline,
      outlineColor: Cesium.Color.fromCssColorString(outlineColor),
      rotation: Cesium.Math.toRadians(rotation),
    },
  });

  return { success: true, entityId: entity.id, name, latitude, longitude };
}

export async function addWall(
  viewer: Viewer,
  params: {
    positions: LatLonAlt[];
    minimumHeights?: number[];
    maximumHeights?: number[];
    material?: string;
    outline?: boolean;
    outlineColor?: string;
    name?: string;
    description?: string;
    id?: string;
  },
): Promise<AddWallOutput> {
  const {
    positions,
    minimumHeights,
    maximumHeights,
    material = "rgba(51,136,255,0.5)",
    outline = true,
    outlineColor = "white",
    name,
    description,
    id,
  } = params;
  const Cesium = await cesium();
  const cartesians = toCartesianArray(Cesium, positions);

  const entity = viewer.entities.add({
    name,
    description,
    id,
    wall: {
      positions: cartesians,
      ...(minimumHeights !== undefined && { minimumHeights }),
      ...(maximumHeights !== undefined && { maximumHeights }),
      material: Cesium.Color.fromCssColorString(material),
      outline,
      outlineColor: Cesium.Color.fromCssColorString(outlineColor),
    },
  });

  const centroidLatitude = positions.reduce((s, p) => s + p.latitude, 0) / positions.length;
  const centroidLongitude = positions.reduce((s, p) => s + p.longitude, 0) / positions.length;
  return { success: true, entityId: entity.id, vertexCount: positions.length, centroidLatitude, centroidLongitude };
}

export async function listEntities(
  viewer: Viewer,
  params: { filterByType?: string },
): Promise<ListEntitiesOutput> {
  const { filterByType } = params;
  const Cesium = await cesium();
  const currentTime = viewer.clock.currentTime;

  const graphicsTypeMap: Record<string, string> = {
    point: "point",
    billboard: "billboard",
    label: "label",
    model: "model",
    polygon: "polygon",
    polyline: "polyline",
    rectangle: "rectangle",
    box: "box",
    cylinder: "cylinder",
    ellipse: "ellipse",
    corridor: "corridor",
    wall: "wall",
  };

  const entries = viewer.entities.values
    .map((entity) => {
      let type = "unknown";
      for (const key of Object.keys(graphicsTypeMap)) {
        if ((entity as unknown as Record<string, unknown>)[key] !== undefined) {
          type = graphicsTypeMap[key];
          break;
        }
      }

      let position: ListEntitiesOutput["entities"][0]["position"] | undefined;
      try {
        if (entity.position) {
          const cart3 = entity.position.getValue(currentTime);
          if (cart3) {
            const carto = Cesium.Cartographic.fromCartesian(cart3);
            position = {
              latitude: Cesium.Math.toDegrees(carto.latitude),
              longitude: Cesium.Math.toDegrees(carto.longitude),
              altitude: carto.height,
            };
          }
        }
      } catch {
        // Some entities lack a resolvable position (e.g. polygons)
      }

      return { id: entity.id, name: entity.name, type, position };
    })
    .filter((e) => !filterByType || e.type === filterByType);

  return { entities: entries, totalCount: entries.length };
}
