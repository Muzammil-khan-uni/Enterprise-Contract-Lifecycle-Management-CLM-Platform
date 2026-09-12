import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Contract creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('creates a contract and lands on its detail page', async ({ page }) => {
    await page.goto('/contracts/new');

    const title = `E2E Test Contract ${Date.now()}`;
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="contractType"]').selectOption('Vendor');

    
    
    
    
    
    const businessUnitSelect = page.locator('select[name="businessUnit"]');
    await businessUnitSelect.selectOption({ index: 1 });

    const departmentSelect = page.locator('select[name="department"]');
    await expect(departmentSelect).toBeEnabled();
    await departmentSelect.selectOption({ index: 1 });

    await page.getByRole('button', { name: 'Create Contract' }).click();

    await expect(page).toHaveURL(/\/contracts\/[a-f0-9]{24}$/);
    await expect(page.getByText(title)).toBeVisible();
  });

  test('shows validation errors when required fields are missing', async ({ page }) => {
    await page.goto('/contracts/new');
    await page.getByRole('button', { name: 'Create Contract' }).click();

    await expect(page.getByText('Title is required')).toBeVisible();
  });

  test('disables the department select until a business unit is chosen', async ({ page }) => {
    await page.goto('/contracts/new');

    const departmentSelect = page.locator('select[name="department"]');
    await expect(departmentSelect).toBeDisabled();

    await page.locator('select[name="businessUnit"]').selectOption({ index: 1 });
    await expect(departmentSelect).toBeEnabled();
  });
});

test.describe('Contract list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('a newly created contract appears in the list', async ({ page }) => {
    await page.goto('/contracts/new');
    const title = `E2E List Test ${Date.now()}`;
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="contractType"]').selectOption('Service');
    await page.locator('select[name="businessUnit"]').selectOption({ index: 1 });
    await page.locator('select[name="department"]').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Create Contract' }).click();
    await page.waitForURL(/\/contracts\/[a-f0-9]{24}$/);

    await page.goto('/contracts');
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  });

  test('filtering by status narrows the list', async ({ page }) => {
    await page.goto('/contracts');
    await page.locator('select').first().selectOption('Draft');
    
    
    
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('Draft');
    }
  });
});
