/**
 * Lab 2 — Section 2, Step 2 (📖 Review only)
 *
 * MCP server entry point.
 *
 * This file is pre-populated — no edits needed here.
 * Your work for Lab 2 is in packages/mcp-poi/src/tools/poi-tools.ts.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import { registerPoiTools } from "./tools/poi-tools.js";

// Basic Express app that hosts the MCP endpoint.
const app = express();
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.post("/mcp", async (req, res) => {
  // Create a fresh MCP server reference object for this request and register tools.
  const server = new McpServer({ name: "poi-server", version: "1.0.0" });
  registerPoiTools(server);

  // Streamable HTTP transport handles the MCP protocol details.
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Explicitly document allowed methods for clients.
app.get("/mcp", (_req, res) => {
  res.status(405).set("Allow", "POST, DELETE").end();
});

app.delete("/mcp", (_req, res) => {
  res.status(200).end();
});

// Default port for this lab server.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`POI MCP server running on http://localhost:${PORT}/mcp`);
});
