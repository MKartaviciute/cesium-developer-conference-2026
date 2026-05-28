/**
 * Global identifier injected by webpack DefinePlugin (see next.config.ts).
 * Replaced with a literal string value at webpack compile time.
 *
 * When building with Turbopack (Next.js 16 default), this global is not
 * injected — CesiumJS falls back to window.CESIUM_BASE_URL set at runtime
 * in CesiumViewer.tsx before the dynamic import.
 */

/** Public base path where CesiumJS static assets are served. */
declare const CESIUM_BASE_URL: string;
