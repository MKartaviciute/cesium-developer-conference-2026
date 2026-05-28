const BASE_URL = "https://eonet.gsfc.nasa.gov/api/v3";

export interface EonetEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  categories: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; url: string }>;
  geometry: Array<{
    magnitudeValue: number | null;
    magnitudeUnit: string | null;
    date: string;
    type: string;
    coordinates: number[] | number[][];
  }>;
}

export interface EonetEventsResponse {
  title: string;
  description: string;
  link: string;
  events: EonetEvent[];
}

export interface EonetCategory {
  id: string;
  title: string;
  link: string;
  description: string;
  layers: string;
}

export interface EonetCategoriesResponse {
  title: string;
  description: string;
  link: string;
  categories: EonetCategory[];
}

export async function fetchEvents(params: {
  status?: "open" | "closed" | "all";
  category?: string;
  days?: number;
  limit?: number;
}): Promise<EonetEventsResponse> {
  const url = new URL(`${BASE_URL}/events`);
  if (params.status && params.status !== "all") {
    url.searchParams.set("status", params.status);
  }
  if (params.category) {
    url.searchParams.set("category", params.category);
  }
  if (params.days != null) {
    url.searchParams.set("days", String(params.days));
  }
  if (params.limit != null) {
    url.searchParams.set("limit", String(params.limit));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`EONET API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<EonetEventsResponse>;
}

export async function fetchCategories(): Promise<EonetCategoriesResponse> {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) {
    throw new Error(`EONET API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<EonetCategoriesResponse>;
}
