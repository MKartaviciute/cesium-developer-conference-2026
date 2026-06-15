import type { NextConfig } from "next";
import { validateEnv } from "./src/server/env";

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
    // API keys (AI_BASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY) are
    // intentionally omitted here.  They are read server-side only inside
    // src/app/api/chat/route.ts so they never reach the browser bundle.
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
