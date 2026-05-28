import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDb, isReady } from "../db.js";

export function registerQueryCountriesTool(server: McpServer): void {
  server.registerTool(
    "query_countries",
    {
      description:
        "Find country features in Natural Earth admin_0_countries layers. Returns name, iso_a2, continent, pop_est.",
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe("Case-insensitive substring match on NAME"),
        iso_a2: z
          .string()
          .optional()
          .describe("Exact match on ISO_A2 country code (e.g. 'US', 'DE')"),
        scale: z
          .enum(["10m", "50m", "110m"])
          .optional()
          .describe("Map scale (default: 110m)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Maximum rows to return (default 20, max 200)"),
      },
    },
    async ({ name, iso_a2, scale, limit }) => {
      if (!isReady()) {
        return {
          content: [{ type: "text", text: "data initialising — retry in a moment" }],
        };
      }

      const db = getDb()!;
      const resolvedScale = scale ?? "110m";
      const resolvedLimit = limit ?? 20;
      const table = `ne_${resolvedScale}_admin_0_countries`;

      // Validate the table exists in gpkg_contents
      const exists = db
        .prepare("SELECT 1 FROM gpkg_contents WHERE table_name = ?")
        .get(table);
      if (!exists) {
        return {
          content: [
            {
              type: "text",
              text: `Table '${table}' not found in GeoPackage. Try a different scale.`,
            },
          ],
        };
      }

      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (name) {
        conditions.push("UPPER(NAME) LIKE UPPER(?)");
        params.push(`%${name}%`);
      }
      if (iso_a2) {
        conditions.push("ISO_A2 = ?");
        params.push(iso_a2.toUpperCase());
      }

      const where =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const sql = `SELECT NAME as name, ISO_A2 as iso_a2, CONTINENT as continent, POP_EST as pop_est FROM "${table}" ${where} LIMIT ?`;
      params.push(resolvedLimit);

      const rows = db.prepare(sql).all(...(params as unknown[]));
      return {
        content: [{ type: "text", text: JSON.stringify(rows) }],
      };
    },
  );
}
