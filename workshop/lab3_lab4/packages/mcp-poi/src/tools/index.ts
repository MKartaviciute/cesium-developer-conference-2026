import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchPois } from "../overpass.js";

export function registerPoiTools(server: McpServer) {
  server.tool(
    "get_points_of_interest",
    "Search for real-world points of interest near a location using OpenStreetMap data. " +
      "Returns name, coordinates, and tags for each result. " +
      "Supported types include: museum, attraction, monument, restaurant, cafe, park, hotel, viewpoint, artwork, theatre.",
    {
      latitude: z.number().describe("Center latitude (e.g. 48.8566 for Paris)"),
      longitude: z.number().describe("Center longitude (e.g. 2.3522 for Paris)"),
      type: z
        .string()
        .describe(
          "Type of POI to search for (e.g. 'museum', 'attraction', 'monument', 'restaurant', 'cafe', 'park')",
        ),
      radius: z
        .number()
        .optional()
        .describe("Search radius in meters (default 5000)"),
    },
    async ({ latitude, longitude, type, radius }) => {
      const results = await searchPois(latitude, longitude, type, radius);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    },
  );
}
