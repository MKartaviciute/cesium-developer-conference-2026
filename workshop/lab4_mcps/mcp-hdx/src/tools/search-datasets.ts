import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchDatasets } from "../hdx.js";

export function registerSearchDatasetsTool(server: McpServer): void {
  server.registerTool(
    "search_datasets",
    {
      description: "Search humanitarian datasets on HDX by keyword and optional filters",
      inputSchema: {
        q: z.string().describe("Keyword search term"),
        fq: z.string().optional().describe('SOLR filter query (e.g. \'groups:"syr"\' for Syria)'),
        rows: z.number().int().min(1).max(100).default(10).describe("Number of results to return (max 100)"),
        start: z.number().int().min(0).default(0).describe("Pagination offset"),
      },
    },
    async ({ q, fq, rows, start }) => {
      const result = await searchDatasets({ q, fq, rows, start });
      const pagination = result.has_more
        ? `Showing ${result.returned} of ${result.total} results (offset ${result.start}). Use start=${result.next_start} to fetch the next page.`
        : `Showing all ${result.returned} of ${result.total} results.`;
      return {
        content: [{ type: "text", text: `${pagination}\n\n${JSON.stringify(result.datasets)}` }],
      };
    },
  );
}
