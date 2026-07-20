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

test.describe('ניהול מלאי', () => {

  test('ניווט למלאי מציג את רשימת המוצרים', async ({ page }) => {
    await login(page);
    await page.click('text=ניהול מלאי');
    await expect(page.locator('h1')).toContainText('ניהול מלאי');
    await expect(page.locator('.inventory-table, .inv-table, table, .product-row').first()).toBeVisible({ timeout: 8000 });
  });

  test('הוספת מוצר חדש מופיע ברשימה', async ({ page }) => {
    await login(page);
    await page.click('text=ניהול מלאי');

    const productName = `בדיקה${Date.now()}`;

    await page.click('.add-ingredient-btn');
    await expect(page.locator('.add-modal-box')).toBeVisible();

    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="quantity"]', '10');
    await page.fill('input[name="minQuantity"]', '2');

    await page.click('button:has-text("הוסף למזווה")');

    // ממתין שהמודל ייסגר ורשימת המוצרים תתרענן
    await expect(page.locator('.add-modal-box')).toBeHidden({ timeout: 8000 });

    // מחפש את המוצר בשורת החיפוש ומוודא שהוא מופיע
    await page.fill('.modern-search-input', productName);
    await expect(page.getByText(productName).first()).toBeVisible({ timeout: 8000 });
  });

  test('לוח הבקרה מציג כרטיסי סטטיסטיקה', async ({ page }) => {
    await login(page);
    await expect(page.locator('.stat-card').first()).toBeVisible({ timeout: 8000 });
  });

});
