import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryEarthquakes } from "../earthquake-client.js";
import { earthquakeInputFields, assertDateRange } from "./shared-schema.js";

export function registerQueryEarthquakesTool(server: McpServer): void {
  server.registerTool(
    "query_earthquakes",
    {
      description:
        "Query seismic events from the USGS Earthquake Catalog. Returns event properties (magnitude, time, place) without geometry. Results are paginated — use limit (default 100, max 500) and offset to page through. Call get_earthquake_count first to know the total.",
      inputSchema: earthquakeInputFields,
    },
    async ({ starttime, endtime, minmagnitude, maxmagnitude, mindepth, maxdepth, minlatitude, maxlatitude, minlongitude, maxlongitude, limit, offset }) => {
      try {
        assertDateRange(starttime, endtime);
        const page = await queryEarthquakes({ starttime, endtime, minmagnitude, maxmagnitude, mindepth, maxdepth, minlatitude, maxlatitude, minlongitude, maxlongitude, limit, offset });
        const features = page.features.map((f: any) => {
          const p = f?.properties ?? f;
          return { mag: p.mag, place: p.place, time: p.time };
        });
        const hasMore = (page.offset + page.count) < page.total;
        const result = {
          total: page.total,
          offset: page.offset,
          count: page.count,
          hasMore,
          nextOffset: hasMore ? page.offset + page.count : undefined,
          features,
        };
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    },
  );
}
