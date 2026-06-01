# Lab 1 — Our first Cesium tool

**Time:** ~15 minutes

---

## Section 1 — Introduction

<img src="images/ty-book.png" alt="Ty the tiler with a book" width="100" align="right" />

In this lab we will learn about tool calling. This is one of the simplest ways to give an LLM some control over its environment. The moment you give it a *tool* — a function it is allowed to call — it stops being a text generator and starts being an agent that acts on the world. This lab adds the very first tool: the ability to move the camera. One tool is all it takes to cross that line.

---

## Section 2 — Goal

In this lab we are starting with the 3D globe and chat already built and running. However, there is no meaningful connection between the chat agent and the globe built yet. The agent can answer questions, but it cannot control the globe.

In this lab you will:

- Create a camera helper that wraps a core CesiumJS function call.
- Define a `flyTo` AI tool that calls that helper.
- Wire the tool into the chat agent.

By the end, the prompt **"Fly to Paris"** will animate the globe camera.

![Completed Lab 1: typing "Fly to Paris" in the chat animates the globe camera to Paris](images/lab1_complete.gif)

---

## Section 3 — What's already implemented

| Feature | Status | Source code |
|---|---|---|
| CesiumJS globe | Running | [src/components/cesium/CesiumViewer.tsx](lab1_lab2/src/components/cesium/CesiumViewer.tsx) |
| AI chat panel | Running | [src/components/chat/ChatPanel.tsx](lab1_lab2/src/components/chat/ChatPanel.tsx) |
| Cesium Tools panel | Ready - currently shows "No tools wired yet" | [src/components/cesium/CesiumToolsPanel.tsx](lab1_lab2/src/components/cesium/CesiumToolsPanel.tsx) |
| Status bar | Visible at the bottom | [src/components/layout/StatusBar.tsx](lab1_lab2/src/components/layout/StatusBar.tsx) |
| Cesium camera tool | Not wired yet - you will complete this | [src/lib/ai/tools/cesium/index.ts](lab1_lab2/src/lib/ai/tools/cesium/index.ts) |

---

## Section 4 — Setup

**Files you will modify in this lab:**
- [`.env`](lab1_lab2/.env) - add (copy from `.env.example`)
- [`src/lib/cesium/camera.ts`](lab1_lab2/src/lib/cesium/camera.ts) - pre-populated (no edits needed)
- [`src/lib/ai/tools/cesium/camera-tools.ts`](lab1_lab2/src/lib/ai/tools/cesium/camera-tools.ts) - uncomment (pre-populated)
- [`src/lib/ai/tools/cesium/index.ts`](lab1_lab2/src/lib/ai/tools/cesium/index.ts) - edit (replace stub with import)
- [`src/components/chat/ChatPanel.tsx`](lab1_lab2/src/components/chat/ChatPanel.tsx) - edit (wire tools into chat)

All of our work for this lab will take place inside the `lab1_lab2` directory. Switch to that directory in your terminal and install our node dependencies.

```bash
cd workshop/lab1_lab2
pnpm install
```

Add a new file called `.env` next to `.env.example`. The easiest way is to copy `.env.example` and rename it:

```bash
cp .env.example .env
```

Then open `.env` and fill in your API key (provided during the workshop):

```env
# Optional — some imagery/terrain features require a Cesium Ion token
CESIUM_ION_ACCESS_TOKEN=your_token_here

OPENAI_API_KEY=sk-...
AI_BASE_URL=
AI_MODEL=gpt-5.4
```

Now we can run the app. Execute the following command and open a new browser tab to http://localhost:3000.

```bash
pnpm dev # → http://localhost:3000
```

> [!IMPORTANT]
>
> Do not close the terminal window where you just ran these commands to keep the dev server running while you complete the lab.

---

## Section 5 — Verify the baseline functionality

In the chat panel, type:

> **"Fly to Paris"**

Notice the assistant responds with text, but the globe does not move.

