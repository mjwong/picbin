import { defineConfig, devices } from '@playwright/test';

// Load .env before workers spawn — globalSetup runs in separate process and won't propagate
try {
  process.loadEnvFile('.env');
} catch {}

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
