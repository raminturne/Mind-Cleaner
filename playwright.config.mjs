import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "studio.spec.mjs",
  workers: 1,
  timeout: 30000,
  use: {
    channel: "msedge",
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 960 },
    headless: true,
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
