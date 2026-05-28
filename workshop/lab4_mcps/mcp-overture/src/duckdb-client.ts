// DuckDB client — one in-memory database, initialised at module load.
// Wraps the callback-based duckdb Node.js API with Promises.

// duckdb is a native CJS addon; tsx handles the ESM interop at runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const duckdb: any = require("duckdb");

const OVERTURE_BASE =
  "s3://overturemaps-us-west-2/release/2026-05-20.0";

export const PLACES_URL = `${OVERTURE_BASE}/theme=places/type=place/*.parquet`;
export const BUILDINGS_URL = `${OVERTURE_BASE}/theme=buildings/type=building/*.parquet`;
export const DIVISIONS_URL = `${OVERTURE_BASE}/theme=divisions/type=division_area/*.parquet`;

// ---------------------------------------------------------------------------
// Shard index — maps known geographic regions to the specific parquet files
// that contain data for that region, so queries skip irrelevant shards.
// Discovered by probing all 512 building shards for non-zero row counts.
// Each entry: [minLon, minLat, maxLon, maxLat] and the matching file names.
//
// NOTE: only UK/Ireland is indexed. Bboxes outside these regions fall back to
// scanning all 512 S3 shards (global glob), which is slow (~120s).
// Add more entries here to improve performance for other regions.
// ---------------------------------------------------------------------------
type ShardRegion = {
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  files: string[];
};

const BUILDINGS_SHARD_INDEX: ShardRegion[] = [
  {
    // United Kingdom & Ireland
    bounds: [-10, 49, 2, 62],
    files: [
      "part-00115-834c0750-b303-5f54-a421-aa9ca209e035-c000.zstd.parquet",
      "part-00118-7e5eb552-6775-5c9f-8119-323b73893002-c000.zstd.parquet",
      "part-00119-fb1be2ad-1b11-5c9e-aa1b-0952d774e243-c000.zstd.parquet",
      "part-00124-c542d215-e5eb-56b5-a84e-28521ee13ab0-c000.zstd.parquet",
      "part-00125-0d1e4188-6d5f-513c-ac23-c596d6b223ba-c000.zstd.parquet",
      "part-00126-30bdba33-380a-5fec-9ffa-6905e5e828bb-c000.zstd.parquet",
      "part-00127-95239d59-dd38-5d3e-948f-a4afa73cbd67-c000.zstd.parquet",
      "part-00224-6fb3a9c6-f953-5e4f-a4f5-0fdf8be8dc90-c000.zstd.parquet",
      "part-00225-9a55b420-ecb3-5bdc-ad3e-9bd1f62aff19-c000.zstd.parquet",
      "part-00232-fe63f9c0-2631-5871-a600-f969ba9a705b-c000.zstd.parquet",
      "part-00236-82f50319-5dfa-5beb-8603-5385d663e65e-c000.zstd.parquet",
    ],
  },
];

/**
 * Returns a SQL read_parquet() source expression for the given bbox.
 * If the bbox falls within a known shard region, returns only those files
 * (dramatically reducing S3 requests). Falls back to the global glob otherwise.
 */
export function buildingsSource(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
): string {
  for (const { bounds, files } of BUILDINGS_SHARD_INDEX) {
    const [rMinLon, rMinLat, rMaxLon, rMaxLat] = bounds;
    if (
      minLon >= rMinLon &&
      minLat >= rMinLat &&
      maxLon <= rMaxLon &&
      maxLat <= rMaxLat
    ) {
      const base = `${OVERTURE_BASE}/theme=buildings/type=building`;
      const list = files.map((f) => `'${base}/${f}'`).join(", ");
      return `[${list}]`;
    }
  }
  return `'${BUILDINGS_URL}'`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any = null;
let dbReady = false;
let initError: string | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runStatement(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn.run(sql, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function queryAll(sql: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn.all(sql, (err: any, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows ?? []);
    });
  });
}

async function init(): Promise<void> {
  try {
    db = new duckdb.Database(":memory:");
    conn = db.connect();
    await runStatement("INSTALL httpfs; LOAD httpfs;");
    await runStatement("INSTALL spatial; LOAD spatial;");
    await runStatement("SET s3_region='us-west-2';");
    // Anonymous S3 access — empty credentials fall back to unauthenticated requests
    await runStatement("SET s3_access_key_id='';");
    await runStatement("SET s3_secret_access_key='';");
    dbReady = true;
    console.log("[overture] DuckDB initialised with httpfs.");
  } catch (err) {
    initError = String(err);
    console.error("[overture] DuckDB init error:", err);
  }
}

init();

export function isReady(): boolean {
  return dbReady;
}

export function getInitError(): string | null {
  return initError;
}

/** Run a query with a 120-second timeout. Returns rows or throws with a message. */
export async function queryWithTimeout(
  sql: string,
): Promise<Record<string, unknown>[]> {
  if (!dbReady) {
    throw new Error(
      initError
        ? `DuckDB init failed: ${initError}`
        : "DuckDB initialising — retry in a moment",
    );
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Query timed out after 120 seconds")),
      120_000,
    ),
  );

  return Promise.race([queryAll(sql), timeoutPromise]);
}
