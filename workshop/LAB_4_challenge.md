# Lab 4 — Free exploration with public datasets

**Time:** ~20 minutes | **Required workspace:** `workshop/lab3_lab4/` _(same workspace as Lab 3)_

---

## Overview

<img src="images/ty-book.png" alt="Ty the tiler with a book" width="100" align="right" />

Labs 1–3 gave you the mechanics. Lab 4 is yours: take what you've built, pick a real dataset, and generate some insights that would have taken hours of manual work.

> *"Discovery consists of seeing what everybody has seen and thinking what nobody has thought."* — Albert von Szent-Györgyi

Lab 4 is open-ended. By now, your app has Cesium tools, MCP support, and prompt rules that can coordinate multi-step behavior. Now we'd like to see you express your creativity to generate some unique AI-powered insights and show us your findings in a 3D geospatial context.

**In this lab you will:**

- Explore real public datasets.
- Build or extend at least one MCP server.
- Chain multiple tools and data sources in one conversational flow.
- Visualize your results on the Cesium globe.


Some experiments might lead to a polished demo, others to an unexpected result or a funny failure — both are worth exploring. Here are some ideas to spark your imagination:
- earthquakes + nearby hospitals,
- weather + flood risk context,
- POI accessibility by region,
- or something entirely your own.

If you need a starting point, [Section 3](#section-3--need-inspiration-start-here) has some ideas.

> [!TIP]
>
> **Start here, keep going later.** Lab 4 is open-ended on purpose — don't worry about "finishing" it during the session. Pick one small idea, get it working, and have fun. Everything you build here (and all the reference servers in [`workshop/lab4_mcps/`](lab4_mcps/)) is included in the workshop files, so you can keep exploring long after the workshop ends.

### What's already implemented

| Feature | Status | Source code |
|---|---|---|
| Cesium toolset | 42 tools pre-wired | [`src/lib/ai/tools/cesium/index.ts`](lab3_lab4/src/lib/ai/tools/cesium/index.ts) |
| MCP POI server | Pre-wired (`get_points_of_interest`) | [`packages/mcp-poi/src/poi-server.ts`](lab3_lab4/packages/mcp-poi/src/poi-server.ts) |
| MCP Weather server | Pre-wired (`get_current_weather`, `get_forecast`, `get_historical_weather`) | [`packages/mcp-weather/src/weather-server.ts`](lab3_lab4/packages/mcp-weather/src/weather-server.ts) |
| MCP connection config | POI + Weather already registered | [`src/lib/mcp-servers.config.ts`](lab3_lab4/src/lib/mcp-servers.config.ts) |
| Prompt orchestration | Uses your Lab 3 system-prompt updates | [`src/server/ai/system-prompt.ts`](lab3_lab4/src/server/ai/system-prompt.ts) |

---

## Section 1 — Setup (start here)

Lab 4 uses the same workspace as Lab 3: `workshop/lab3_lab4`.

```bash
cd workshop/lab3_lab4
pnpm install
```

Copy `.env.example` to `.env` if you haven't already — this is required to start the app (same values as Lab 3).

### Start all processes

> [!TIP]
>
> **Prefer not to use the command line?** In VS Code open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`), run **Tasks: Run Task**, and choose **"Lab 3 & 4: Start everything (app + POI + Weather)"** to launch all three servers at once.

This lab needs three processes (app + POI server + Weather server). The easiest way is **one command** from the `lab3_lab4` directory, which starts all three together:

```bash
cd workshop/lab3_lab4
pnpm start:all
```

Once ready, the app terminal will show something like:

```
▲ Next.js 16.2.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.0.237:3000
- Environments: .env
✓ Ready in 2.9s
```

Open a browser and navigate to **http://localhost:3000**.

<details>
<summary>Prefer three separate terminals? (click to expand)</summary>

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

Once the app server is ready, open a browser and navigate to **http://localhost:3000**.

</details>

The status bar should turn green when both MCP servers connect.

> [!IMPORTANT]
>
> Keep all processes running while you experiment. If you do not need the POI MCP server or the Weather MCP server, you may remove them from [`mcp-servers.config.ts`](lab3_lab4/src/lib/mcp-servers.config.ts) and stop those two servers.

> [!TIP]
>
> **Token cost of tools:** Every tool definition consumes tokens on every request, even if never called. As you add more MCP servers, the baseline cost per request grows. If you're focused on a specific experiment, consider commenting out Cesium tool categories you don't need (e.g., animation, clock, terrain) in the [tool registration](lab3_lab4/src/lib/ai/tools/cesium/index.ts) — fewer tools means cheaper requests and better routing accuracy.

**Files you may modify in this lab:**
- `packages/mcp-[your-topic]/` - create or extend an MCP server package
- [`src/lib/mcp-servers.config.ts`](lab3_lab4/src/lib/mcp-servers.config.ts) - register your server
- [`src/server/ai/system-prompt.ts`](lab3_lab4/src/server/ai/system-prompt.ts) - optional behavior tuning
- [`src/lib/ai/tools/cesium/index.ts`](lab3_lab4/src/lib/ai/tools/cesium/index.ts) - optional tool-description tuning or create new tools

---

## Section 2 — Verify baseline behavior

Before creating anything new, verify the baseline stack works.

Try these prompts:
- **"Show me museums near Paris."**
- **"What is the current weather in Tokyo?"**
- **"Find attractions in Barcelona and fly to the first one."**

If those work, your baseline is ready for custom experiments.

---

## Section 3 — Need inspiration? Start here

Not sure where to begin? Here are a few directions — browse, mix, or ignore them and bring your own idea.

- **Add a new data source** — pick any public API, wrap it in a focused MCP server, and expose 1–3 tools. Browse available no-auth APIs in [data-sources.md](data-sources.md#all-available-sources). Reference implementations for all 26 sources are in [`workshop/lab4_mcps/`](lab4_mcps/) (S02–S26) and `lab3_lab4/packages/mcp-weather/` (S01 — Open-Meteo, already pre-wired) — copy one as a starting point rather than writing from scratch.
- **Combine two or more sources** — chain data sources to generate an insight neither could produce alone. See ready-made patterns in [data-sources.md](data-sources.md#ready-made-combinations) (flood readiness, earthquake exposure, natural event context cards, service accessibility, and more).
- **Visualization-first** — already have data? Focus on geospatial storytelling: time-lapse with `setTime` + `clockControl`, layered overlays, or route/marker narratives across multiple cities.

---

## Section 4 — Share your experiments

<img src="images/ty-book.png" alt="Ty the tiler holding a book" width="120" align="right" />

Built something cool? We'd love to see it!

Share your experiment however you like — there's no required format. The only guidelines are:

- Use the hashtag **#CesiumDevCon** on [X](https://x.com/search?q=%23CesiumDevCon) or [LinkedIn](https://www.linkedin.com/feed/hashtag/cesiumdevcon/) so your post is easy to find.
- Tag [**@CesiumJS**](https://x.com/CesiumJS) on X or the [**Cesium LinkedIn page**](https://www.linkedin.com/company/cesium-gs/) (@Cesium) so the team can see and reshare your work.

Even if it's incomplete or a prompt that produced a funny result, share it anyway. Every experiment teaches us something about what generative AI can do.

---

## Section 5 — Wrap-up

Across Labs 1-4, you have built a full browser-based geospatial agentic application:

1. Added Cesium tools and wired chat-to-globe actions.
2. Exposed external data via MCP servers.
3. Tuned behavior with system-prompt and tool-description rules.
4. Designed and tested multi-source, multi-tool geospatial experiments.

**Thank you for your participation!**
