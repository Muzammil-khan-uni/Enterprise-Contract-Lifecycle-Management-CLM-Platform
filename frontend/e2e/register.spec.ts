import { test, expect } from '@playwright/test';

test.describe('Organization sign-up', () => {
  test('creates a new organization and lands signed in on the dashboard', async ({ page }) => {
    const suffix = Date.now();
    await page.goto('/register');

    await page.getByLabel('Organization name').fill(`E2E Test Org ${suffix}`);
    
    
    await expect(page.getByLabel('Organization slug')).toHaveValue(new RegExp(`e2e-test-org-${suffix}`));

    await page.getByLabel('Your name').fill('E2E Test Admin');
    await page.getByLabel('Email').fill(`e2e-admin-${suffix}@example.com`);
    await page.getByLabel('Password').fill('SuperSecret123');
    await page.getByRole('button', { name: 'Create organization' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('rejects a password that fails the strength rules', async ({ page }) => {
    const suffix = Date.now();
    await page.goto('/register');

    await page.getByLabel('Organization name').fill(`E2E Weak Pw Org ${suffix}`);
    await page.getByLabel('Your name').fill('E2E Test Admin');
    await page.getByLabel('Email').fill(`e2e-weak-${suffix}@example.com`);
    await page.getByLabel('Password').fill('weak');
    await page.getByRole('button', { name: 'Create organization' }).click();

    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('links to and from the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page).toHaveURL(/\/register$/);

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
