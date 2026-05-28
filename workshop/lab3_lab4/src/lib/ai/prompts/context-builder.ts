import type { ViewerState } from "@/lib/cesium/viewer-state";

/**
 * Strips characters that could be interpreted as markdown formatting or LLM
 * instruction syntax from user-originated strings before they are embedded in
 * the system prompt (prompt-injection mitigation).
 */
function sanitizeForPrompt(text: string): string {
  return (
    text
      // Remove angle brackets that could introduce HTML-like injection
      .replace(/[<>]/g, "")
      // Remove triple-backtick code fences that could break the prompt structure
      .replace(/`{3,}/g, "")
      // Truncate to a reasonable length to prevent large payloads
      .slice(0, 200)
  );
}

/**
 * Converts a {@link ViewerState} snapshot into a compact, human-readable
 * context string that is appended to the LLM system prompt on every request.
 *
 * The output is intentionally terse to minimise token usage while still giving
 * the agent enough situational awareness to respond intelligently (see
 * Architecture §8.2).
 *
 * @param viewerState - Snapshot obtained from {@link getViewerState}.
 * @returns A multi-line markdown string describing the current globe state.
 */
export function buildViewerContext(viewerState: ViewerState): string {
  const { camera, entities, dataSources, clockTime } = viewerState;

  const entityNames =
    entities.length === 0
      ? "none"
      : entities.map((e) => sanitizeForPrompt(e.name ?? e.id)).join(", ");

  const visibleSources = dataSources.filter((ds) => ds.show);
  const layerNames =
    visibleSources.length === 0
      ? "none"
      : visibleSources.map((ds) => sanitizeForPrompt(ds.name)).join(", ");

  return [
    "## Current viewer state",
    `- Camera: lat=${camera.latitude.toFixed(4)}, lon=${camera.longitude.toFixed(4)}, alt=${Math.round(camera.altitude)}m, heading=${camera.heading.toFixed(1)}°, pitch=${camera.pitch.toFixed(1)}°`,
    `- Visible entities: ${entityNames}`,
    `- Active layers: ${layerNames}`,
    `- Scene time: ${clockTime}`,
  ].join("\n");
}
