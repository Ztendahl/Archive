import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  use: {
    headless: true,
    baseURL: 'http://localhost:19006',
  },
  webServer: {
    command: 'npm run web',
    url: 'http://localhost:19006',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
