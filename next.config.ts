const withPWA = require("next-pwa")({
  dest: "public", // Output directory for service worker files
  register: true, // Registers the service worker
  skipWaiting: true, // Forces the waiting service worker to activate immediately
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev mode
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Outputs a Single-Page Application (SPA)
  distDir: "build", // Changes the build output directory to `build`

  // Base path from the Vite config
  basePath: process.env.VITE_BASE ?? "",

  // Enable source maps in production (similar to Vite's sourcemap: true)
  productionBrowserSourceMaps: true,

  // Environment variables (mimicking Vite's VITE_* usage)
  env: {
    VITE_BASE: process.env.VITE_BASE,
  },

  // Custom Webpack configuration to polyfill `crypto` for client-side
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide a fallback for Node.js `crypto` module on the client
      config.resolve.fallback = {
        ...config.resolve.fallback, // Preserve any existing fallbacks
        crypto: require.resolve("@peculiar/webcrypto"),
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
