const BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api";

export function getMapKey(): string | null {
  return process.env.FIRMS_MAP_KEY ?? null;
}

export interface FireFilter {
  limit?: number;
  min_frp?: number;
  confidence?: "h" | "n" | "l";
}

const KEPT_FIELDS = new Set([
  "latitude",
  "longitude",
  "acq_date",
  "acq_time",
  "frp",
  "bright_ti4",
  "bright_ti5",
  "confidence",
]);

export interface FireDetection {
  latitude: string;
  longitude: string;
  acq_date: string;
  acq_time: string;
  frp: string;
  bright_ti4: string;
  bright_ti5: string;
  confidence: string;
}

export interface FireResult {
  total_matched: number;
  returned: number;
  truncated: boolean;
  detections: FireDetection[];
}

export async function fetchActiveFires(
  mapKey: string,
  source: string,
  area: string,
  dayRange: number,
  date?: string,
  filter?: FireFilter,
): Promise<FireResult> {
  const path = date
    ? `/area/csv/${mapKey}/${source}/${area}/${dayRange}/${date}`
    : `/area/csv/${mapKey}/${source}/${area}/${dayRange}`;

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FIRMS API error: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  let records = parseCsv(text);

  if (filter?.confidence) {
    records = records.filter((r) => r["confidence"] === filter.confidence);
  }
  if (filter?.min_frp !== undefined) {
    records = records.filter((r) => parseFloat(r["frp"] ?? "0") >= filter.min_frp!);
  }

  // sort descending by FRP so limit returns the most intense fires
  records.sort((a, b) => parseFloat(b["frp"] ?? "0") - parseFloat(a["frp"] ?? "0"));

  const total_matched = records.length;

  if (filter?.limit !== undefined) {
    records = records.slice(0, filter.limit);
  }

  const detections = records.map((r) => {
    const out: Record<string, string> = {};
    for (const key of KEPT_FIELDS) out[key] = r[key] ?? "";
    return out as unknown as FireDetection;
  });

  return {
    total_matched,
    returned: detections.length,
    truncated: detections.length < total_matched,
    detections,
  };
}

export async function fetchTransactionStatus(mapKey: string): Promise<unknown> {
  const url = `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=${mapKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FIRMS API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { fields.push(field.trim()); field = ""; }
      else { field += ch; }
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = values[i] ?? "";
    });
    return record;
  });
}
