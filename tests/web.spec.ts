import { test, expect } from '@playwright/test';

test('can add a person via the form', async ({ page }) => {
  await page.goto('/');

  // Wait for sql.js + repository wiring to finish
  await page.waitForFunction(() => (window as any).api?.people?.save, null, { timeout: 20_000 });

  // Wait for RN-Web inputs to be present
  const first = page.getByTestId('firstName');
  const last = page.getByTestId('lastName');
  await first.waitFor({ timeout: 10_000 });
  await last.waitFor({ timeout: 10_000 });

  await first.fill('Ada');
  await last.fill('Lovelace');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Ada Lovelace')).toBeVisible({ timeout: 5_000 });
});
