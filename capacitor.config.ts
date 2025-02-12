import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.mostard",
  appName: "moStard",
  webDir: "dist",
  backgroundColor: "171819",
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
