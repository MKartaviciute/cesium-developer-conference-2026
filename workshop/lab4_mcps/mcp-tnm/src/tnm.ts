const BASE_URL = "https://tnmaccess.nationalmap.gov/api/v1";

const OMIT_FIELDS = new Set([
  "body",
  "moreInfo",
  "downloadURLRaster",
  "downloadLazURL",
  "sourceOriginId",
  "sourceOriginName",
  "processingUrl",
  "previewGraphicURL",
  "vendorMetaUrl",
  // always "ScienceBase" — no value
  "sourceName",
  // always empty [] in item responses
  "datasets",
  // internal API relevance score
  "bestFitIndex",
  // redundant with publicationDate
  "dateCreated",
  // redundant with modificationInfo
  "lastUpdated",
  // duplicate of downloadURL
  "urls",
]);

export interface SearchProductsParams {
  datasets?: string;
  bbox?: string;
  start?: string;
  stop?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SearchProductsResult {
  total: number;
  items: Record<string, unknown>[];
}

export interface DatasetEntry {
  sbDatasetTag: string;
  title: string;
  category: string;
  refreshCycle: string;
  tags?: { sbDatasetTag: string; title: string }[];
}

async function safeFetch(url: string): Promise<Response> {
  try {
    return await fetch(url);
  } catch (err) {
    const e = err as Error & { cause?: Error & { code?: string } };
    const causeInfo = e.cause
      ? ` | cause: ${e.cause.message ?? String(e.cause)}${e.cause.code ? ` (code: ${e.cause.code})` : ""}`
      : "";
    throw new Error(`network error fetching ${url}: ${e.message}${causeInfo}`);
  }
}

export async function searchProducts(params: SearchProductsParams): Promise<SearchProductsResult> {
  const query = new URLSearchParams();
  if (params.datasets) query.set("datasets", params.datasets);
  if (params.bbox) query.set("bbox", params.bbox);
  if (params.start) query.set("start", params.start);
  if (params.stop) query.set("stop", params.stop);
  if (params.q) query.set("q", params.q);
  if (params.limit !== undefined) query.set("max", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const url = `${BASE_URL}/products${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await safeFetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`TNM API error: ${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
  }
  let data: { items?: Record<string, unknown>[]; total?: number };
  try {
    data = JSON.parse(text) as { items?: Record<string, unknown>[]; total?: number };
  } catch {
    throw new Error(`TNM API returned non-JSON response: ${text.slice(0, 200)}`);
  }
  const limit = params.limit ?? 10;
  const items = (data.items ?? [])
    .map((item) => Object.fromEntries(Object.entries(item).filter(([k]) => !OMIT_FIELDS.has(k))))
    .slice(0, limit);
  return { total: data.total ?? items.length, items };
}

export async function listDatasets(): Promise<DatasetEntry[]> {
  const url = `${BASE_URL}/datasets`;
  const response = await safeFetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`TNM API error: ${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`TNM API returned non-JSON response: ${text.slice(0, 200)}`);
  }
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map((d) => {
    const entry: DatasetEntry = {
      sbDatasetTag: String(d.sbDatasetTag ?? ""),
      title: String(d.title ?? ""),
      category: String(d.parentCategory ?? ""),
      refreshCycle: String(d.refreshCycle ?? ""),
    };
    const tags = d.tags as Record<string, unknown>[] | undefined;
    if (Array.isArray(tags) && tags.length > 0) {
      entry.tags = tags.map((t) => ({
        sbDatasetTag: String(t.sbDatasetTag ?? ""),
        title: String(t.title ?? ""),
      }));
    }
    return entry;
  });
}
