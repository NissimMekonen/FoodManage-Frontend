const { test, expect } = require('@playwright/test');

const ADMIN_USER = 'grillroyal_admin';
const ADMIN_PASS = 'GrillRoyal1!';

test.describe('התחברות והרשמה', () => {

  test('דף ההתחברות נטען ומציג את שם המערכת', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('FoodManage');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('התחברות עם פרטים שגויים מציגה שגיאה', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('התחברות מוצלחת מעבירה ללוח הבקרה', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="username"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await expect(page.locator('h1')).toContainText('לוח הבקרה', { timeout: 10000 });
  });

  test('לחיצה על שכחתי סיסמה מציגה את הטופס המתאים', async ({ page }) => {
    await page.goto('/');
    await page.click('text=שכחתי סיסמה');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

});
