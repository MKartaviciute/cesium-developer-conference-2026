import * as https from "node:https";
import * as http from "node:http";
import * as readline from "node:readline";
import type { IncomingMessage } from "node:http";
import unzipper from "unzipper";
import { openDb, isDbIndexed } from "./db.js";
import { getCollectionDownloadUrl } from "./collections.js";

// Module-level flags to prevent duplicate concurrent index builds
const indexingInProgress = new Set<string>();

// Permanent per-collection failure message — prevents retry storms
const indexingFailed = new Map<string, string>();

export function isIndexingInProgress(collectionId: string): boolean {
  return indexingInProgress.has(collectionId);
}

export function getIndexingError(collectionId: string): string | undefined {
  return indexingFailed.get(collectionId);
}

export { isDbIndexed };

interface AddressRow {
  lon: number;
  lat: number;
  number: string;
  street: string;
  city: string;
  region: string;
  postcode: string;
}

/** Parse a single CSV line, handling double-quoted fields. */
function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Download a URL following up to 5 redirects, returning a Node.js Readable. */
function downloadStream(url: string, maxRedirects = 5): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, (res) => {
      const { statusCode, headers } = res;
      if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        if (maxRedirects <= 0) {
          reject(new Error("Too many redirects"));
          return;
        }
        res.resume();
        downloadStream(headers.location, maxRedirects - 1).then(resolve).catch(reject);
      } else if (statusCode !== 200) {
        reject(new Error(`Download failed: HTTP ${statusCode}`));
      } else {
        resolve(res);
      }
    }).on("error", reject);
  });
}

/**
 * Download a collection's zip, parse all CSVs, and insert into the R-tree db.
 * Guards against concurrent builds and records permanent failures so callers
 * get an error message instead of an infinite retry loop.
 */
export async function startIndexing(collectionId: string): Promise<void> {
  if (indexingInProgress.has(collectionId)) return;
  if (isDbIndexed(collectionId)) return;
  if (indexingFailed.has(collectionId)) return;

  indexingInProgress.add(collectionId);
  try {
    const downloadUrl = await getCollectionDownloadUrl(collectionId);
    const responseStream = await downloadStream(downloadUrl);

    const db = openDb(collectionId);
    const insertAddr = db.prepare(
      `INSERT INTO addresses (lon, lat, number, street, city, region, postcode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertRtree = db.prepare(
      `INSERT INTO addr_rtree (id, minLon, maxLon, minLat, maxLat)
       VALUES (?, ?, ?, ?, ?)`
    );
    const batchInsert = db.transaction((rows: AddressRow[]) => {
      for (const row of rows) {
        const result = insertAddr.run(
          row.lon, row.lat, row.number, row.street,
          row.city, row.region, row.postcode
        );
        const id = Number(result.lastInsertRowid);
        insertRtree.run(id, row.lon, row.lon, row.lat, row.lat);
      }
    });

    try {
      const zipStream = responseStream.pipe(unzipper.Parse({ forceStream: true }));
      for await (const entry of zipStream as unknown as AsyncIterable<unzipper.Entry>) {
        if (entry.path.toLowerCase().endsWith(".csv")) {
          const rl = readline.createInterface({ input: entry, crlfDelay: Infinity });
          let isHeader = true;
          const batch: AddressRow[] = [];

          for await (const line of rl) {
            if (isHeader) { isHeader = false; continue; }
            const cols = parseCsvRow(line);
            if (cols.length < 9) continue;
            const lon = parseFloat(cols[0]);
            const lat = parseFloat(cols[1]);
            if (isNaN(lon) || isNaN(lat)) continue;

            batch.push({
              lon, lat,
              number:   cols[2] ?? "",
              street:   cols[3] ?? "",
              city:     cols[5] ?? "",
              region:   cols[7] ?? "",
              postcode: cols[8] ?? "",
            });

            if (batch.length >= 10_000) {
              batchInsert(batch);
              batch.length = 0;
            }
          }
          if (batch.length > 0) batchInsert(batch);
        } else {
          entry.autodrain();
        }
      }

      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('indexed', '1')").run();
    } finally {
      db.close();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    indexingFailed.set(collectionId, msg);
    throw err;
  } finally {
    indexingInProgress.delete(collectionId);
  }
}
