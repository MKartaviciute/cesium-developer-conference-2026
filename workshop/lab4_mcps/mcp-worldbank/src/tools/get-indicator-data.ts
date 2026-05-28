import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { worldBankGet } from "../worldbank-client.js";

export function registerGetIndicatorDataTool(server: McpServer): void {
  server.registerTool(
    "get_indicator_data",
    {
      description: "Fetch time-series observations for a World Bank indicator",
      inputSchema: {
        indicator: z.string().describe("Indicator code (e.g. 'SP.POP.TOTL', 'NY.GDP.MKTP.CD')"),
        country: z.string().optional().describe("ISO2 country code or 'all' for all countries (default 'all')"),
        date: z.string().optional().describe("Single year 'YYYY' or range 'YYYY:YYYY', defaults to last 10 years"),
        per_page: z.number().int().min(1).max(100).optional().describe("Number of results per page, default 100, max 100"),
        page: z.number().int().min(1).optional().describe("Page number for pagination, default 1"),
      },
    },
    async ({ indicator, country, date, per_page, page }) => {
      const countryCode = country ?? "all";
      const params: Record<string, string> = {
        per_page: String(per_page ?? 100),
        page: String(page ?? 1),
      };
      if (date) params.date = date;

      const data = await worldBankGet(`/country/${countryCode}/indicator/${indicator}`, params) as [{ page: number; pages: number; per_page: number; total: number; lastupdated?: string }, unknown[]];
      const raw = Array.isArray(data) && data.length > 0 ? data[0] : null;
      const observations = Array.isArray(data) && data.length > 1 ? data[1] : data;
      const pagination = raw ? { ...raw, hasMore: raw.page < raw.pages } : null;
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ pagination, data: observations }) }],
      };
    },
  );
}
