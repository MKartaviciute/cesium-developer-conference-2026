/**
 * Typed fetch wrapper for the Open-Meteo REST API.
 * No API key required. Throws on non-2xx responses.
 */

const BASE = "https://api.open-meteo.com/v1";

export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  is_day: number;
  time: string;
}

export interface CurrentWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current_weather: CurrentWeather;
}

export interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  weathercode: number[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: DailyForecast;
}

export interface HistoricalDailyData {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
}

export interface HistoricalWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: HistoricalDailyData;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch current weather conditions at a geographic coordinate.
 */
export function getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeatherResponse> {
  const url =
    `${BASE}/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current_weather=true&wind_speed_unit=ms`;
  return fetchJson<CurrentWeatherResponse>(url);
}

/**
 * Fetch a multi-day weather forecast at a geographic coordinate.
 * @param days - Number of forecast days (1–16)
 */
export function getForecast(latitude: number, longitude: number, days: number): Promise<ForecastResponse> {
  const url =
    `${BASE}/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
    `&forecast_days=${days}&timezone=auto`;
  return fetchJson<ForecastResponse>(url);
}

/**
 * Fetch historical daily weather for a date range.
 * @param start_date - Start date in YYYY-MM-DD format
 * @param end_date - End date in YYYY-MM-DD format
 */
export function getHistoricalWeather(
  latitude: number,
  longitude: number,
  start_date: string,
  end_date: string,
): Promise<HistoricalWeatherResponse> {
  const url =
    `${BASE}/archive?latitude=${latitude}&longitude=${longitude}` +
    `&start_date=${start_date}&end_date=${end_date}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  return fetchJson<HistoricalWeatherResponse>(url);
}
