#!/usr/bin/env node
/**
 * Copies CesiumJS static assets (Workers, Assets, Widgets) from the npm
 * package into public/cesium/ so Next.js can serve them at /cesium/*.
 *
 * Run automatically via the `postinstall` npm lifecycle hook, or manually:
 *   node scripts/copy-cesium-assets.mjs
 */
import { cpSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const src = join(root, "node_modules", "cesium", "Build", "Cesium");
const dest = join(root, "public", "cesium");

if (!existsSync(src)) {
  console.warn(
    "⚠  cesium package not found — skipping asset copy (run `pnpm install` first)",
  );
  process.exit(0);
}

for (const dir of ["Workers", "Assets", "Widgets"]) {
  cpSync(join(src, dir), join(dest, dir), { recursive: true });
  console.log(`✓ Copied cesium/${dir} → public/cesium/${dir}`);
}

console.log("✓ CesiumJS static assets ready in public/cesium/");
