const BASE_URL = "https://data.humdata.org/api/3/action";

interface RawDataset {
  id: string;
  name: string;
  title: string;
  notes?: string;
  metadata_modified?: string;
  dataset_date?: string;
  organization?: { name: string; title: string };
  tags?: { name: string }[];
  groups?: { name: string; display_name: string }[];
  resources?: { name: string; format: string; url: string; description?: string }[];
  [key: string]: unknown;
}

function slimDataset(d: RawDataset, includeResources = false) {
  const groups = d.groups ?? [];
  return {
    id: d.id,
    name: d.name,
    title: d.title,
    notes: d.notes ? d.notes.replace(/<[^>]+>/g, "").slice(0, 200) : undefined,
    metadata_modified: d.metadata_modified,
    dataset_date: d.dataset_date,
    organization: d.organization
      ? { name: d.organization.name, title: d.organization.title }
      : undefined,
    tags: d.tags?.map((t) => t.name),
    // For search results keep only first 5 groups + total count to cap payload size.
    // Multi-country datasets can have 80+ groups which causes token overflow.
    groups: groups.slice(0, 5).map((g) => ({ name: g.name, display_name: g.display_name })),
    groups_count: groups.length,
    ...(includeResources && {
      resources: d.resources?.map((r) => ({
        name: r.name,
        format: r.format,
        url: r.url,
        description: r.description,
      })),
    }),
  };
}

export async function searchDatasets(params: {
  q: string;
  fq?: string;
  rows?: number;
  start?: number;
}) {
  const url = new URL(`${BASE_URL}/package_search`);
  url.searchParams.set("q", params.q);
  if (params.fq) url.searchParams.set("fq", params.fq);
  if (params.rows !== undefined) url.searchParams.set("rows", String(params.rows));
  if (params.start !== undefined) url.searchParams.set("start", String(params.start));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HDX API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { result: { count: number; results: RawDataset[] } };
  const datasets = data.result.results.map((d) => slimDataset(d, false));
  const start = params.start ?? 0;
  const rows = params.rows ?? 10;
  return {
    total: data.result.count,
    returned: datasets.length,
    start,
    has_more: start + datasets.length < data.result.count,
    next_start: start + datasets.length < data.result.count ? start + rows : undefined,
    datasets,
  };
}

export async function getDataset(id: string) {
  const url = new URL(`${BASE_URL}/package_show`);
  url.searchParams.set("id", id);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HDX API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { result: RawDataset };
  return slimDataset(data.result, true);
}
