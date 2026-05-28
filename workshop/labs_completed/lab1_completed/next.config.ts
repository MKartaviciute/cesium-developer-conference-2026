import type { NextConfig } from "next";

/** Public path where CesiumJS static assets are served (see public/cesium/). */
const CESIUM_BASE_URL = "/cesium";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Expose build-time constants to browser bundles.
  // NOTE: API keys are intentionally inlined here for this local workshop.
  // In production, move LLM calls to a server-side Route Handler.
  env: {
    CESIUM_BASE_URL,
    AI_PROVIDER: process.env.AI_PROVIDER ?? "openai",
    AI_MODEL: process.env.AI_MODEL ?? "",
    AI_BASE_URL: process.env.AI_BASE_URL ?? "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
    CESIUM_ION_ACCESS_TOKEN: process.env.CESIUM_ION_ACCESS_TOKEN ?? "",
  },

  // Inject CESIUM_BASE_URL into the CesiumJS package so it resolves
  // Workers / Assets / Widgets from the correct public path at compile time.
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
