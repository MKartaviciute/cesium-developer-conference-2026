# Lab 4 — Free exploration with public datasets

**Time:** ~25 minutes

---

## Section 1 — Introduction

<img src="images/ty-book.png" alt="Ty the tiler with a book" width="100" align="right" />

Labs 1–3 gave you the mechanics. Lab 4 is yours: take what you've built, pick a real dataset, and generate some insights that would have taken hours of manual work.

> *"Discovery consists of seeing what everybody has seen and thinking what nobody has thought."* — Albert von Szent-Györgyi

What you build here reflects your curiosity, your domain, and your instincts. There is no single correct answer.

---

## Section 2 — Goal

Lab 4 is open-ended. By now, your app has Cesium tools, MCP support, and prompt rules that can coordinate multi-step behavior. Now we'd like to see you express your creativity to generate some unique AI-powered insights and show us your findings in a 3D geospatial context.

In this lab you will:

- Explore real public datasets.
- Build or extend at least one MCP server.
- Chain multiple tools and data sources in one conversational flow.
- Visualize your results on the Cesium globe.

Some experiments might lead to a polished demo, others to an unexpected result or a funny failure — both are worth exploring. Here are some ideas to spark your imagination:
- earthquakes + nearby hospitals,
- weather + flood risk context,
- POI accessibility by region,
- or something entirely your own.

If you need a starting point, [Section 6](#section-6--need-inspiration-start-here) has some ideas.

---

## Section 3 — What's already implemented

| Feature | Status | Source code |
|---|---|---|
| Cesium toolset | 42 tools pre-wired | `src/lib/ai/tools/cesium/` |
| MCP POI server | Pre-wired (`get_points_of_interest`) | `packages/mcp-poi/` |
| MCP Weather server | Pre-wired (`get_current_weather`, `get_forecast`, `get_historical_weather`) | `packages/mcp-weather/` |
| MCP connection config | POI + Weather already registered | `src/lib/mcp-servers.config.ts` |
| Prompt orchestration | Uses your Lab 3 system-prompt updates | `src/lib/ai/prompts/system-prompt.ts` |

> [!NOTE]
>
> This lab will not prescribe exact tools, MCP servers, or prompt wording. You are expected to experiment with the concepts you've learned. **Workshop facilitators are available if you need help. 🙋**

---

## Section 4 — Setup

**Files you may modify in this lab:**
- `packages/mcp-[your-topic]/` - create or extend an MCP server package
- `src/lib/mcp-servers.config.ts` - register your server
- `src/lib/ai/prompts/system-prompt.ts` - optional behavior tuning
- `src/lib/ai/tools/...` - optional tool-description tuning or create new tools

Lab 4 uses the same workspace as Lab 3: `workshop/lab3_lab4`.

```bash
cd workshop/lab3_lab4
pnpm install
```

Create `.env` (same format as previous labs) if needed.

### Start all processes (3 terminals)

```bash
# Terminal 1 - POI MCP server (port 3001)
cd workshop/lab3_lab4/packages/mcp-poi
pnpm dev
```

```bash
# Terminal 2 - Weather MCP server (port 3002)
cd workshop/lab3_lab4/packages/mcp-weather
pnpm dev
```

```bash
# Terminal 3 - App server (port 3000)
cd workshop/lab3_lab4
pnpm dev
```

The status bar should turn green when both MCP servers connect.

> [!IMPORTANT]
>
> Keep all three terminals running while you experiment. If you do not need the POI MCP server or the Weather MCP server, you may remove them from `mcp-servers.config.ts` and close those two terminals.

---

## Section 5 — Verify baseline behavior

Before creating anything new, verify the baseline stack works.

Try these prompts:
- **"Show me museums near Paris."**
- **"What is the current weather in Tokyo?"**
- **"Find attractions in Barcelona and fly to the first one."**

If those work, your baseline is ready for custom experiments.

---

## Section 6 — Need inspiration? Start here

Not sure where to begin? Here are a few directions — browse, mix, or ignore them and bring your own idea.

- **Add a new data source** — pick any public API, wrap it in a focused MCP server, and expose 1–3 tools. Browse available no-auth APIs in [data-sources.md](data-sources.md#all-available-sources). Reference implementations for all 26 sources are in [`workshop/lab4_mcps/`](lab4_mcps/) — copy one as a starting point rather than writing from scratch.
- **Combine two or more sources** — chain data sources to generate an insight neither could produce alone. See ready-made patterns in [data-sources.md](data-sources.md#ready-made-combinations) (flood readiness, earthquake exposure, natural event context cards, service accessibility, and more).
- **Visualization-first** — already have data? Focus on geospatial storytelling: time-lapse with `setTime` + `clockControl`, layered overlays, or route/marker narratives across multiple cities.

---

## Section 7 — Share your experiments

<img src="images/ty-book.png" alt="Ty the tiler holding a book" width="120" align="right" />

Built something cool? We'd love to see it!

Share your experiment however you like — there's no required format. The only guidelines are:

- Use the hashtag **#CesiumDevCon** on [X](https://x.com/search?q=%23CesiumDevCon) or [LinkedIn](https://www.linkedin.com/feed/hashtag/cesiumdevcon/) so your post is easy to find.
- Tag [**@CesiumJS**](https://x.com/CesiumJS) on X or the [**Cesium LinkedIn page**](https://www.linkedin.com/company/cesium-gs/) (@Cesium) so the team can see and reshare your work.

Even if it's incomplete or a prompt that produced a funny result, share it anyway. Every experiment teaches us something about what generative AI can do.

---

## Section 8 — Wrap-up

Across Labs 1-4, you have built a full browser-based geospatial agentic application:

1. Added Cesium tools and wired chat-to-globe actions.
2. Exposed external data via MCP servers.
3. Tuned behavior with system-prompt and tool-description rules.
4. Designed and tested multi-source, multi-tool geospatial experiments.

**Thank you for your participation!**
