import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('signs in with valid credentials and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Organization').fill('acme');
    await page.getByLabel('Email').fill('admin@acme.com');
    await page.getByLabel('Password').fill('DemoPassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('shows an error for invalid credentials without navigating away', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Organization').fill('acme');
    await page.getByLabel('Email').fill('admin@acme.com');
    await page.getByLabel('Password').fill('WrongPassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid organization, email, or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('requires all three fields before submitting', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Organization is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('redirects an unauthenticated visitor away from a protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
