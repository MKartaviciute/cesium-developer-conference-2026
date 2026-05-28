import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchGdelt } from "../gdelt.js";
import { FIPS_COUNTRY_CODES, GDELT_THEMES, buildQuery } from "../gdelt-query.js";

export function registerGetTimelineTool(server: McpServer): void {
  server.registerTool(
    "get_timeline",
    {
      description:
        "Get an article-volume timeline for a query using the GDELT DOC 2.0 API. " +
        "Use 'themes' for event/disaster types — e.g. flooding → ENV_FLOOD, earthquake → ENV_EARTHQUAKE, wildfire → ENV_WILDFIRE. " +
        "Use 'countries' for geographic filtering — " +
        "e.g. Southeast Asia → [TH, VM, RP, ID, MY, BM, CB, LA, SN], " +
        "Middle East → [IZ, SY, SA, IR, IS, JO, YM, EG, TU], " +
        "South Asia → [IN, PK, BG, AF], " +
        "Europe → [UK, FR, GM, IT, SP, PL, RS, UP]. " +
        "The server constructs the correct GDELT boolean syntax automatically. " +
        "Returns time-series data showing how media coverage of a topic changes over time.",
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
          .describe('Source language filter (e.g. "english", "spanish"). Omit to include all languages.'),
        mode: z
          .enum(["TimelineVol", "TimelineVolInfo", "TimelineTone"])
          .optional()
          .default("TimelineVol")
          .describe(
            'Timeline mode: "TimelineVol" (default) = article volume, "TimelineVolInfo" = volume with source info, "TimelineTone" = sentiment over time.',
          ),
        timespan: z
          .string()
          .optional()
          .describe('Lookback window (e.g. "7d", "1m", "3m").'),
      },
    },
    async ({ countries, themes, language, mode, timespan }) => {
      const query = buildQuery(countries ?? [], themes ?? [], language);
      if (!query.trim()) {
        throw new Error("At least one of countries or themes must be provided.");
      }

      const params: Record<string, string> = {
        query,
        mode: mode ?? "TimelineVol",
        format: "json",
      };
      if (timespan) {
        params["timespan"] = timespan;
      }

      const data = await fetchGdelt(params);
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    },
  );
}
