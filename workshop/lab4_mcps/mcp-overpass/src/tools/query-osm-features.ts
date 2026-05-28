import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryOverpass } from "../overpass.js";

export function registerQueryOsmFeaturesTool(server: McpServer): void {
  server.registerTool(
    "query_osm_features",
    {
      description:
        "Execute an Overpass QL query against OpenStreetMap and return results as JSON. Always outputs JSON regardless of query directives. Raw geometry arrays and member node-ID arrays are stripped from elements; use the 'center' field on ways/relations for coordinates.",
      inputSchema: {
        overpass_ql: z.string().describe("A complete Overpass QL query string"),
        timeout: z
          .number()
          .int()
          .min(1)
          .max(60)
          .optional()
          .default(25)
          .describe("Timeout in seconds for the Overpass query (max 60)"),
      },
    },
    async ({ overpass_ql, timeout }) => {
      // Ensure [out:json] is present — Overpass ignores HTTP Accept headers for format selection
      let query = overpass_ql;
      if (!/\[out:json\]/.test(query)) {
        query = `[out:json];\n${query}`;
      }

      // Ensure [timeout:N] directive is present
      if (!/\[timeout:\d+\]/.test(query)) {
        query = `[timeout:${timeout}];\n${query}`;
      } else {
        query = query.replace(/\[timeout:\d+\]/, `[timeout:${timeout}]`);
      }

      let data: { elements?: Record<string, unknown>[] };
      try {
        data = (await queryOverpass(query)) as { elements?: Record<string, unknown>[] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Overpass query failed: ${(err as Error).message}` }],
          isError: true,
        };
      }

      // Strip raw geometry arrays — they bloat the response without adding semantic value.
      // `center` on ways/relations already provides a usable coordinate.
      for (const el of data.elements ?? []) {
        delete el["nodes"];
        delete el["geometry"];
      }
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
      };
    },
  );
}
