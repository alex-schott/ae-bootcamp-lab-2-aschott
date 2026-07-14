const { expect, test } = require('@playwright/test');

const ShoppingListPage = require('./pages/ShoppingListPage');

test.describe('shopping list', () => {
  test('loads the seeded items', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();

    await expect(page.getByText('Milk')).toBeVisible();
    await expect(page.getByText('Eggs')).toBeVisible();
    await expect(page.getByText('Bread')).toBeVisible();
  });

  test('adds a new item', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await shoppingListPage.addItem('Coffee');

    await expect(page.getByText('Coffee')).toBeVisible();
  });

  test('toggles completion', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await shoppingListPage.toggleItem('Milk');

    await expect(page.getByLabel('Mark Milk complete')).toBeChecked();
    await expect(page.getByText('Milk')).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('edits an item inline', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await shoppingListPage.startEdit('Milk');
    await shoppingListPage.saveEdit('Milk', 'Oat Milk');

    await expect(page.getByText('Oat Milk')).toBeVisible();
    await expect(page.getByText('Milk', { exact: true })).toHaveCount(0);
  });

  test('reorders items with drag and drop', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await shoppingListPage.reorder('Eggs', 'Milk');

    const order = await shoppingListPage.itemOrder();

    expect(order[0]).toContain('Eggs');
    expect(order[1]).toContain('Milk');
  });

  test('switches color mode', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await page.getByLabel('toggle color mode').click();

    await expect(page.getByLabel('toggle color mode')).toBeVisible();
  });
});