import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchGdelt } from "../gdelt.js";
import { FIPS_COUNTRY_CODES, GDELT_THEMES, buildQuery } from "../gdelt-query.js";

export function registerSearchArticlesTool(server: McpServer): void {
  server.registerTool(
    "search_articles",
    {
      description:
        "Search global news articles via the GDELT DOC 2.0 API. " +
        "Use 'themes' for event/disaster types — e.g. flooding → ENV_FLOOD, earthquake → ENV_EARTHQUAKE, wildfire → ENV_WILDFIRE. " +
        "Use 'countries' for geographic filtering — " +
        "e.g. Southeast Asia → [TH, VM, RP, ID, MY, BM, CB, LA, SN], " +
        "Middle East → [IZ, SY, SA, IR, IS, JO, YM, EG, TU], " +
        "South Asia → [IN, PK, BG, AF], " +
        "Europe → [UK, FR, GM, IT, SP, PL, RS, UP]. " +
        "The server constructs the correct GDELT boolean syntax automatically.",
      inputSchema: {
        countries: z
          .array(z.enum(FIPS_COUNTRY_CODES))
          .optional()
          .describe(
            "FIPS 10-4 country codes to filter by source country. " +
            "Region shortcuts — Southeast Asia: [TH, VM, RP, ID, MY, BM, CB, LA, SN]; " +
            "Middle East: [IZ, SY, SA, IR, IS, JO, YM, EG, TU]; " +
            "South Asia: [IN, PK, BG, AF]; " +
            "Europe: [UK, FR, GM, IT, SP, PL, RS, UP]; " +
            "Latin America: [MX, BR, AR, CO].",
          ),
        themes: z
          .array(z.enum(GDELT_THEMES))
          .optional()
          .describe("GDELT GKG theme codes for precise topic filtering."),
        language: z
          .string()
          .optional()
          .describe('Source language filter (e.g. "english", "spanish", "french"). Omit to include all languages.'),
        mode: z
          .enum(["ArtList", "ArtGallery"])
          .optional()
          .default("ArtList")
          .describe('Result format: "ArtList" (default) or "ArtGallery".'),
        timespan: z
          .string()
          .optional()
          .describe('Lookback window (e.g. "24h", "7d", "1m"). Mutually exclusive with startdatetime/enddatetime.'),
        startdatetime: z
          .string()
          .optional()
          .describe("Start datetime in YYYYMMDDHHMMSS format"),
        enddatetime: z
          .string()
          .optional()
          .describe("End datetime in YYYYMMDDHHMMSS format"),
        maxrecords: z
          .number()
          .int()
          .min(1)
          .max(250)
          .optional()
          .default(10)
          .describe("Maximum number of records to return (default 10, max 250)"),
      },
    },
    async ({ countries, themes, language, mode, timespan, startdatetime, enddatetime, maxrecords }) => {
      const query = buildQuery(countries ?? [], themes ?? [], language);
      if (!query.trim()) {
        throw new Error("At least one of countries or themes must be provided.");
      }

      const params: Record<string, string> = {
        query,
        mode: mode ?? "ArtList",
        format: "json",
        maxrecords: String(maxrecords ?? 10),
      };
      if (timespan) {
        params["timespan"] = timespan;
      } else {
        if (startdatetime) params["startdatetime"] = startdatetime;
        if (enddatetime) params["enddatetime"] = enddatetime;
      }

      const data = await fetchGdelt(params);
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    },
  );
}
