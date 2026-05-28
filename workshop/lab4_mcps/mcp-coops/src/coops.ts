/**
 * Typed fetch wrapper for the NOAA CO-OPS (Tides and Currents) Data API.
 * No API key required. Docs: https://api.tidesandcurrents.noaa.gov/api/prod/
 */

const BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

export type Units = "english" | "metric";
export type TimeZone = "GMT" | "LST" | "LST/LDT";
export type Datum = "MLLW" | "MHHW" | "MHW" | "MLW" | "MSL" | "MTL" | "NAVD" | "STND";
export type WaterLevelInterval = "6" | "h";
export type PredictionInterval = "hilo" | "h" | "6";
export type MetInterval = "6" | "h";
export type MetProduct =
  | "air_temperature"
  | "water_temperature"
  | "wind"
  | "air_pressure"
  | "humidity";

export interface WaterLevelReading {
  t: string;
  v: string;
  s: string;
  q: string;
}

export interface WaterLevelResponse {
  stationId: string;
  stationName: string;
  datum: string;
  units: string;
  data: WaterLevelReading[];
}

export interface TidePrediction {
  t: string;
  v: string;
  type?: string;
}

export interface TidePredictionsResponse {
  stationId: string;
  stationName: string;
  datum: string;
  units: string;
  predictions: TidePrediction[];
}

export interface ObservationReading {
  t: string;
  v: string;
  s?: string;
  d?: string;
  g?: string;
}

export interface StationObservationsResponse {
  stationId: string;
  stationName: string;
  product: string;
  units: string;
  data: ObservationReading[];
}

interface CoopsParams {
  station: string;
  product: string;
  begin_date: string;
  end_date: string;
  datum?: string;
  interval?: string;
  time_zone: string;
  units: string;
  format: "json";
  application: string;
}

// CO-OPS API requires lowercase time zone values with underscores (gmt, lst, lst_ldt)
function normalizeTimeZone(tz: string): string {
  return tz.toLowerCase().replace("/", "_");
}

async function fetchCoops<T>(params: CoopsParams): Promise<T> {
  const filtered = Object.fromEntries(
    Object.entries({ ...params, time_zone: normalizeTimeZone(params.time_zone) }).filter(([, v]) => v !== undefined),
  ) as Record<string, string>;
  const url = `${BASE}?${new URLSearchParams(filtered).toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CO-OPS API HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  if (json["error"]) {
    const err = json["error"] as { message?: string };
    throw new Error(`CO-OPS API error: ${err.message ?? JSON.stringify(json["error"])}`);
  }
  return json as T;
}

export async function getWaterLevel(
  station: string,
  beginDate: string,
  endDate: string,
  datum: Datum,
  interval: WaterLevelInterval,
  units: Units,
  timeZone: TimeZone,
): Promise<WaterLevelResponse> {
  const raw = await fetchCoops<{
    metadata: { id: string; name: string };
    data: WaterLevelReading[];
  }>({
    station,
    product: "water_level",
    begin_date: beginDate,
    end_date: endDate,
    datum,
    interval,
    time_zone: timeZone,
    units,
    format: "json",
    application: "cesium-ai",
  });
  return {
    stationId: raw.metadata.id,
    stationName: raw.metadata.name,
    datum,
    units,
    data: raw.data,
  };
}

export async function getTidePredictions(
  station: string,
  beginDate: string,
  endDate: string,
  datum: Datum,
  interval: PredictionInterval,
  units: Units,
  timeZone: TimeZone,
): Promise<TidePredictionsResponse> {
  const raw = await fetchCoops<{
    metadata?: { id: string; name: string };
    predictions: TidePrediction[];
  }>({
    station,
    product: "predictions",
    begin_date: beginDate,
    end_date: endDate,
    datum,
    interval,
    time_zone: timeZone,
    units,
    format: "json",
    application: "cesium-ai",
  });
  return {
    stationId: raw.metadata?.id ?? station,
    stationName: raw.metadata?.name ?? station,
    datum,
    units,
    predictions: raw.predictions,
  };
}

export async function getStationObservations(
  station: string,
  product: MetProduct,
  beginDate: string,
  endDate: string,
  units: Units,
  timeZone: TimeZone,
  interval: MetInterval = "h",
): Promise<StationObservationsResponse> {
  const raw = await fetchCoops<{
    metadata: { id: string; name: string };
    data: ObservationReading[];
  }>({
    station,
    product,
    begin_date: beginDate,
    end_date: endDate,
    interval,
    time_zone: timeZone,
    units,
    format: "json",
    application: "cesium-ai",
  });
  return {
    stationId: raw.metadata.id,
    stationName: raw.metadata.name,
    product,
    units,
    data: raw.data,
  };
}
