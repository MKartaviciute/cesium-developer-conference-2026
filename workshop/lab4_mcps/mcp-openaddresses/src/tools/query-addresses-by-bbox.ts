import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Database from "better-sqlite3";
import { getDbPath } from "../db.js";
import { isDbIndexed, isIndexingInProgress, getIndexingError, startIndexing } from "../indexer.js";

export function registerQueryAddressesByBboxTool(server: McpServer): void {
  server.registerTool(
    "query_addresses_by_bbox",
    {
      description:
        "Find address points within a bounding box for a given OpenAddresses collection. " +
        "On the first call for a collection the server will download and index it; while that " +
        "is running the tool returns a retry message. Subsequent calls query the local R-tree cache.",
      inputSchema: {
        collection_id: z
          .string()
          .describe("Collection id from list_collections"),
        bbox: z
          .string()
          .describe(
            "Bounding box as 'minLon,minLat,maxLon,maxLat' (WGS-84 decimal degrees)"
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(2000)
          .default(100)
          .optional()
          .describe("Maximum number of results (default 100, max 2000)"),
      },
    },
    async ({ collection_id, bbox, limit = 100 }) => {
      let dbPath: string;
      try { dbPath = getDbPath(collection_id); }
      catch { return { content: [{ type: "text", text: JSON.stringify({ error: "Invalid collection_id" }) }] }; }

      // Parse and validate bbox
      const parts = bbox.split(",").map(Number);
      if (parts.length !== 4 || parts.some(Number.isNaN)) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "bbox must be 'minLon,minLat,maxLon,maxLat'" }) }],
        };
      }
      const [minLon, minLat, maxLon, maxLat] = parts as [number, number, number, number];
      if (minLon >= maxLon || minLat >= maxLat ||
          minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
        return {
          content: [{ type: "text", text: JSON.stringify({
            error: "bbox values out of range or inverted — expected minLon < maxLon, minLat < maxLat, within WGS-84 bounds",
          }) }],
        };
      }

      // Trigger indexing if needed
      if (!isDbIndexed(collection_id)) {
        const prevError = getIndexingError(collection_id);
        if (prevError) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: `Indexing failed: ${prevError}` }) }],
          };
        }
        if (!isIndexingInProgress(collection_id)) {
          // Fire-and-forget — caller can retry
          startIndexing(collection_id).catch((err: unknown) => {
            console.error(`Indexing error for ${collection_id}:`, err);
          });
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "indexing_in_progress",
                message: "Indexing in progress — retry in a moment",
              }),
            },
          ],
        };
      }

      const db = new Database(dbPath, { readonly: true });
      try {
        const rows = db
          .prepare(
            `SELECT a.lon, a.lat, a.number, a.street, a.city, a.region, a.postcode
             FROM addr_rtree r
             JOIN addresses a ON a.id = r.id
             WHERE r.maxLon >= ? AND r.minLon <= ?
               AND r.maxLat >= ? AND r.minLat <= ?
             LIMIT ?`
          )
          .all(minLon, maxLon, minLat, maxLat, limit) as {
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
