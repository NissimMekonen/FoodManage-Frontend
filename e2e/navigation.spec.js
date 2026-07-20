const { test, expect } = require('@playwright/test');

const ADMIN_USER = 'grillroyal_admin';
const ADMIN_PASS = 'GrillRoyal1!';

async function login(page) {
  await page.goto('/');
  await page.fill('input[name="username"]', ADMIN_USER);
  await page.fill('input[name="password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');
  await expect(page.locator('h1')).toContainText('לוח הבקרה', { timeout: 10000 });
}

test.describe('ניווט במערכת', () => {

  test('Admin רואה את כל פריטי התפריט', async ({ page }) => {
    await login(page);
    const nav = page.locator('.sidebar-nav');
    await expect(nav.getByText('ניהול מלאי')).toBeVisible();
    await expect(nav.getByText('ספקים')).toBeVisible();
    await expect(nav.getByText('תפריט שבועי')).toBeVisible();
    await expect(nav.getByText('ניהול צוות')).toBeVisible();
  });

  test('ניווט לספקים', async ({ page }) => {
    await login(page);
    await page.click('text=ספקים');
    await expect(page.locator('h1')).toContainText('ספקים');
  });

  test('ניווט לתפריט שבועי', async ({ page }) => {
    await login(page);
    await page.click('text=תפריט שבועי');
    await expect(page.locator('h1')).toContainText('תפריט שבועי');
  });

  test('התנתקות מחזירה לדף ההתחברות', async ({ page }) => {
    await login(page);
    await page.click('.sidebar-logout');
    await expect(page.locator('h1')).toContainText('FoodManage', { timeout: 5000 });
  });

});
