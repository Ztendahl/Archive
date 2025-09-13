import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';

let server;

async function waitForServer(url: string, retries = 50): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.request(url, (res) => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.end();
      });
      return;
    } catch {
      // retry after a short delay
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('Server did not start');
}

test.beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    const build = spawn('npm', ['run', 'build:web'], { stdio: 'inherit' });
    build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build failed'))));
  });

  server = spawn('npm', ['run', 'serve:web'], { stdio: 'inherit' });
  await waitForServer('http://localhost:4173');
});

test.afterAll(() => {
  server.kill();
});

test('form submit adds a row', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await page.fill('input[placeholder="First Name"]', 'John');
  await page.fill('input[placeholder="Last Name"]', 'Doe');
  await page.click('text=Save');
  await expect(page.locator('text=John Doe')).toBeVisible();
});
