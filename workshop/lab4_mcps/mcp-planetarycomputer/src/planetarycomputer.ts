const BASE = "https://planetarycomputer.microsoft.com/api/stac/v1";

// Key properties to request server-side (STAC fields extension) and surface in results.
// Covers core EO metadata plus Landsat WRS and Sentinel-2 MGRS tile identifiers.
const KEY_PROPS = [
  "datetime",
  "platform",
  "constellation",
  "instruments",
  "gsd",
  "eo:cloud_cover",
  "view:sun_elevation",
  "view:sun_azimuth",
  "landsat:wrs_path",
  "landsat:wrs_row",
  "s2:mgrs_tile",
];

export interface SearchItemsOptions {
  collections?: string[];
  bbox?: [number, number, number, number];
  datetime?: string;
  limit?: number;
  token?: string;
}

export interface StacItemSummary {
  id: string;
  bbox: number[];
  properties: Record<string, unknown>;
  preview: string | null;
}

export interface SearchItemsResult {
  items: StacItemSummary[];
  nextToken: string | null;
}

interface RawStacFeature {
  id: string;
  bbox: number[];
  properties: Record<string, unknown>;
  assets: Record<string, { href?: string }>;
}

interface RawStacLink {
  rel: string;
  body?: { token?: string };
}

export async function searchItems(opts: SearchItemsOptions): Promise<SearchItemsResult> {
  const body: Record<string, unknown> = {
    limit: opts.limit ?? 10,
    fields: {
      include: [
        "id",
        "bbox",
        "assets.rendered_preview",
        "assets.thumbnail",
        ...KEY_PROPS.map((p) => `properties.${p}`),
      ],
      exclude: [],
    },
  };
  if (opts.collections && opts.collections.length > 0) body.collections = opts.collections;
  if (opts.bbox) body.bbox = opts.bbox;
  if (opts.datetime) body.datetime = opts.datetime;
  if (opts.token) body.token = opts.token;

  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Planetary Computer API HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json() as { features?: RawStacFeature[]; links?: RawStacLink[] };

  const nextToken = json.links?.find((l) => l.rel === "next")?.body?.token ?? null;

  const items = (json.features ?? []).map((f) => {
    const props: Record<string, unknown> = {};
    for (const key of KEY_PROPS) {
      if (f.properties[key] !== undefined) props[key] = f.properties[key];
    }
    return {
      id: f.id,
      bbox: f.bbox,
      properties: props,
      preview: f.assets?.rendered_preview?.href ?? f.assets?.thumbnail?.href ?? null,
    };
  });

  return { items, nextToken };
}

export interface CollectionSummary {
  id: string;
  title: string;
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const res = await fetch(`${BASE}/collections`);
  if (!res.ok) {
    throw new Error(`Planetary Computer API HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json() as { collections?: Array<{ id?: string; title?: string }> };
  return (json.collections ?? []).map((c) => ({
    id: c.id ?? "",
    title: c.title ?? "",
  }));
}
