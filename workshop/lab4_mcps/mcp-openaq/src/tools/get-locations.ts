import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchLocations } from "../openaq.js";

export function registerGetLocationsTool(server: McpServer): void {
  server.registerTool(
    "get_locations",
    {
      description:
        "List air quality monitoring locations from the OpenAQ platform. " +
        "Supports filtering by coordinates+radius, pollutant parameters, monitor type, and mobility. " +
        "NOTE: country_id alone (without coordinates) causes the OpenAQ API to 500 — always pair it with coordinates+radius. " +
        "Response includes pagination metadata (found, totalPages). " +
        "When the result set is large, found is returned as a string like \">25\" and totalPages is omitted — " +
        "in that case paginate by incrementing page until results is empty or shorter than limit.",
      inputSchema: {
        coordinates: z
          .string()
          .optional()
          .describe('Centre point for radius search as "lat,lon"'),
        radius: z
          .number()
          .int()
          .min(1)
          .max(100000)
          .default(10000)
          .optional()
          .describe("Search radius in metres (max 100 000); used with coordinates. A single query cannot cover a large country — issue multiple queries centred on different cities to get nationwide coverage."),
        country_id: z
          .string()
          .optional()
          .describe("ISO 3166-1 alpha-2 country code filter (e.g. DE, FR, US). Must be paired with coordinates+radius — country-only queries return 500."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(25)
          .default(10)
          .optional()
          .describe("Results per page (max 25)"),
        page: z
          .number()
          .int()
          .min(1)
          .default(1)
          .optional()
          .describe("Page number — use meta.totalPages from the response to know how many pages exist"),
        parameters: z
          .array(z.enum(["pm25", "pm10", "pm1", "no2", "no", "o3", "co", "so2", "bc"]))
          .optional()
          .describe("Filter by pollutant(s). Supported: pm25, pm10, pm1, no2, no, o3, co, so2, bc"),
        monitor: z
          .boolean()
          .optional()
          .describe("true = reference-grade government monitors only; false = low-cost sensors only"),
        mobile: z
          .boolean()
          .optional()
          .describe("true = mobile sensors only; false = fixed stations only"),
      },
    },
    async ({ coordinates, radius, country_id, limit, page, parameters, monitor, mobile }) => {
      if (country_id && !coordinates) {
        return {
          content: [{
            type: "text",
            text: "country_id filter requires coordinates+radius — the OpenAQ API returns 500 for country-only queries. " +
              "Please provide a coordinates value (e.g. \"52.52,13.41\" for Berlin) and an optional radius.",
          }],
        };
      }
      try {
        const data = await fetchLocations({
          coordinates, radius, country_id, limit, page, parameters, monitor, mobile,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error fetching locations: ${message}` }],
        };
      }
    },
  );
}
