// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:9000",
    headless: true,
  },
  webServer: {
    command: "python3 run_dev.py",
    url: "http://127.0.0.1:9000",
    timeout: 120000,
    reuseExistingServer: true,
  },
});
