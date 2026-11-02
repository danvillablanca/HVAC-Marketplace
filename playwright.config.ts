import { defineConfig, devices } from "@playwright/test";

const API_PORT = process.env.E2E_API_PORT ?? "3101";
const WEB_PORT = process.env.E2E_WEB_PORT ?? "5173";
const apiUrl = `http://localhost:${API_PORT}`;
const webUrl = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: webUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `pnpm --filter @hvac/backend exec next dev -p ${API_PORT}`,
      url: `${apiUrl}/api/health`,
      // La suite E2E corre en modo demo (sin Supabase), igual que en CI.
      env: { DEMO_MODE: "true", FRONTEND_ORIGIN: webUrl },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @hvac/frontend exec vite --port ${WEB_PORT} --strictPort`,
      url: webUrl,
      env: { VITE_API_BASE_URL: apiUrl, VITE_DEMO_MODE: "true" },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
