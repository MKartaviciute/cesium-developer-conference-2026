"use client";

import * as Cesium from "cesium";
import type { Viewer, Cesium3DTileset } from "cesium";
import type {
  AddTilesetOutput,
  ListTilesetsOutput,
  RemoveTilesetOutput,
  StyleTilesetOutput,
} from "@/lib/ai/tools/cesium/schemas/tileset";

// ---------------------------------------------------------------------------
// Per-viewer tileset registry
// ---------------------------------------------------------------------------

interface TilesetEntry {
  primitive: Cesium3DTileset;
  name: string;
}

// WeakMap allows the Viewer to be GC-collected after unmount.
const tilesetRegistry = new WeakMap<Viewer, Map<string, TilesetEntry>>();

function nextTilesetId(): string {
  return `tileset_${crypto.randomUUID()}`;
}

export function getTilesetMap(viewer: Viewer): Map<string, TilesetEntry> {
  if (!tilesetRegistry.has(viewer)) {
    tilesetRegistry.set(viewer, new Map());
  }
  return tilesetRegistry.get(viewer)!;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function addTileset(
  viewer: Viewer,
  params: {
    type: "ion" | "url";
    assetId?: number;
    url?: string;
    name?: string;
    show?: boolean;
  },
): Promise<AddTilesetOutput> {
  const { type, assetId, url, name, show = true } = params;

  let tileset: InstanceType<typeof Cesium.Cesium3DTileset>;

  if (type === "ion") {
    if (assetId === undefined) return { success: false, tilesetId: "", name: name ?? "" };
    tileset = await Cesium.Cesium3DTileset.fromIonAssetId(assetId);
  } else {
    if (!url) return { success: false, tilesetId: "", name: name ?? "" };
    tileset = await Cesium.Cesium3DTileset.fromUrl(url);
  }

  tileset.show = show;
  viewer.scene.primitives.add(tileset);

  const tilesetId = nextTilesetId();
  const displayName = name ?? tilesetId;
  getTilesetMap(viewer).set(tilesetId, { primitive: tileset, name: displayName });

  return { success: true, tilesetId, name: displayName };
}

export function listTilesets(viewer: Viewer): ListTilesetsOutput {
  const tilesets = Array.from(getTilesetMap(viewer).entries()).map(([id, entry]) => ({
    id,
    name: entry.name,
    show: entry.primitive.show,
  }));
  return { tilesets, totalCount: tilesets.length };
}

export function removeTileset(
  viewer: Viewer,
  params: { id?: string; name?: string; removeAll?: boolean },
): RemoveTilesetOutput {
  const { id, name, removeAll = false } = params;
  const registry = getTilesetMap(viewer);
  let removed = 0;

  const deleteEntry = (entryId: string) => {
    const entry = registry.get(entryId);
    if (entry) {
      viewer.scene.primitives.remove(entry.primitive);
      registry.delete(entryId);
      removed++;
    }
  };

  if (removeAll) {
    for (const entryId of Array.from(registry.keys())) deleteEntry(entryId);
  } else if (id) {
    deleteEntry(id);
  } else if (name) {
    for (const [entryId, entry] of registry.entries()) {
      if (entry.name === name) { deleteEntry(entryId); break; }
    }
  }

  return { success: removed > 0, removed };
}

// ---------------------------------------------------------------------------
// Expression sanitizer
// ---------------------------------------------------------------------------

/**
 * Fixes common LLM mistakes in Cesium 3D Tiles style expressions before they
 * reach the parser, which throws on invalid syntax.
 *
 * Corrections applied:
 * 1. Unbracketed property names containing special characters (# : space) are
 *    rewritten to bracket notation so the parser doesn't choke.
 *    e.g. ${cesium#estimatedHeight} → ${feature['cesium#estimatedHeight']}
 */
function sanitizeExpression(expr: string): string {
  // 1. Fix unbracketed identifiers with special chars: ${some#name} → ${feature['some#name']}
  expr = expr.replace(
    /\$\{([A-Za-z0-9_]*[#: ][A-Za-z0-9_#: .]*)\}/g,
    (_match, prop) => `\${feature['${prop}']}`,
  );

  // 2. The style language does not support defined(...); rewrite to explicit
  // undefined comparisons while preserving negation semantics.
  // Examples:
  // !defined(${feature['h']}) -> ${feature['h']} === undefined
  //  defined(${feature['h']}) -> ${feature['h']} !== undefined
  expr = expr.replace(
    /!\s*defined\s*\(\s*(\$\{[^)]+\})\s*\)/g,
    (_match, accessor) => `${accessor} === undefined`,
  );
  expr = expr.replace(
    /\bdefined\s*\(\s*(\$\{[^)]+\})\s*\)/g,
    (_match, accessor) => `${accessor} !== undefined`,
  );

  // NOTE: Do NOT convert !== undefined to defined() — the Cesium 3D Tiles Style Language
  // does NOT support the defined() function at runtime. Always use !== undefined.

  return expr;
}

export async function styleTileset(
  viewer: Viewer,
  params: {
    id?: string;
    name?: string;
    color?: string;
    colorConditions?: Array<{ condition: string; colorExpr: string }>;
    show?: boolean;
    showConditions?: Array<{ condition: string; showExpr: string }>;
  },
): Promise<StyleTilesetOutput> {
  const { id, name, color, colorConditions, show, showConditions } = params;
  const registry = getTilesetMap(viewer);

  let targetId: string | undefined;
  let entry: TilesetEntry | undefined;

  if (id) {
    targetId = id;
    entry = registry.get(id);
  } else if (name) {
    for (const [eid, e] of registry.entries()) {
      if (e.name === name) { targetId = eid; entry = e; break; }
    }
  }

  if (!entry || !targetId) {
    return { success: false, tilesetId: targetId ?? "", name: name ?? "" };
  }

  const tileset = entry.primitive;
  const styleProps: Record<string, unknown> = {};

  if (color !== undefined) styleProps.color = sanitizeExpression(color);
  if (colorConditions !== undefined) {
    styleProps.color = {
      conditions: colorConditions.map((r) => [
        sanitizeExpression(r.condition),
        sanitizeExpression(r.colorExpr),
      ]),
    };
  }
  if (show !== undefined) styleProps.show = String(show);
  if (showConditions !== undefined) {
    styleProps.show = {
      conditions: showConditions.map((r) => [
        sanitizeExpression(r.condition),
        r.showExpr,
      ]),
    };
  }

  try {
    tileset.style = new Cesium.Cesium3DTileStyle(styleProps);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, tilesetId: targetId, name: entry.name, error: msg };
  }

  return { success: true, tilesetId: targetId, name: entry.name };
}
