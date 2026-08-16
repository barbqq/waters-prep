import { defineConfig, devices } from "@playwright/test";

import { config } from "@core/config";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [["html", { open: "never" }], ["list"]],

  expect: { timeout: config.timeouts.assertion },

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: config.timeouts.action,
    navigationTimeout: config.timeouts.navigation,
  },

  projects: [
    {
      name: "ui",
      testDir: "./tests/ui",
      use: { ...devices["Desktop Chrome"], baseURL: config.ui.baseURL },
    },
    {
      name: "api",
      testDir: "./tests/api",
    },
    {
      name: "opcua",
      testDir: "./tests/opcua",
    },
  ],
});
