import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, type CsvRow } from "./csv.js";
import { followRedirects } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, "..", "data");
export const CSV_PATH = path.join(DATA_DIR, "dataset-links.csv");

const DATASET_CSV_URL =
  "https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv";

async function fetchText(url: string): Promise<string> {
  const res = await followRedirects(url);
  if (res.statusCode !== 200) {
    throw new Error(`HTTP ${res.statusCode} fetching ${url}`);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    res.on("data", (d: Buffer) => chunks.push(d));
    res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    res.on("error", reject);
  });
}

async function loadCsv(): Promise<CsvRow[]> {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  let text: string;
  if (fs.existsSync(CSV_PATH)) {
    text = await fs.promises.readFile(CSV_PATH, "utf-8");
  } else {
    console.log("[buildingfootprints] Downloading dataset-links.csv…");
    text = await fetchText(DATASET_CSV_URL);
    await fs.promises.writeFile(CSV_PATH, text, "utf-8");
    console.log("[buildingfootprints] dataset-links.csv saved.");
  }
  return parseCsv(text);
}

// Promise-based lock: one shared promise, reset to null on failure so callers can retry.
let csvPromise: Promise<CsvRow[]> | null = null;

export function ensureCsvLoaded(): Promise<CsvRow[]> {
  if (!csvPromise) {
    csvPromise = loadCsv().catch((err) => {
      csvPromise = null;
      throw err;
    });
  }
  return csvPromise;
}
