import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
process.loadEnvFile();
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerCdoTools } from "./tools/cdo-tools.js";

const app = express();

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const mcpLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/mcp", mcpLimiter, async (req, res) => {
  const server = new McpServer({ name: "cdo", version: "1.0.0" });
  registerCdoTools(server);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", (_req, res) => { res.status(405).set("Allow", "POST, DELETE").end(); });
app.delete("/mcp", (_req, res) => { res.status(200).end(); });

const PORT = process.env.PORT ? Number(process.env.PORT) : 3005;
app.listen(PORT, () => {
  console.log(`CDO MCP server running on http://localhost:${PORT}/mcp`);
});
