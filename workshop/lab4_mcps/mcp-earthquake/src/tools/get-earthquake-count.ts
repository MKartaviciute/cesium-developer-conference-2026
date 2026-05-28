import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getEarthquakeCount } from "../earthquake-client.js";
import { earthquakeFilterInputFields, assertDateRange } from "./shared-schema.js";

export function registerGetEarthquakeCountTool(server: McpServer): void {
  server.registerTool(
    "get_earthquake_count",
    {
      description:
        "Return the count of seismic events matching the given filters from the USGS Earthquake Catalog, without fetching full event data.",
      inputSchema: earthquakeFilterInputFields,
    },
    async ({
      starttime,
      endtime,
      minmagnitude,
      maxmagnitude,
      mindepth,
      maxdepth,
      minlatitude,
      maxlatitude,
      minlongitude,
      maxlongitude,
    }) => {
      try {
        assertDateRange(starttime, endtime);
        const count = await getEarthquakeCount({
          starttime,
          endtime,
          minmagnitude,
          maxmagnitude,
          mindepth,
          maxdepth,
          minlatitude,
          maxlatitude,
          minlongitude,
          maxlongitude,
        });
        return {
          content: [{ type: "text", text: String(count) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    },
  );
}
