/**
 * Typed fetch wrapper for the NOAA National Weather Service REST API.
 * No API key required. NWS requires a User-Agent header identifying the app.
 * Docs: https://www.weather.gov/documentation/services-web-api
 */

const BASE = "https://api.weather.gov";
const USER_AGENT = "cesium-ai-workshop/1.0";

export interface PointMetadata {
  gridId: string;
  gridX: number;
  gridY: number;
  city: string;
  state: string;
  timeZone: string;
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
}

export interface ForecastResponse {
  updated: string;
  periods: ForecastPeriod[];
}

export interface HourlyPeriod {
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  probabilityOfPrecipitation: { value: number | null };
}

export interface HourlyForecastResponse {
  updated: string;
  periods: HourlyPeriod[];
}

export interface Alert {
  id: string;
  event: string;
  severity: string;
  urgency: string;
  certainty: string;
  headline: string;
  description: string;
  instruction: string | null;
  effective: string;
  expires: string;
  areaDesc: string;
}

export interface AlertsResponse {
  alerts: Alert[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
  });
  if (!res.ok) {
    throw new Error(`NWS API error ${res.status} for ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Resolve a lat/lon to NWS grid metadata (office, gridX, gridY).
 * Required before calling forecast endpoints.
 */
export async function getPointMetadata(latitude: number, longitude: number): Promise<PointMetadata> {
  const data = await fetchJson<{ properties: Record<string, unknown> }>(
    `/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  );
  const p = data.properties;
  const rz = (p.relativeLocation as { properties: Record<string, unknown> }).properties;
  return {
    gridId: p.gridId as string,
    gridX: p.gridX as number,
    gridY: p.gridY as number,
    city: rz.city as string,
    state: rz.state as string,
    timeZone: p.timeZone as string,
  };
}

/**
 * Fetch the 7-day (14-period) forecast for a lat/lon.
 */
export async function getForecast(latitude: number, longitude: number): Promise<ForecastResponse> {
  const { gridId, gridX, gridY } = await getPointMetadata(latitude, longitude);
  const data = await fetchJson<{ properties: Record<string, unknown> }>(
    `/gridpoints/${gridId}/${gridX},${gridY}/forecast`,
  );
  const p = data.properties;
  return {
    updated: p.updated as string,
    periods: p.periods as ForecastPeriod[],
  };
}

/**
 * Fetch the hourly forecast (next 156 hours) for a lat/lon.
 * @param hours - Limit results to the first N hours (default 24, max 156)
 */
export async function getHourlyForecast(
  latitude: number,
  longitude: number,
  hours: number,
): Promise<HourlyForecastResponse> {
  const { gridId, gridX, gridY } = await getPointMetadata(latitude, longitude);
  const data = await fetchJson<{ properties: Record<string, unknown> }>(
    `/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`,
  );
  const p = data.properties;
  const periods = (p.periods as HourlyPeriod[]).slice(0, hours);
  return { updated: p.updated as string, periods };
}

/**
 * Fetch active weather alerts for a lat/lon.
 */
export async function getActiveAlerts(latitude: number, longitude: number): Promise<AlertsResponse> {
  const data = await fetchJson<{ features: { properties: Record<string, unknown> }[] }>(
    `/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  );
  const alerts: Alert[] = data.features.map((f) => {
    const p = f.properties;
    return {
      id: p.id as string,
      event: p.event as string,
      severity: p.severity as string,
      urgency: p.urgency as string,
      certainty: p.certainty as string,
      headline: p.headline as string,
      description: p.description as string,
      instruction: p.instruction as string | null,
      effective: p.effective as string,
      expires: p.expires as string,
      areaDesc: p.areaDesc as string,
    };
  });
  return { alerts };
}
