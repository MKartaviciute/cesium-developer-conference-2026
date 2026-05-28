# Completed Lab Reference Implementations

Working solutions for each workshop lab. Use these as a reference if you get stuck, or to compare your implementation after finishing a lab.

| Directory | Completes | Contents |
|-----------|-----------|----------|
| `lab1_completed/` | [Lab 1](../LAB_1.md) | `flyTo` camera tool wired into the chat panel |
| `lab2_completed/` | [Lab 2](../LAB_2.md) | Lab 1 solution + completed `mcp-poi` MCP server |
| `lab3_completed/` | [Lab 3](../LAB_3.md) | Lab 2 solution + improved tool descriptions and `TOOL_GUIDANCE` system prompt |

Each directory is a standalone Next.js app. To run one:

```bash
cd lab1_completed   # or lab2_completed / lab3_completed
pnpm install
cp .env.example .env   # add your API key
pnpm dev
```

For `lab2_completed` and `lab3_completed`, also start the MCP server(s) in a separate terminal — see the `packages/` directory inside each workspace.
