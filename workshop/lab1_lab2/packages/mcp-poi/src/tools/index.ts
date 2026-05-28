import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchPois } from "../overpass.js";

// TODO (Lab 2 — Section 5, Step 3): Implement registerPoiTools.
//
// This function registers the get_points_of_interest tool on the MCP server.
// Define: tool name, natural language description, input schema (latitude,
// longitude, type, radius), and an execute function that calls searchPois().
//
// Uncomment the block below to complete the implementation:

// export function registerPoiTools(server: McpServer) {
//   server.tool(
//     // Tool name exposed over MCP.
//     "get_points_of_interest",
//     // Tool description used by the LLM for intent matching.
//     "Search for real-world points of interest near a location using OpenStreetMap data. " +
//       "Returns name, coordinates, and tags for each result. " +
//       "Supported types include: museum, attraction, monument, restaurant, cafe, park, hotel, viewpoint, artwork, theatre.",
//     {
//       latitude: z.number().describe("Center latitude (e.g. 48.8566 for Paris)"),
//       longitude: z.number().describe("Center longitude (e.g. 2.3522 for Paris)"),
//       type: z
//         .string()
//         .describe(
//           "Type of POI to search for (e.g. 'museum', 'attraction', 'monument', 'restaurant', 'cafe', 'park')",
//         ),
//       radius: z
//         .number()
//         .optional()
//         .describe("Search radius in meters (default 5000)"),
//     },
//     async ({ latitude, longitude, type, radius }) => {
//       const results = await searchPois(latitude, longitude, type, radius);
//       return {
//         content: [
//           {
//             type: "text" as const,
//             text: JSON.stringify(results, null, 2),
//           },
//         ],
//       };
//     },
//   );
// }
