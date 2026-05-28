import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Database from "better-sqlite3";
import { isDbIndexed, getDbPath } from "../db.js";

export function registerGeocodeAddressTool(server: McpServer): void {
  server.registerTool(
    "geocode_address",
    {
      description:
        "Text-search for addresses in an already-indexed OpenAddresses collection. " +
        "Performs a case-insensitive substring match on the concatenated number, street, and city fields. " +
        "Returns an error if the collection has not been indexed yet (call query_addresses_by_bbox first).",
      inputSchema: {
        collection_id: z
          .string()
          .describe("Collection id — must already be indexed"),
        q: z
          .string()
          .describe(
            "Case-insensitive substring to search in NUMBER + STREET + CITY"
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .default(20)
          .optional()
          .describe("Maximum number of results (default 20, max 200)"),
      },
    },
    async ({ collection_id, q, limit = 20 }) => {
      let dbPath: string;
      try { dbPath = getDbPath(collection_id); }
      catch { return { content: [{ type: "text", text: JSON.stringify({ error: "Invalid collection_id" }) }] }; }

      if (!isDbIndexed(collection_id)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Collection '${collection_id}' is not indexed. Call query_addresses_by_bbox first to trigger indexing.`,
              }),
            },
          ],
        };
      }

      const db = new Database(dbPath, { readonly: true });
      try {
        const searchTerm = `%${q.toLowerCase()}%`;
        const rows = db
          .prepare(
            `SELECT lon, lat, number, street, city, region, postcode
             FROM addresses
             WHERE LOWER(COALESCE(number,'') || ' ' || COALESCE(street,'') || ' ' || COALESCE(city,'')) LIKE ?
             LIMIT ?`
          )
          .all(searchTerm, limit) as {
          lon: number;
          lat: number;
          number: string;
          street: string;
          city: string;
          region: string;
          postcode: string;
        }[];
        return {
          content: [{ type: "text", text: JSON.stringify(rows) }],
        };
      } finally {
        db.close();
      }
    }
  );
}
