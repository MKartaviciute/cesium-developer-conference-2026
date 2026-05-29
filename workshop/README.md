# Building Your First AI-Driven Geospatial App with LLMs and Cesium

**Total time: 1 hour 20 minutes**

---

## Welcome!

<img src="images/ty-calm.png" alt="Ty the tiler" width="100" align="right" />

Most AI chatbots can only talk. They can tell you the weather, describe a location, or summarize a document — but they can't *do* anything. They can't move a map, fetch live data, or place a pin on a globe.

This workshop is about closing that gap — by the end you will have built something that feels more like a co-pilot than a chatbot.

In this workshop you will learn how to:

- build an app that combines AI agents with a 3D geospatial context
- enrich those agents with external data
- leverage AI to generate new information
- enable AI to dynamically visualize insights on the Cesium globe

You will work through four labs, starting with a mostly blank starter CesiumJS application and ending with a full agent that chains Cesium commands, external MCP servers, and a real weather API in a single conversational turn.

![Animation of the agent finding restaurants within 1 km of the Colosseum in Rome. Example of tool chaining where the agent will first search for points of interest, then fly the camera to the target region, and finally create labels on the globe.](images/lab3_complete_tool_chaining.gif)

---

## Prerequisites

Please take a moment to prepare your system ahead of the workshop. If you encounter any issues, please ask a workshop facilitator for help at the start of the session.

