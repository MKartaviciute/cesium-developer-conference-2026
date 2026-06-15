import "server-only";

/**
 * System prompt for the Cesium geospatial AI assistant.
 *
 * Labs 1 & 2 use ROLE only — no tool guidance yet.
 * The assistant can respond to geography questions and (after Lab 1) control
 * the camera via the flyTo tool, but there is no behavioural guidance telling
 * the LLM *how* to use its tools. System-prompt engineering is covered in
 * Lab 3 (workshop/lab3_lab4).
 */

const ROLE = `You are a geospatial AI assistant.
You can see a 3D globe on the user's screen.
Help users explore locations, answer geography questions, and understand spatial concepts.
Be concise and friendly.`;

export function buildSystemPrompt(): string {
  return ROLE;
}

export const SYSTEM_PROMPT = buildSystemPrompt();