import { z } from "zod";

const isoDatetime = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Must be a valid ISO 8601 date or datetime",
  });

const earthquakeFilterFields = {
  starttime: isoDatetime
    .optional()
    .describe("Start of time range in ISO 8601 format (e.g. 2024-01-01T00:00:00). Defaults to 30 days ago."),
  endtime: isoDatetime
    .optional()
    .describe("End of time range in ISO 8601 format (e.g. 2024-01-02T00:00:00). Defaults to now."),
  minmagnitude: z.number().optional().describe("Minimum magnitude (inclusive)"),
  maxmagnitude: z.number().optional().describe("Maximum magnitude (inclusive)"),
  mindepth: z.number().optional().describe("Minimum depth in kilometers (inclusive)"),
  maxdepth: z.number().optional().describe("Maximum depth in kilometers (inclusive)"),
  minlatitude: z.number().min(-90).max(90).optional().describe("Minimum latitude of bounding box in decimal degrees"),
  maxlatitude: z.number().min(-90).max(90).optional().describe("Maximum latitude of bounding box in decimal degrees"),
  minlongitude: z.number().min(-360).max(360).optional().describe("Minimum longitude of bounding box in decimal degrees"),
  maxlongitude: z.number().min(-360).max(360).optional().describe("Maximum longitude of bounding box in decimal degrees"),
};

export const earthquakeFilterInputFields = {
  ...earthquakeFilterFields,
};

export const earthquakeInputFields = {
  ...earthquakeFilterFields,
  limit: z.number().int().min(1).max(500).optional()
    .describe("Number of events to return per page (1–500, default 100)."),
  offset: z.number().int().min(0).optional()
    .describe("Zero-based index of the first event to return. Increment by limit to page through results."),
};

export const MAX_DATE_RANGE_DAYS = 366;

export function assertDateRange(starttime?: string, endtime?: string): void {
  if (!starttime || !endtime) return;
  const diffDays = (new Date(endtime).getTime() - new Date(starttime).getTime()) / 86_400_000;
  if (diffDays > MAX_DATE_RANGE_DAYS) {
    throw new Error(`Date range may not exceed ${MAX_DATE_RANGE_DAYS} days`);
  }
}
