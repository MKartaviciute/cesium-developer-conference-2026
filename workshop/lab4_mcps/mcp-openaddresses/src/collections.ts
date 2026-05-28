import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

const COLLECTIONS_URL = "https://batch.openaddresses.io/api/collections";

export interface Collection {
  id: number | string;
  name: string;
  size?: number;
  download_url?: string;
}

function collectionsFilePath(): string {
  mkdirSync(DATA_DIR, { recursive: true });
  return join(DATA_DIR, "collections.json");
}

export async function fetchCollections(token?: string): Promise<Collection[]> {
  const cachePath = collectionsFilePath();
  if (existsSync(cachePath)) {
    try {
      const raw = readFileSync(cachePath, "utf-8");
      return JSON.parse(raw) as Collection[];
    } catch {
      // fall through to re-fetch
    }
  }

  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(COLLECTIONS_URL, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch collections: HTTP ${res.status}`);
  }
  const data = (await res.json()) as Collection[];
  writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf-8");
  return data;
}

export async function getCollectionDownloadUrl(collectionId: string): Promise<string> {
  const collections = await fetchCollections(process.env.OA_TOKEN);
  const found = collections.find((c) => String(c.id) === collectionId);
  if (!found) {
    throw new Error(`Collection '${collectionId}' not found`);
  }
  return (
    found.download_url ??
    `https://batch.openaddresses.io/collections/${collectionId}/latest.zip`
  );
}
