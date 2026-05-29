/**
 * System prompt for the Cesium geospatial AI agent.
 *
 * Starts with only a ROLE description. 
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

// TODO (Lab 3 — Section 4): Add a TOOL_GUIDANCE block here with global rules
// that apply across all tools, then include it in buildSystemPrompt() below:
//   return [ROLE, TOOL_GUIDANCE].join("\n\n");
// See LAB_3.md Section 4 for the exact content to add.

// ---------------------------------------------------------------------------
// Assembled system prompt
// ---------------------------------------------------------------------------

export function buildSystemPrompt(): string {
  return ROLE;
}

/** Pre-built system prompt. */
export const SYSTEM_PROMPT = buildSystemPrompt();
