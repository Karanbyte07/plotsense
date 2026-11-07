import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

export default defineConfig({
  testDir: "./frontend/tests/browser",
  outputDir: "./generated-artifacts/playwright",
  use: {
    baseURL: "http://127.0.0.1:5000",
    reducedMotion: "reduce",
    launchOptions: {
      executablePath: existsSync("/repl/tools/bin/chromium") ? "/repl/tools/bin/chromium" : undefined,
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5000",
    reuseExistingServer: true,
  },
});
