import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Business Units admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings/business-units');
  });

  test('creates a business unit and it appears in the list', async ({ page }) => {
    const name = `E2E Unit ${Date.now()}`;
    const code = `E2E${Date.now() % 10000}`;

    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="code"]').fill(code);
    await page.getByRole('button', { name: 'Add business unit' }).click();

    await expect(page.getByText(`${name} (${code.toUpperCase()})`)).toBeVisible();
  });

  test('edits a business unit inline', async ({ page }) => {
    const name = `E2E Editable ${Date.now()}`;
    const code = `EDIT${Date.now() % 10000}`;
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="code"]').fill(code);
    await page.getByRole('button', { name: 'Add business unit' }).click();
    await expect(page.getByText(`${name} (${code.toUpperCase()})`)).toBeVisible();

    const row = page.locator('tr', { hasText: name });
    await row.getByRole('button', { name: 'Edit' }).click();

    const renamed = `${name} Renamed`;
    
    
    
    
    
    await row.locator('input').first().fill(renamed);
    await row.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(renamed, { exact: false })).toBeVisible();
  });

  test('refuses to delete a business unit that a department still references', async ({ page }) => {
    const name = `E2E Guarded ${Date.now()}`;
    const code = `GRD${Date.now() % 10000}`;
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="code"]').fill(code);
    await page.getByRole('button', { name: 'Add business unit' }).click();
    await expect(page.getByText(`${name} (${code.toUpperCase()})`)).toBeVisible();

    
    
    await page.goto('/settings/departments');
    await page.locator('input[name="name"]').fill(`E2E Dept ${Date.now()}`);
    await page.locator('input[name="code"]').fill(`D${Date.now() % 10000}`);
    await page.locator('select[name="businessUnit"]').selectOption({ label: name });
    await page.getByRole('button', { name: 'Add department' }).click();

    await page.goto('/settings/business-units');
    page.once('dialog', (dialog) => dialog.accept());
    const row = page.locator('tr', { hasText: name });
    await row.getByRole('button', { name: 'Delete' }).click();

    await expect(
      page.getByText(/still has child units, departments, users, or contracts/i)
    ).toBeVisible();
    
    
    await expect(page.getByText(`${name} (${code.toUpperCase()})`)).toBeVisible();
  });
});
