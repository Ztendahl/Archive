import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  use: {
    headless: true,
    baseURL: 'http://localhost:4173',
  },
  webServer: [
    { command: 'npm run build:web', reuseExistingServer: !process.env.CI },
    { command: 'npm run serve:web', url: 'http://localhost:4173', timeout: 120_000 },
  ],
});
