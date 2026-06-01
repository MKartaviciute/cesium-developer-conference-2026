import { z } from "zod";

// ---------------------------------------------------------------------------
// URL validation helper (SSRF mitigation)
// ---------------------------------------------------------------------------

/**
 * Returns true when the URL is safe to load from the client:
 * - `https://` scheme for all public hosts, OR
 * - `http://` scheme only for true-localhost addresses (local dev tile/model servers).
 * RFC-1918 and link-local private ranges are blocked to prevent SSRF.
 */
export function isAllowedUrl(url: string): boolean {
  try {
    // Strip tile URL template placeholders ({z}, {x}, {y}, {-y}, {subdomain} etc.)
    // before parsing so that valid tile URL templates are not rejected.
    const normalized = url.replace(/\{[^}]*\}/g, "0");
    const { protocol, hostname } = new URL(normalized);
    if (protocol === "https:") {
      // Block RFC-1918 private ranges, link-local, and IPv6 loopback/ULA to prevent SSRF
      return !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|fd[0-9a-f]{2}:|fe80:|::1$|\[::1\]$|\[fe80:)/.test(
        hostname,
      );
    }
    // Allow http:// only for true localhost (local dev servers)
    return (
      protocol === "http:" &&
      (hostname === "localhost" || hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shared position helper type used by multi-point shape schemas
// ---------------------------------------------------------------------------

export const latLonAltSchema = z.object({
  latitude: z.number().min(-90).max(90).describe("Latitude in decimal degrees (−90 … 90)"),
  longitude: z.number().min(-180).max(180).describe("Longitude in decimal degrees (−180 … 180)"),
  altitude: z
    .number()
    .optional()
    .describe("Altitude in metres above ellipsoid (default 0)"),
});
