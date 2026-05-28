import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryWithTimeout, DIVISIONS_URL, isReady } from "../duckdb-client.js";

export function registerQueryAdminDivisionsTool(server: McpServer): void {
  server.registerTool(
    "query_admin_divisions",
    {
      description:
        "Query Overture Maps administrative division areas. Filter by name substring and/or ISO-2 country code.",
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe("Substring filter on division name (case-insensitive)"),
        country: z
          .string()
          .optional()
          .describe("ISO-2 country code filter (e.g. 'US', 'DE')"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Maximum rows to return (default 50, max 200)"),
      },
    },
    async ({ name, country, limit }) => {
      if (!isReady()) {
        return {
          content: [
            { type: "text", text: "DuckDB initialising — retry in a moment" },
          ],
        };
      }

      const resolvedLimit = limit ?? 50;
      const conditions: string[] = [];

      if (name) {
        conditions.push(
          `lower(names.primary) LIKE lower('%${name.replace(/'/g, "''")}%')`,
        );
      }
      if (country) {
        conditions.push(`country = '${country.toUpperCase().replace(/'/g, "''")}'`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const sql = `
        SELECT
          id,
          country,
          subtype,
          names.primary AS name
        FROM read_parquet('${DIVISIONS_URL}', hive_partitioning=false)
        ${whereClause}
        LIMIT ${resolvedLimit}
      `;

      try {
        const rows = await queryWithTimeout(sql);
        return { content: [{ type: "text", text: JSON.stringify(rows) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: `Error querying admin divisions: ${msg}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