Open [src/components/chat/ChatPanel.tsx](lab1_lab2/src/components/chat/ChatPanel.tsx#L59) and you will see `tools: {}`. This empty object tells us that no tools are registered yet.

Back in the app, look at the bottom left corner and find the status bar for MCP servers and tools. You can click on these to open a helpful debug panel describing what resources are currently connected to your LLM chat agent. Right now both lists should be empty.

![The app before wiring tools: the Cesium globe has not moved, the chat shows a "Flying to Paris now" response but nothing happened on the globe, and the Cesium Tools panel displays 0 tools.](images/lab1_toolbar_tips.gif)

> [!IMPORTANT]
>
> The globe stays at the default view because no camera tool is registered. The Cesium Tools panel confirms this by showing 0 tools.

---

## Section 6 — Review the camera helper

Open [**`src/lib/cesium/camera.ts`**](lab1_lab2/src/lib/cesium/camera.ts) and review the pre-populated code. It exports a single `flyToLocation` function that wraps the CesiumJS `camera.flyTo` API:

```typescript
/** Fly the camera to a lat/lon coordinate. */
export async function flyToLocation(
  // Reference to the 3D viewer - used to call CesiumJS functions.
  viewer: CesiumType.Viewer,
  // All input parameters required and optional for flyTo.
  params: {
    latitude: number;     // latitude in degrees
    longitude: number;    // longitude in degrees
    altitude?: number;    // altitude in meters
    duration?: number;    // how long animation should last in seconds
  },
): Promise<void> {
  const Cesium = await import("cesium");
  // Instantiate variables with defaults for optional parameters.
  const { latitude, longitude, altitude = 1_000_000, duration = 3 } = params;

  // Execute the flyTo function and return an async promise.
  return new Promise((resolve, reject) => {
    viewer.camera.flyTo({
      // Destination is a Cartesian3 object calculated
      // using longitude, latitude, and altitude.
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
      duration,
      complete: resolve,
      cancel: reject,
    });
  });
}
```

No edits are needed here. Continue to Section 7.

This is the first layer we are adding on top of the CesiumJS API to translate the API into something our LLM agent can understand. The LLM can't pull off miracles on its own, but maybe if we give it the right tools...

---

## Section 7 — Define the AI tool

A stub already exists in **[src/lib/ai/tools/cesium/index.ts](lab1_lab2/src/lib/ai/tools/cesium/index.ts#L10)** with an empty implementation:

```typescript
// Current stub in src/lib/ai/tools/cesium/index.ts
function createCameraTools(_viewerRef: RefObject<Viewer | null>): Record<string, Tool> {
  // TODO (Lab 1): Implement your camera tools here
  return {};
}
```

You will replace that stub by creating a new tool file and importing it.

### Step 1 — Activate [`src/lib/ai/tools/cesium/camera-tools.ts`](lab1_lab2/src/lib/ai/tools/cesium/camera-tools.ts)

This file is the container for all tools we want to implement related to camera control. It is pre-populated with a skeleton and a commented-out implementation.

**Uncomment the `createCameraTools` function** (remove the `//` prefix from each line in the commented block). After uncommenting, your file should look like this:

```typescript
import { tool } from "ai";
import { z } from "zod";
import type { RefObject } from "react";
import type * as CesiumType from "cesium";
import { flyToLocation } from "@/lib/cesium/camera";

export function createCameraTools(
  viewerRef: RefObject<CesiumType.Viewer | null>,
) {
  return {
    // The flyTo tool object - the only camera tool for now.
    flyTo: tool({
      // Natural language description of the flyTo tool.
      description:
        "Fly the camera to a geographic location. " +
        "Use when the user asks to navigate, go to, show, or visit a place.",
      // Defines the input parameters for this tool.
      // z (or zod) is the library used to dynamically define the types.
      inputSchema: z.object({
        latitude: z.number().describe("Decimal degrees, positive = north"),
        longitude: z.number().describe("Decimal degrees, positive = east"),
        altitude: z
          .number()
          .optional()
          .describe("Camera height above ground in metres. Default: 1 000 000"),
        duration: z
          .number()
          .optional()
          .describe("Flight duration in seconds. Default: 3"),
        locationName: z
          .string()
          .describe("Human-readable name shown in the result card"),
      }),
      // The javascript function that'll be called when the tool is called.
      // This is a wrapper around the function you wrote earlier that
      // includes some logic to check whether the viewer is ready.
      execute: async ({ latitude, longitude, altitude, duration }) => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) {
          return { success: false, error: "Viewer not ready" };
        }
        await flyToLocation(viewer, { latitude, longitude, altitude, duration });
        return { success: true, latitude, longitude, altitude };
      },
    }),
  };
}
```

`createCameraTools` returns an object containing several `tools`. Take a moment to study the fields inside the `flyTo: Tool` object. Notice the natural language `description` of what the tool does. Notice the descriptions of each of the input parameters in `inputSchema` and the rules specifying what type the inputs have and whether or not they are optional. Keep this in mind as we will repeat this pattern soon to add more tools.

### Step 2 — Update [src/lib/ai/tools/cesium/index.ts](lab1_lab2/src/lib/ai/tools/cesium/index.ts)

Completely remove the local `createCameraTools` stub function and add the following import pointing to your real implementation in `camera-tools.ts`:

```diff
+ import { createCameraTools } from "./camera-tools";

- /**
-  * Stub for camera tools — students will replace this with their implementation.
-  */
- function createCameraTools(_viewerRef: RefObject<Viewer | null>): Record<string, Tool> {
-   // TODO (Lab 1): Implement your camera tools here
-   return {};
- }
```

---

## Section 8 — Connect the tool to the LLM

Open **[src/components/chat/ChatPanel.tsx](lab1_lab2/src/components/chat/ChatPanel.tsx)**.

### Step 1 — Add imports at the top

```typescript
import { useMemo } from "react";
import { useCesiumViewer } from "@/hooks/useCesiumViewer";
import { createCameraTools } from "@/lib/ai/tools/cesium/camera-tools";
```

### Step 2 — Replace `tools: {}`

```diff
export function ChatPanel() {
-   // No tools wired yet — the assistant can only answer with text.
+   // Add required scaffolding to make tools available to the chat component.
+   const { viewerRef } = useCesiumViewer();
+   const tools = useMemo(() => createCameraTools(viewerRef), [viewerRef]);
  const { messages, status, error, sendMessage, abort, retry } = useAIChat({
-     tools: {},
+     tools,
  });
  const { isOnline } = useNetworkStatus();
});
```

---

## Section 9 — Test out the tool

Make sure all your file edits are saved. Type **"Fly to Paris"** again. The globe should smoothly animate to Paris.

**Bonus:** Click the status bar at the bottom-right to open the **Cesium Tools** panel. Your `flyTo` tool should now appear with some documentation.

### Expected UI After Wiring `flyTo`

![The app after wiring the flyTo tool: the globe has flown to Paris, the chat shows the assistant's confirmation, and the Cesium Tools panel displays 1 tool.](images/lab1_flyto_tool_added.gif)

Congrats! The globe now moves because the LLM agent can call the `flyTo` tool and execute camera commands on the globe.

> [!TIP]
>
> **Exercises:** Try additional prompts
> - "Take me to Mount Fuji"
> - "Show me the Sahara Desert"
> - "Go to Sydney Harbour"
> - "Go to the place in the movie National Treasure where the clue hidden in the cipher on the back of the Declaration of Independence leads to next." 
>
> Observe how the LLM resolves natural-language place names into coordinates.

> [!NOTE]
> 
> You may notice the LLM might still be responding with text at times instead of calling the tool. That is expected. The **system prompt** isn't utilized properly yet to tailor the overall behavior of the agent. You will explore system prompts in [**Lab 3**](LAB_3.md).

---

## Section 10 — Tool descriptions matter

The `description` field is what the LLM reads to decide **when** to call a tool. It contains a 'trigger list' of phrases that have likely mappings to the tool.

- Remove `"show"` from the trigger list. Does "show me the Eiffel Tower" still call the tool?
- Change the `altitude` description. Does the model pick different altitudes for cities vs. continents?
- Make the description more restrictive, for example: "only call this for capital cities." What happens if you try to fly to a small town?

---

## BONUS — Zero-parameter `resetCamera` tool

A tool doesn't need parameters to be useful. Adding a **zero-parameter** `resetCamera` tool proves that the LLM's tool-selection is driven entirely by the `description` field — no input schema gymnastics required.

### Implementation

Open [`src/lib/ai/tools/cesium/camera-tools.ts`](lab1_lab2/src/lib/ai/tools/cesium/camera-tools.ts) and add a `resetCamera` entry alongside the existing `flyTo` tool:

```typescript
resetCamera: tool({
  description:
    "Reset the globe camera to the default world view. " +
    "Use when the user asks to go back, reset, start over, " +
    "or see the whole Earth.",
  inputSchema: z.object({}),
  execute: async () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) {
      return { success: false, error: "Viewer not ready" };
    }
    viewer.camera.flyHome(2); // 2-second animation
    return { success: true, message: "Camera reset to default world view" };
  },
}),
```

### Test it

Save and try these prompts:

> - **"Go back to the start"**
> - **"Show me the whole Earth"**
> - **"Reset the view"**

The globe should animate back to its default position every time — even though the tool has no parameters and the LLM made its selection based only on the description.

### Expected result

![The resetCamera tool in action: typing "Show me the whole Earth" resets the globe back to its default world view](images/lab1_bonus_reset_view_tool_added.gif)

> [!TIP]
>
> The LLM doesn't need coordinates or numbers to decide which tool to call. A well-written `description` is enough. This is a powerful design principle — keep tool selection logic in the description, not the schema.

---

## Section 11 — What's next

In [**Lab 2**](LAB_2.md), you will build an MCP server and connect it so the AI can call your exernal tools alongside the application's Ceisum tools.
