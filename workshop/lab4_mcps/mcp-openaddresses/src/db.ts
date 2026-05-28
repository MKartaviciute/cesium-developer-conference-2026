import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

export function getDataDir(): string {
  return DATA_DIR;
}

export function getDbPath(collectionId: string): string {
  if (!/^\d+$/.test(collectionId)) {
    throw new Error(`Invalid collection_id: ${collectionId}`);
  }
  return join(DATA_DIR, `addresses_${collectionId}.sqlite`);
}

export function openDb(collectionId: string): Database.Database {
  const db = new Database(getDbPath(collectionId));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS addresses (
      id       INTEGER PRIMARY KEY,
      lon      REAL    NOT NULL,
      lat      REAL    NOT NULL,
      number   TEXT,
      street   TEXT,
      city     TEXT,
      region   TEXT,
      postcode TEXT
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS addr_rtree USING rtree(
      id,
      minLon, maxLon,
      minLat, maxLat
    );
  `);
  return db;
}

export function isDbIndexed(collectionId: string): boolean {
  const dbPath = getDbPath(collectionId);
  if (!existsSync(dbPath)) return false;
  try {
    const db = new Database(dbPath, { readonly: true });
    const row = db.prepare("SELECT value FROM meta WHERE key = 'indexed'").get() as
      | { value: string }
      | undefined;
    db.close();
    return row?.value === "1";
  } catch {
    return false;
  }
}
