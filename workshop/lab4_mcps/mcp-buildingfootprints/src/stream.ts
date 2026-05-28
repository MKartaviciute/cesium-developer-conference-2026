import zlib from "node:zlib";
import type { CsvRow } from "./csv.js";
import { quadkeyToBbox, bboxesOverlap, type Bbox } from "./quadkey.js";
import { followRedirects } from "./utils.js";

export interface FootprintResult {
  geometry_geojson: string;
  height: number | null;
  confidence: number | null;
}

async function streamShard(
  url: string,
  queryBbox: Bbox,
  results: FootprintResult[],
  limit: number,
): Promise<void> {
  if (results.length >= limit) return;

  const res = await followRedirects(url);
  if (res.statusCode !== 200) return;

  const gunzip = zlib.createGunzip();
  const decompressed = (res as unknown as NodeJS.ReadableStream).pipe(gunzip);
  let buffer = "";
  let done = false;

  await new Promise<void>((resolve, reject) => {
    decompressed.on("data", (chunk: Buffer) => {
      if (done) return;
      buffer += chunk.toString("utf-8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (results.length >= limit) {
          done = true;
          gunzip.destroy();
          resolve();
          return;
        }
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const feature = JSON.parse(trimmed) as {
            geometry: { type: string; coordinates: number[][][] };
            properties?: { height?: number; confidence?: number };
          };
          const coords = feature.geometry?.coordinates?.[0];
          if (!coords || coords.length === 0) continue;
          const minLon = coords.reduce((m, c) => Math.min(m, c[0]), Infinity);
          const maxLon = coords.reduce((m, c) => Math.max(m, c[0]), -Infinity);
          const minLat = coords.reduce((m, c) => Math.min(m, c[1]), Infinity);
          const maxLat = coords.reduce((m, c) => Math.max(m, c[1]), -Infinity);
          const featureBbox: Bbox = { minLon, maxLon, minLat, maxLat };
          if (bboxesOverlap(featureBbox, queryBbox)) {
            results.push({
              geometry_geojson: JSON.stringify(feature.geometry),
              height: feature.properties?.height ?? null,
              confidence: feature.properties?.confidence ?? null,
            });
          }
        } catch {
          // skip malformed lines
        }
      }
    });

    decompressed.on("end", resolve);
    decompressed.on("error", reject);
    res.on("error", reject);
  });
}

export async function streamFootprintsByBbox(
  csvRows: CsvRow[],
  country: string,
  queryBbox: Bbox,
  limit: number,
): Promise<{ results: FootprintResult[]; shardsChecked: number; shardsMatched: number }> {
  const countryRows = csvRows.filter((r) => r.Location === country);
  const matchingShards = countryRows.filter((r) =>
    bboxesOverlap(quadkeyToBbox(r.QuadKey), queryBbox),
  );

  const results: FootprintResult[] = [];
  for (const shard of matchingShards) {
    if (results.length >= limit) break;
    await streamShard(shard.Url, queryBbox, results, limit);
  }

  return {
    results,
    shardsChecked: countryRows.length,
    shardsMatched: matchingShards.length,
  };
}
