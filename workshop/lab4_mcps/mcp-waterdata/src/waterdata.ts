const BASE = "https://waterservices.usgs.gov/nwis";

const STREAMFLOW_PARAM = "00060";

// USGS Instantaneous Values JSON shape (subset we consume)
interface NwisValue {
  dateTime: string;
  value: string;
  qualifiers: string[];
}

interface NwisTimeSeries {
  sourceInfo: {
    siteName: string;
    siteCode: Array<{ value: string }>;
    geoLocation: {
      geogLocation: { latitude: number; longitude: number };
    };
  };
  variable: {
    variableName: string;
    variableCode: Array<{ value: string }>;
    unit: { unitCode: string };
  };
  values: Array<{ value: NwisValue[] }>;
}

interface NwisIvResponse {
  value: {
    timeSeries: NwisTimeSeries[];
  };
}

async function nwisFetch(path: string, params: Record<string, string>): Promise<NwisIvResponse> {
  const url = `${BASE}/${path}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`USGS Water Data API HTTP error ${res.status}: ${body}`);
  }
  return res.json() as Promise<NwisIvResponse>;
}

async function nwisFetchRdb(path: string, params: Record<string, string>): Promise<Record<string, string>[]> {
  const url = `${BASE}/${path}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`USGS Water Data API HTTP error ${res.status}: ${body}`);
  }
  const text = await res.text();
  // RDB: lines starting with # are comments; first data line = headers, second = type hints (skip)
  const lines = text.split("\n").filter(l => l.trim() && !l.startsWith("#"));
  if (lines.length < 2) return [];
  const headers = lines[0].split("\t");
  return lines.slice(2).filter(Boolean).map(line => {
    const cols = line.split("\t");
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (cols[i] ?? "").trim()]));
  });
}

function trimStreamflowResponse(raw: NwisIvResponse, offset: number, limit: number): unknown {
  const series = raw.value?.timeSeries ?? [];
  return series.map((ts) => {
    const allValues = ts.values?.[0]?.value ?? [];
    const dominant = allValues[0]?.qualifiers ?? [];
    const domKey = JSON.stringify(dominant);
    const page = allValues.slice(offset, offset + limit);
    return {
      site: {
        id: ts.sourceInfo?.siteCode?.[0]?.value,
        name: ts.sourceInfo?.siteName,
        latitude: ts.sourceInfo?.geoLocation?.geogLocation?.latitude,
        longitude: ts.sourceInfo?.geoLocation?.geogLocation?.longitude,
      },
      variable: {
        code: ts.variable?.variableCode?.[0]?.value,
        name: ts.variable?.variableName,
        unit: ts.variable?.unit?.unitCode,
      },
      readings: {
        qualifier: dominant,
        offset,
        total: allValues.length,
        hasMore: offset + limit < allValues.length,
        values: page.map((v) => {
          const entry: Record<string, unknown> = { t: v.dateTime, v: Number(v.value) };
          if (JSON.stringify(v.qualifiers) !== domKey) entry.q = v.qualifiers;
          return entry;
        }),
      },
    };
  });
}

export interface StreamflowOptions {
  sites: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  offset?: number;
  limit?: number;
}

const DEFAULT_LIMIT = 200;

export async function getStreamflow(opts: StreamflowOptions): Promise<unknown> {
  const params: Record<string, string> = {
    sites: opts.sites,
    parameterCd: STREAMFLOW_PARAM,
    format: "json",
  };

  if (opts.startDate) {
    params.startDT = opts.startDate;
    params.endDT = opts.endDate ?? new Date().toISOString().slice(0, 10);
  } else {
    params.period = opts.period ?? "P1D";
  }

  const raw = await nwisFetch("iv/", params);
  return trimStreamflowResponse(raw, opts.offset ?? 0, opts.limit ?? DEFAULT_LIMIT);
}

export interface SiteInfoOptions {
  sites: string;
}

export async function getSiteInfo(opts: SiteInfoOptions): Promise<unknown> {
  return nwisFetchRdb("site", {
    sites: opts.sites,
    siteOutput: "expanded",
    format: "rdb",
  });
}

export interface SiteStatsOptions {
  site: string;
  date?: string;
}

export async function getSiteStats(opts: SiteStatsOptions): Promise<unknown> {
  const dateStr = opts.date ?? new Date().toISOString().slice(0, 10);
  const [, monthPadded, dayPadded] = dateStr.split("-");
  // RDB stores month_nu/day_nu without leading zeros
  const month = String(Number(monthPadded));
  const day = String(Number(dayPadded));

  const rows = await nwisFetchRdb("stat/", {
    sites: opts.site,
    parameterCd: STREAMFLOW_PARAM,
    statReportType: "daily",
    statType: "all",
    format: "rdb",
  });

  // Each row covers one calendar day (month_nu + day_nu). Find the matching day.
  const match = rows.find(r => r.month_nu === month && r.day_nu === day);
  if (!match) {
    return { site: opts.site, date: dateStr, error: "No statistics found for this site or day." };
  }

  const toNum = (v: string) => (v === "" ? null : Number(v));
  return {
    site: opts.site,
    date: dateStr,
    dayOfYear: { month, day },
    recordYears: toNum(match.count_nu),
    statistics: {
      mean_cfs: toNum(match.mean_va),
      median_cfs: toNum(match.p50_va),
      percentiles: {
        p10: toNum(match.p10_va),
        p25: toNum(match.p25_va),
        p50: toNum(match.p50_va),
        p75: toNum(match.p75_va),
        p90: toNum(match.p90_va),
      },
      min_cfs: toNum(match.min_va),
      max_cfs: toNum(match.max_va),
    },
  };
}
