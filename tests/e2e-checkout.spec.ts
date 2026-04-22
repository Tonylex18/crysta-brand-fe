import { test, expect, Page } from '@playwright/test';

test('smoke: signup -> verify -> add to cart -> checkout -> pay', async ({ page }) => {
  test.setTimeout(120_000);

  const baseUrl = 'http://localhost:5173';
  const email = `e2e_${Date.now()}@example.com`;
  const password = 'Password123!';
  let otp: string | null = null;

  const field = (p: Page, label: string) => p.locator(`label:has-text("${label}")`).locator('..').locator('input, select');

  page.on('response', async (response) => {
    if (!response.url().includes('/api/user/sign-up')) return;
    try {
      const data = await response.json();
      if (data?.otp) {
        otp = String(data.otp);
      }
    } catch {
      // ignore
    }
  });

  await page.goto(`${baseUrl}/auth`);
  await page.waitForLoadState('networkidle');
  const toggle = page.getByText("Don't have an account? Sign up");
  await expect(toggle).toBeVisible();
  await toggle.click();

  await page.getByPlaceholder('Jane Doe').fill('E2E User');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Sign Up' }).click();

  await expect(page).toHaveURL(/verify-email/);
  await expect.poll(() => otp, { timeout: 15000 }).not.toBeNull();

  await page.getByPlaceholder('123456').fill(otp as string);
  await page.getByRole('button', { name: 'Verify Email' }).click();

  await expect(page).toHaveURL(/dashboard/);

  await page.goto(baseUrl);
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();

  await page.goto(`${baseUrl}/cart`);
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();

  await expect(page).toHaveURL(/checkout/);
  await field(page, 'State').selectOption('Lagos');
  await field(page, 'City').fill('Ikeja');
  await field(page, 'Street Address').fill('12 Allen Avenue');
  await field(page, 'Phone').fill('08012345678');
  await page.getByRole('button', { name: 'Save address & get shipping options' }).click();

  await page.getByRole('button', { name: 'Pay with Paystack' }).click();
  await page.waitForURL(/paystack\.com/, { timeout: 20000 });
});
