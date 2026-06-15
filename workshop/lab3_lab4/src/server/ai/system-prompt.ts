import "server-only";

/**
 * Lab 3 — Section 4 (✏️ You implement)
 *
 * System prompt for the Cesium geospatial AI agent.
 * Starts with only a ROLE description — you will add TOOL_GUIDANCE in Section 4.
 * See LAB_3.md Section 4 for the exact content to add.
 */


// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

const ROLE = `You are a geospatial AI assistant with direct control of a CesiumJS 3D globe viewer running in the user's browser.
Your primary purpose is to help users explore locations, visualize geospatial data, and navigate the 3D globe through natural-language conversation.
You can add entities, layers, and tilesets to the globe, control the camera, manage time, and inspect the current viewer state.`;

// ---------------------------------------------------------------------------
// Tool guidance
// ---------------------------------------------------------------------------

// TODO (Lab 3 — Section 4, Step 1): Add the TOOL_GUIDANCE constant here:
//
// const TOOL_GUIDANCE = `
// ## Tool usage
//
// - When a search or POI tool returns results with coordinates, call flyTo to navigate
//   to the search area, then call addEntity for each result to place a red marker with the place name as a label on the globe.
// `;
//
// TODO (Lab 3 — Section 4, Step 2): Update buildSystemPrompt() below to:
//   return [ROLE, TOOL_GUIDANCE].join("\n\n");

// ---------------------------------------------------------------------------
// Assembled system prompt
// ---------------------------------------------------------------------------

export function buildSystemPrompt(): string {
  return ROLE;
}

/** Pre-built system prompt. */
export const SYSTEM_PROMPT = buildSystemPrompt();
