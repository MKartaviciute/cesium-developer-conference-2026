import Database from "better-sqlite3";
import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import unzipper from "unzipper";
import type { IncomingMessage } from "node:http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, "..", "data");
export const GPKG_PATH = path.join(DATA_DIR, "natural_earth_vector.gpkg");

const ZIP_URL =
  "https://naciscdn.org/naturalearth/packages/natural_earth_vector.gpkg.zip";

let dbInstance: Database.Database | null = null;
let dbReady = false;
let initError: string | null = null;

function followRedirects(
  url: string,
  maxRedirects = 10,
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https://") ? https : http;
    const req = lib.get(url, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        if (maxRedirects <= 0) {
          reject(new Error("Too many redirects"));
          return;
        }
        const next = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        res.resume();
        followRedirects(next, maxRedirects - 1).then(resolve).catch(reject);
      } else {
        resolve(res);
      }
    });
    req.on("error", reject);
  });
}

async function downloadAndExtract(): Promise<void> {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  console.log(
    "[naturalearth] Downloading Natural Earth GeoPackage (~200 MB)…",
  );

  const res = await followRedirects(ZIP_URL);
  if ((res as IncomingMessage).statusCode !== 200) {
    throw new Error(
      `Download failed: HTTP ${(res as IncomingMessage).statusCode}`,
    );
  }

  await new Promise<void>((resolve, reject) => {
    let found = false;
    (res as IncomingMessage)
      .pipe(unzipper.Parse())
      .on("entry", (entry: unzipper.Entry) => {
        const name = entry.path;
        if (!found && name.endsWith(".gpkg")) {
          found = true;
          console.log(`[naturalearth] Extracting ${name}…`);
          const dest = fs.createWriteStream(GPKG_PATH);
          entry.pipe(dest).on("finish", resolve).on("error", reject);
        } else {
          entry.autodrain();
        }
      })
      .on("error", reject)
      .on("finish", () => {
        if (!found) reject(new Error("No .gpkg file found inside the zip"));
      });
  });

  console.log("[naturalearth] GeoPackage extracted.");
}

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(GPKG_PATH)) {
      await downloadAndExtract();
    } else {
      console.log("[naturalearth] GeoPackage already present.");
    }
    dbInstance = new Database(GPKG_PATH, { readonly: true });
    dbReady = true;
    console.log("[naturalearth] Database opened successfully.");
  } catch (err) {
    initError = String(err);
    console.error("[naturalearth] Init error:", err);
  }
}

// Begin initialization at module load (non-blocking)
init();

export function getDb(): Database.Database | null {
  return dbInstance;
}

export function isReady(): boolean {
  return dbReady;
}

export function getInitError(): string | null {
  return initError;
}
