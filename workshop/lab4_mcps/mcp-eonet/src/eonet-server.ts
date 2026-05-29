import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerEonetTools } from "./tools/eonet-tools.js";

const app = express();

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// 60 requests per minute per IP
const mcpLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// SDK 1.29.0: stateless — fresh McpServer + transport per POST
app.post("/mcp", mcpLimiter, async (req, res) => {
  const server = new McpServer({ name: "eonet", version: "1.0.0" });
  registerEonetTools(server);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", (_req, res) => { res.status(405).set("Allow", "POST, DELETE").end(); });
app.delete("/mcp", (_req, res) => { res.status(200).end(); });

const PORT = process.env.PORT ? Number(process.env.PORT) : 3008;
app.listen(PORT, () => {
  console.log(`EONET MCP server running on http://localhost:${PORT}/mcp`);
});
