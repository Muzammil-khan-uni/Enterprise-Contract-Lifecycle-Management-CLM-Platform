import type { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Organization').fill('acme');
  await page.getByLabel('Email').fill('admin@acme.com');
  await page.getByLabel('Password').fill('DemoPassword123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard$/);
}