| Requirement | Notes |
|---|---|
| **[Git](https://git-scm.com/)** | Needed to clone the workshop repo — repo link TBD. |
| **[VS Code](https://code.visualstudio.com/)** | Download from [code.visualstudio.com](https://code.visualstudio.com/). |
| **Node.js ≥ 22 LTS** | Download from [nodejs.org](https://nodejs.org/).<br>Check version with: `node --version`. |
| **pnpm 9.15.5** | Install Node.js first.<br>`npm install -g pnpm@9.15.5`<br>(or run `corepack enable` and it will be installed automatically) |
| **An OpenAI or Anthropic API key** | Will be provided during the workshop. |
| **Familiarity with the command line** | You should be comfortable running commands in a terminal. |
| **Cesium ion token** *(optional)* | [ion.cesium.com](https://ion.cesium.com) → My Tokens → Create token<br>The app works without one, but some imagery/terrain features may be limited. |

---

## Schedule

| # | Lab | Focus | Time |
|---|---|---|---|
| — | Intro & Prerequisites | Welcome & environment check. | 5 min |
| 1 | [Lab 1 — Our first Cesium tool](LAB_1.md) | Create a `flyTo` camera tool from scratch. | 15 min |
| 2 | [Lab 2 — Build an MCP server](LAB_2.md) | Build a points-of-interest (POI) MCP server and connect it to the agent. | 20 min |
| 3 | [Lab 3 — System prompts and tool descriptions](LAB_3.md) | Shape agent behavior with `TOOL_GUIDANCE` and tool descriptions. | 20 min |
| 4 | [Lab 4 — Free exploration with public datasets](LAB_4_challenge.md) | Explore public datasets.<br>Build your own MCP server(s).<br>Generate new AI insights.<br>Show us your creativity! | 25 min |

> [!TIP]
>
> We have provided a starter app for each lab. You will be adding the missing pieces. See 'Workspace structure' below for details.

---

## Workspace structure

Labs 1–2 and Labs 3–4 each have their own starter app located in the folders `lab1_lab2` and `lab3_lab4`. Both starter apps are structurally the same. Labs 3–4 simply have more tools and an extra MCP server pre-wired.

### `lab1_lab2/` — Labs 1 & 2

```
lab1_lab2/
├── src/
│   ├── app/                          # App's page structure (Next.js)
│   ├── components/
│   │   ├── cesium/                   # The Cesium viewer and tools
│   │   ├── chat/                     # The AI chat panel
│   │   │   └── ChatPanel.tsx         ← Lab 1 & 2: wire tools here
│   │   └── ...
│   └── lib/
│       ├── ai/
│       │   ├── prompts/
│       │   │   └── system-prompt.ts  # AI system prompt (minimal in Lab 1)
│       │   └── tools/
│       │       └── cesium/
│       │           └── index.ts      ← Lab 1: export your new tool
│       ├── cesium/
│       │   └── ...                   ← Lab 1: create camera.ts here
│       └── mcp-servers.config.ts     ← Lab 2: register POI server
├── packages/
│   └── mcp-poi/                      ← Lab 2: build this entire MCP package
│       └── src/
│           ├── index.ts              # Server entry point
│           ├── overpass.ts           # Overpass API client
│           └── tools/index.ts        # Tool definitions
└── .env                              # API keys
```

> [!NOTE]
>
> [OpenStreetMap Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)

### `lab3_lab4/` — Labs 3 & 4

```
lab3_lab4/
├── src/
│   ├── app/                          # App's page structure (Next.js)
│   ├── components/                   # Same as lab1_lab2
│   └── lib/
│       ├── ai/
│       │   ├── prompts/
│       │   │   └── system-prompt.ts  ← Lab 3: add TOOL_GUIDANCE here
│       │   └── tools/
│       │       └── cesium/
│       │           ├── camera-tools.ts   ← Lab 3: edit descriptions
│       │           ├── entity-tools.ts   ← Lab 3: edit descriptions
│       │           ├── imagery-tools.ts
│       │           ├── terrain-tools.ts
│       │           ├── tileset-tools.ts
│       │           ├── clock-tools.ts
│       │           ├── animation-tools.ts
│       │           └── data-source-tools.ts
│       └── cesium/                   # 10 helper modules (all pre-wired)
├── packages/
│   ├── mcp-poi/                      # Already built (from Lab 2 pattern)
│   │   └── src/tools/index.ts        ← Lab 3: optionally edit descriptions
│   └── mcp-weather/                  # Pre-wired weather server
│       └── src/
│           ├── open-meteo.ts
│           └── tools/index.ts
└── .env                              # API keys
```

> [!IMPORTANT]
> 
> **Key differences:** `lab1_lab2` starts with almost no tools — you build them. `lab3_lab4` starts fully wired (42 Cesium tools + 4 MCP tools) — you shape how the agent uses them.

---

## Architecture overview

### What is an AI agent?

An **agent** is an LLM that can call tools. Instead of just producing text, it can invoke functions — `flyTo`, `addLabel`, `get_current_weather` — and act on the results before responding. A single user message may trigger a chain of tool calls.

```
User: "What's the weather in Tokyo? Add a label with the temperature."

Agent:
  1. call get_current_weather(city="Tokyo")             ← MCP tool
  2. call addLabel(lat=35.68, lng=139.69, text="13°C")  ← Cesium tool
  3. call zoomTo(entity="Tokyo")                        ← Cesium tool
  4. "Done! Tokyo is currently 13°C — I've added a label on the globe."
```

### How the components connect

![How the components connect](images/components-diagram.png)

> [!TIP]
>
> **Key insight:** in this workshop everything runs in the browser. Tools are plain TypeScript functions that call APIs like `viewer.camera.flyTo()`, `viewer.entities.add()`, etc. directly — no serialization, no network hop to a backend. This means you can iterate instantly: change a tool definition, save, and see the effects in the next message.

### Technology choices

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js + React + TypeScript | Same code runs client and server |
| Globe | CesiumJS | Full programmatic control for agent commands |
| AI SDK | Vercel AI SDK `streamText + tool()` | Isomorphic — works in browser & server; 20+ LLM providers |
| Tool loop | AI SDK `maxSteps` | LLM→tool→LLM |
| External data | MCP servers (Streamable HTTP) | Standard protocol; AI SDK has native MCP support |
| Styling | Tailwind CSS + shadcn/ui | Fast prototyping |

---

## After the workshop

<img src="images/ty-book.png" alt="Ty the tiler with a book" width="100" align="right" />

**Share what you built** — we'd love to see it:

Share your experiment however you like — a screenshot, short video, or a prompt that made you laugh. The only guidelines are:

- Use the hashtag **#CesiumDevCon** on [X](https://x.com/search?q=%23CesiumDevCon) or [LinkedIn](https://www.linkedin.com/feed/hashtag/cesiumdevcon/) so your post is easy to find.
- Tag [**@CesiumJS**](https://x.com/CesiumJS) on X or the [**Cesium LinkedIn page**](https://www.linkedin.com/company/cesium-gs/) (@Cesium) so the team can see and reshare your work.

**Keep building:**

- Swap in your own domain data as an MCP server (earthquakes, flights, weather stations, IoT sensors, …).
- Add multi-step planning: ask the agent to _"plan a route between 5 cities"_ before executing.

**Questions?**

Ask in the [Cesium Community Forum](https://community.cesium.com).
