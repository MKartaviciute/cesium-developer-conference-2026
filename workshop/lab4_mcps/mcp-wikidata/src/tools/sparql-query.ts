import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sparqlQuery } from "../wikidata-client.js";

function injectPagination(query: string, limit: number, offset: number): string {
  let q = query.trim();
  if (!/\blimit\s+\d+/i.test(q)) q += `\nLIMIT ${limit}`;
  if (offset > 0 && !/\boffset\s+\d+/i.test(q)) q += `\nOFFSET ${offset}`;
  return q;
}

export function registerSparqlQueryTool(server: McpServer): void {
  server.registerTool(
    "sparql_query",
    {
      description: "Execute a SPARQL SELECT query against the Wikidata Query Service. Use limit+offset for pagination.",
      inputSchema: {
        query: z.string().describe("Complete SPARQL SELECT query"),
        limit: z.number().int().min(1).max(1000).optional().describe("Max results per page (default 100)"),
        offset: z.number().int().min(0).optional().describe("Number of results to skip for pagination (default 0)"),
      },
    },
    async ({ query, limit, offset }) => {
      const effectiveLimit = limit ?? 100;
      const effectiveOffset = offset ?? 0;
      const finalQuery = injectPagination(query, effectiveLimit, effectiveOffset);

      const data = await sparqlQuery(finalQuery) as { results: { bindings: unknown[] } };
      const bindings = data.results.bindings;
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            results: bindings,
            count: bindings.length,
            hasMore: bindings.length === effectiveLimit,
            offset: effectiveOffset,
          }),
        }],
      };
    },
  );
}
