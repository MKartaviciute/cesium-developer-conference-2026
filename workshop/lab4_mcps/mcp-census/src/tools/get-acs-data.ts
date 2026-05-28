import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buildAcsUrl, fetchCensusData } from "../census.js";

export function registerGetAcsDataTool(server: McpServer): void {
  server.registerTool(
    "get_acs_data",
    {
      description:
        "Fetch American Community Survey (ACS) 5-year estimates from the US Census Bureau.",
      inputSchema: {
        variables: z
          .array(z.string())
          .describe('Variable codes to retrieve (e.g. ["B01001_001E", "NAME"])'),
        geography: z
          .string()
          .describe('Census geography predicate (e.g. "county:*", "state:*", "tract:*")'),
        state: z
          .string()
          .optional()
          .describe('State FIPS code to scope tract/county queries (e.g. "06" for CA)'),
        year: z
          .number()
          .int()
          .optional()
          .default(2022)
          .describe("ACS 5-year estimate year (default 2022)"),
        limit: z
          .number()
          .int()
          .optional()
          .default(500)
          .describe("Maximum number of rows to return (default 500). Use with offset to page through large geographies like tracts."),
        offset: z
          .number()
          .int()
          .optional()
          .default(0)
          .describe("Number of rows to skip for pagination (default 0). The header row is always included and does not count toward offset."),
      },
    },
    async ({ variables, geography, state, year, limit, offset }) => {
      const y = year ?? 2022;
      const lim = limit ?? 500;
      const off = offset ?? 0;
      const url = buildAcsUrl(y, variables, geography, state);
      const data = await fetchCensusData(url) as unknown[][];
      const [header, ...rows] = data;
      const page = rows.slice(off, off + lim);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ total: rows.length, offset: off, limit: lim, data: [header, ...page] }),
        }],
      };
    },
  );
}
