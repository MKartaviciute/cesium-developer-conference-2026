import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDb, isReady } from "../db.js";

interface ColumnInfo {
  name: string;
  type: string;
  pk: number;
}

export function registerQueryFeaturesTool(server: McpServer): void {
  server.registerTool(
    "query_features",
    {
      description:
        "Query any Natural Earth layer by its exact GeoPackage table name with an optional bounding box filter. " +
        "Before specifying 'fields', call list_layers (or omit 'fields' on a first call) to discover the available column names for the target table — requesting an unknown or geometry column will return an error.",
      inputSchema: {
        table: z
          .string()
          .describe(
            "Exact GeoPackage table name (e.g. ne_10m_rivers_lake_centerlines). Use list_layers to see all names.",
          ),
        bbox: z
          .string()
          .optional()
          .describe(
            "Bounding box filter as 'minLon,minLat,maxLon,maxLat' (WGS-84 decimal degrees)",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .describe("Maximum rows to return (default 50, max 500)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of rows to skip for pagination (default 0)"),
        count: z
          .boolean()
          .optional()
          .describe("When true, return only the total matching row count instead of data"),
        fields: z
          .array(z.string())
          .optional()
          .describe(
            "Column names to return (e.g. ['NAME','POP_EST','CONTINENT']). " +
            "IMPORTANT: check available columns first by calling list_layers or by omitting this field on an initial query — unknown or geometry column names will cause an error.",
          ),
      },
    },
    async ({ table, bbox, limit, offset, count, fields }) => {
      if (!isReady()) {
        return {
          content: [{ type: "text", text: "data initialising — retry in a moment" }],
        };
      }

      const db = getDb()!;
      const resolvedLimit = limit ?? 50;
      const resolvedOffset = offset ?? 0;

      // Validate table exists in gpkg_contents (prevents SQL injection via table name)
      const exists = db
        .prepare("SELECT 1 FROM gpkg_contents WHERE table_name = ?")
        .get(table);
      if (!exists) {
        return {
          content: [
            {
              type: "text",
              text: `Table '${table}' not found. Use list_layers to see available layers.`,
            },
          ],
        };
      }

      // Discover geometry column name for this table
      const geomRow = db
        .prepare(
          "SELECT column_name FROM gpkg_geometry_columns WHERE table_name = ?",
        )
        .get(table) as { column_name: string } | undefined;
      const geomCol = geomRow?.column_name;

      // Get all column info and exclude geometry/blob columns
      const cols = db
        .prepare(`PRAGMA table_info("${table}")`)
        .all() as ColumnInfo[];
      const allowedNames = new Set(
        cols
          .filter(
            (c) =>
              c.name !== geomCol &&
              c.type.toUpperCase() !== "BLOB" &&
              !["geom", "geometry"].includes(c.name.toLowerCase()),
          )
          .map((c) => c.name),
      );

      const requestedFields = fields && fields.length > 0 ? fields : undefined;
      if (requestedFields) {
        const unknown = requestedFields.filter((f) => !allowedNames.has(f));
        if (unknown.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `Unknown or geometry field(s): ${unknown.join(", ")}. Use list_layers or omit 'fields' to see available columns.`,
              },
            ],
          };
        }
      }

      const selectCols = (requestedFields ?? [...allowedNames]).map(
        (name) => `t."${name}"`,
      );

      if (selectCols.length === 0) {
        return {
          content: [{ type: "text", text: "No non-geometry columns found in table." }],
        };
      }

      const params: (string | number)[] = [];
      let sql: string;
      let countSql: string;
      const countParams: (string | number)[] = [];

      if (bbox && geomCol) {
        const parts = bbox.split(",").map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) {
          return {
            content: [
              {
                type: "text",
                text: "Invalid bbox format. Expected 'minLon,minLat,maxLon,maxLat'.",
              },
            ],
          };
        }
        const [minLon, minLat, maxLon, maxLat] = parts;

        // Try GeoPackage R-tree index for spatial filtering
        const rtreeTable = `rtree_${table}_${geomCol}`;
        const rtreeExists = db
          .prepare(
            "SELECT 1 FROM sqlite_master WHERE type IN ('table','shadow') AND name = ?",
          )
          .get(rtreeTable);

        if (rtreeExists) {
          // Find primary key column
          const pkCol = cols.find((c) => c.pk === 1)?.name ?? "fid";
          const whereClause = `FROM "${table}" t INNER JOIN "${rtreeTable}" r ON t."${pkCol}" = r.id WHERE r.minx <= ? AND r.maxx >= ? AND r.miny <= ? AND r.maxy >= ?`;
          countSql = `SELECT COUNT(*) AS total ${whereClause}`;
          countParams.push(maxLon, minLon, maxLat, minLat);
          sql = `SELECT ${selectCols.join(", ")} ${whereClause} LIMIT ? OFFSET ?`;
          params.push(maxLon, minLon, maxLat, minLat, resolvedLimit, resolvedOffset);
        } else {
          // Fall back to unfiltered (no spatial index available)
          countSql = `SELECT COUNT(*) AS total FROM "${table}" t`;
          sql = `SELECT ${selectCols.join(", ")} FROM "${table}" t LIMIT ? OFFSET ?`;
          params.push(resolvedLimit, resolvedOffset);
        }
      } else {
        countSql = `SELECT COUNT(*) AS total FROM "${table}" t`;
        sql = `SELECT ${selectCols.join(", ")} FROM "${table}" t LIMIT ? OFFSET ?`;
        params.push(resolvedLimit, resolvedOffset);
      }

      if (count) {
        const result = db.prepare(countSql).get(...(countParams as unknown[])) as { total: number };
        return {
          content: [{ type: "text", text: JSON.stringify({ total: result.total }) }],
        };
      }

      const rows = db.prepare(sql).all(...(params as unknown[]));
      const json = JSON.stringify(rows);
      const MAX_CHARS = 50_000;
      if (json.length > MAX_CHARS) {
        return {
          content: [
            {
              type: "text",
              text:
                `Response too large (${json.length.toLocaleString()} chars). ` +
                `Use the 'fields' parameter to select only the columns you need (e.g. ["name","scalerank","featurecla"]), ` +
                `or reduce 'limit'.`,
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: json }],
      };
    },
  );
}
