const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  fullyParallel: true,
  workers: "100%",
  use: {
    baseURL: "http://localhost:8080",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx --yes live-server --port=8080",
    url: "http://localhost:8080",
    reuseExistingServer: true,
  },
});
