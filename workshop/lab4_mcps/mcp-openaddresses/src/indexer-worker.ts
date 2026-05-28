import * as fs from "node:fs";
import * as https from "node:https";
import * as http from "node:http";
import * as readline from "node:readline";
import { workerData, parentPort } from "node:worker_threads";
import unzipper from "unzipper";
import { openDb } from "./db.js";

interface WorkerInput {
  collectionId: string;
  /** HTTP/HTTPS URL or an absolute local file path */
  downloadUrl: string;
  token?: string;
}

interface GeoJsonFeature {
  type: "Feature";
  properties: Record<string, string | undefined>;
  geometry: { type: "Point"; coordinates: [number, number] };
}

function downloadStream(url: string, token?: string, maxRedirects = 5): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    const reqHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const req = get(url, { headers: reqHeaders }, (res) => {
      req.socket?.setKeepAlive(true, 30_000);
      const { statusCode, headers } = res;
      if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        if (maxRedirects <= 0) { reject(new Error("Too many redirects")); return; }
        res.resume();
        // Drop the auth token when following cross-origin redirects (e.g. to S3 pre-signed URLs)
        // — S3 returns HTTP 400 if an Authorization header accompanies a pre-signed URL.
        const redirectUrl = headers.location;
        const isSameOrigin = redirectUrl.startsWith("/") || new URL(redirectUrl).origin === new URL(url).origin;
        downloadStream(redirectUrl, isSameOrigin ? token : undefined, maxRedirects - 1).then(resolve).catch(reject);
      } else if (statusCode !== 200) {
        reject(new Error(`Download failed: HTTP ${statusCode}`));
      } else {
        const contentType = headers["content-type"] ?? "";
        if (contentType.startsWith("text/html")) {
          res.resume();
          reject(new Error(
            `Download URL returned HTML instead of a ZIP file (HTTP 200, Content-Type: ${contentType}).\n` +
            `batch.openaddresses.io now requires GitHub authentication.\n` +
            `Log in at https://batch.openaddresses.io, then copy the download URL from the browser network tab.`
          ));
          return;
        }
        resolve(res);
      }
    }).on("error", reject);
  });
}

type Row = [number, number, string, string, string, string, string];

async function processGeoJsonStream(
  stream: NodeJS.ReadableStream,
  batch: Row[],
  BATCH_SIZE: number,
  flushBatch: (rows: Row[]) => void,
): Promise<void> {
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let feature: GeoJsonFeature;
    try {
      feature = JSON.parse(line) as GeoJsonFeature;
    } catch {
      continue;
    }
    if (feature.type !== "Feature" || feature.geometry?.type !== "Point") continue;
    const [lon, lat] = feature.geometry.coordinates;
    if (Number.isNaN(lon) || Number.isNaN(lat)) continue;
    const p = feature.properties ?? {};
    batch.push([lon, lat, p.number ?? "", p.street ?? "", p.city ?? "", p.region ?? "", p.postcode ?? ""]);
    if (batch.length >= BATCH_SIZE) { flushBatch(batch); batch.length = 0; }
  }
}

async function main({ collectionId, downloadUrl, token }: WorkerInput) {
  const db = openDb(collectionId);
  try {
    // Clear any partial data from previous failed runs before re-indexing.
    db.exec(`DELETE FROM addresses; DELETE FROM addr_rtree;`);

    // Bulk-insert pragmas — safe to use here because we own the DB exclusively
    // and can re-index from scratch if the process crashes before we set indexed=1.
    db.pragma("synchronous = OFF");
    db.pragma("journal_mode = MEMORY");
    db.pragma("cache_size = -65536"); // 64 MB page cache
    db.pragma("locking_mode = EXCLUSIVE");
    db.pragma("temp_store = MEMORY");

    const insertAddr = db.prepare(
      `INSERT INTO addresses (lon, lat, number, street, city, region, postcode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const BATCH_SIZE = 50_000;
    const batch: Row[] = [];

    const flushBatch = db.transaction((rows: Row[]) => {
      for (const row of rows) insertAddr.run(...row);
    });

    const isLocalFile = !downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://");

    if (isLocalFile) {
      if (!fs.existsSync(downloadUrl)) {
        throw new Error(`Local file not found: ${downloadUrl}`);
      }
      // Use random-access open for local files — more reliable for ZIP64 archives than forceStream.
      const directory = await unzipper.Open.file(downloadUrl);
      for (const file of directory.files) {
        if (file.path.toLowerCase().endsWith(".geojson")) {
          await processGeoJsonStream(file.stream(), batch, BATCH_SIZE, flushBatch);
        }
      }
    } else {
      const responseStream = await downloadStream(downloadUrl, token);
      const contentLength = responseStream.headers["content-length"];
      let bytesReceived = 0;
      responseStream.on("data", (chunk: Buffer) => { bytesReceived += chunk.length; });
      const zipStream = responseStream.pipe(unzipper.Parse({ forceStream: true }));
      responseStream.on("error", (err) => zipStream.destroy(err));
      responseStream.socket?.on("close", () => {
        if (!responseStream.complete) {
          const expected = contentLength ? ` (expected ${contentLength} bytes)` : "";
          zipStream.destroy(new Error(`Download truncated after ${bytesReceived} bytes${expected}: connection closed before response completed`));
        }
      });
      const zipEntries = zipStream as unknown as AsyncIterable<unzipper.Entry>;
      for await (const entry of zipEntries) {
        if (entry.path.toLowerCase().endsWith(".geojson")) {
          await processGeoJsonStream(entry, batch, BATCH_SIZE, flushBatch);
        } else {
          entry.autodrain();
        }
      }
    }

    if (batch.length > 0) flushBatch(batch);

    // Bulk-populate R-tree in one pass after all addresses are committed —
    // faster than per-row inserts because SQLite builds the tree structure at once.
    db.exec(
      `INSERT INTO addr_rtree (id, minLon, maxLon, minLat, maxLat)
       SELECT id, lon, lon, lat, lat FROM addresses`
    );

    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('indexed', '1')").run();
  } finally {
    // Restore durable settings whether main() succeeds or throws — prevents
    // leaving the DB in MEMORY journal mode if the process crashes mid-index.
    try { db.pragma("journal_mode = WAL"); } catch { /* ignore if already closed */ }
    try { db.pragma("synchronous = NORMAL"); } catch { /* ignore if already closed */ }
    try { db.pragma("locking_mode = NORMAL"); } catch { /* ignore if already closed */ }
    db.close();
  }
}

main(workerData as WorkerInput)
  .then(() => { parentPort?.postMessage({ type: "done" }); })
  .catch((err) => { parentPort?.postMessage({ type: "error", message: String(err) }); });
