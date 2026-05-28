/**
 * Typed fetch wrapper for the NOAA CDO (Climate Data Online) API v2.
 * Requires a token from https://www.ncei.noaa.gov/cdo-web/token
 * Docs: https://www.ncei.noaa.gov/cdo-web/webservices/v2
 */

const BASE = "https://www.ncei.noaa.gov/cdo-web/api/v2";

function getToken(): string {
  const token = process.env.CDO_TOKEN;
  if (!token) throw new Error("CDO_TOKEN environment variable is not set. Get a free token at https://www.ncei.noaa.gov/cdo-web/token");
  return token;
}

export interface CdoPage<T> {
  metadata: { resultset: { offset: number; count: number; limit: number } };
  results: T[];
}

export interface CdoDataset {
  uid: string;
  mindate: string;
  maxdate: string;
  name: string;
  datacoverage: number;
  id: string;
}

export interface CdoStation {
  elevation: number;
  mindate: string;
  maxdate: string;
  latitude: number;
  name: string;
  datacoverage: number;
  id: string;
  elevationUnit: string;
  longitude: number;
}

export interface CdoDataRecord {
  date: string;
  datatype: string;
  station: string;
  attributes: string;
  value: number;
}

async function cdoFetch<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]),
  );
  const url = `${BASE}${path}?${new URLSearchParams(filtered).toString()}`;
  const res = await fetch(url, { headers: { token: getToken() } });
  if (!res.ok) {
    throw new Error(`CDO API HTTP error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface GetDatasetsOptions {
  datatypeid?: string;
  locationid?: string;
  stationid?: string;
  startdate?: string;
  enddate?: string;
  limit?: number;
  offset?: number;
}

export async function getDatasets(opts: GetDatasetsOptions = {}): Promise<CdoPage<CdoDataset>> {
  return cdoFetch<CdoPage<CdoDataset>>("/datasets", {
    datatypeid: opts.datatypeid,
    locationid: opts.locationid,
    stationid: opts.stationid,
    startdate: opts.startdate,
    enddate: opts.enddate,
    limit: opts.limit ?? 25,
    offset: opts.offset,
  });
}

export interface GetStationsOptions {
  datasetid?: string;
  locationid?: string;
  datatypeid?: string;
  extent?: string;
  startdate?: string;
  enddate?: string;
  limit?: number;
  offset?: number;
}

export async function getStations(opts: GetStationsOptions = {}): Promise<CdoPage<CdoStation>> {
  return cdoFetch<CdoPage<CdoStation>>("/stations", {
    datasetid: opts.datasetid,
    locationid: opts.locationid,
    datatypeid: opts.datatypeid,
    extent: opts.extent,
    startdate: opts.startdate,
    enddate: opts.enddate,
    limit: opts.limit ?? 25,
    offset: opts.offset,
  });
}

export interface GetDataOptions {
  datasetid: string;
  datatypeid?: string;
  locationid?: string;
  stationid?: string;
  startdate: string;
  enddate: string;
  units?: "standard" | "metric";
  limit?: number;
  offset?: number;
  includemetadata?: boolean;
}

export async function getData(opts: GetDataOptions): Promise<CdoPage<CdoDataRecord>> {
  return cdoFetch<CdoPage<CdoDataRecord>>("/data", {
    datasetid: opts.datasetid,
    datatypeid: opts.datatypeid,
    locationid: opts.locationid,
    stationid: opts.stationid,
    startdate: opts.startdate,
    enddate: opts.enddate,
    units: opts.units,
    limit: opts.limit ?? 1000,
    offset: opts.offset,
    includemetadata: opts.includemetadata === false ? "false" : "true",
  });
}
