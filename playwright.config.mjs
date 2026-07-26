import { defineConfig } from "@playwright/test";

const host = "127.0.0.1";
const port = 4177;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results/playwright",
  globalTeardown: "./tests/helpers/browser-test-teardown.mjs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: {
    timeout: 7_500
  },
  reporter: [["line"]],
  webServer: {
    command: "node tests/helpers/browser-test-server.mjs",
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 15_000,
    env: {
      PLAYWRIGHT_TEST_HOST: host,
      PLAYWRIGHT_TEST_PORT: String(port)
    }
  },
  use: {
    baseURL,
    browserName: "chromium",
    serviceWorkers: "block",
    locale: "en-US",
    timezoneId: "America/New_York",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    permissions: ["clipboard-read", "clipboard-write"],
    launchOptions: {
      args: [
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-domain-reliability",
        "--disable-sync"
      ]
    }
  },
  projects: [
    {
      name: "desktop",
      use: {
        viewport: { width: 1440, height: 900 },
        hasTouch: false,
        isMobile: false
      }
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true
      }
    }
  ]
});
