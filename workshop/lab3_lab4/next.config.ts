import type { NextConfig } from "next";
import { validateEnv } from "./src/lib/env";

validateEnv();

/** Public path where CesiumJS static assets are served (see public/cesium/). */
const CESIUM_BASE_URL = "/cesium";

const nextConfig: NextConfig = {
  // Expose build-time constants via process.env — works with both Turbopack and webpack.
  env: {
    CESIUM_BASE_URL,
    CESIUM_ION_ACCESS_TOKEN: process.env.CESIUM_ION_ACCESS_TOKEN ?? "",
    AI_PROVIDER: process.env.AI_PROVIDER ?? "openai",
    AI_MODEL: process.env.AI_MODEL ?? "",
    // SECURITY NOTE (C-1/C-2, H-3): AI_BASE_URL, OPENAI_API_KEY, and
    // ANTHROPIC_API_KEY are intentionally placed here for the current
    // client-side architecture.  These values are inlined into the browser
    // bundle.  Before any public deployment, move LLM calls to a server-side
    // Next.js Route Handler and remove these keys from this `env` block so
    // they remain server-only secrets.  See docs/ARCHITECTURE-COMPARISON.md.
    AI_BASE_URL: process.env.AI_BASE_URL ?? "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  },

  // HTTP security response headers applied to every route.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  devIndicators: false,
  // Pin Turbopack's root to this lab directory so it doesn't climb up to the
  // monorepo root and emit a "multiple lockfiles" warning.
  turbopack: {
    root: __dirname,
  },

  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL),
      }),
    );
    return config;
  },
};

export default nextConfig;
