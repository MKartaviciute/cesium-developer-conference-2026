import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import { registerWeatherTools } from "./tools/index.js";

const app = express();
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = new McpServer({ name: "weather", version: "1.0.0" });
  registerWeatherTools(server);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", (_req, res) => { res.status(405).set("Allow", "POST, DELETE").end(); });
app.delete("/mcp", (_req, res) => { res.status(200).end(); });

const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;
app.listen(PORT, () => {
  console.log(`Weather MCP server running on http://localhost:${PORT}/mcp`);
});
