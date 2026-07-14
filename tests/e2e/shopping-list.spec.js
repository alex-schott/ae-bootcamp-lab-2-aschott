const { expect, test } = require('@playwright/test');

const ShoppingListPage = require('./pages/ShoppingListPage');

async function ensureMinimumItems(shoppingListPage, count) {
  let names = await shoppingListPage.itemNames();

  while (names.length < count) {
    await shoppingListPage.addItem(`Generated item ${Date.now()} ${names.length}`);
    names = await shoppingListPage.itemNames();
  }

  return names;
}

test.describe('shopping list', () => {
  test('loads the shopping list UI and existing items', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();

    await expect(page.getByLabel('New item')).toBeVisible();
    await expect(page.getByRole('listitem').first()).toBeVisible();
  });

  test('adds a new item', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);
    const uniqueName = `Coffee ${Date.now()}`;

    await shoppingListPage.goto();
    await shoppingListPage.addItem(uniqueName);

    await expect(page.getByText(uniqueName, { exact: true })).toBeVisible();
  });

  test('disables add button for whitespace-only input', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await page.getByLabel('New item').fill('   ');

    await expect(page.getByRole('button', { name: 'Add item' })).toBeDisabled();
  });

  test('toggles completion', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    const [firstItemName] = await ensureMinimumItems(shoppingListPage, 1);
    const checkbox = page.getByLabel(`Mark ${firstItemName} complete`);
    const wasChecked = await checkbox.isChecked();
    await shoppingListPage.toggleItem(firstItemName);

    if (wasChecked) {
      await expect(checkbox).not.toBeChecked();
      await expect(page.getByText(firstItemName, { exact: true })).toHaveCSS('text-decoration-line', 'none');
      return;
    }

    await expect(checkbox).toBeChecked();
    await expect(page.getByText(firstItemName, { exact: true })).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('edits an item inline', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    const [originalName] = await ensureMinimumItems(shoppingListPage, 1);
    const updatedName = `${originalName} updated`;
    await shoppingListPage.startEdit(originalName);
    await shoppingListPage.saveEdit(originalName, updatedName);

    await expect(page.getByText(updatedName, { exact: true })).toBeVisible();
    await expect(page.getByText(originalName, { exact: true })).toHaveCount(0);
  });

  test('reorders items with drag and drop', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    const initialNames = await ensureMinimumItems(shoppingListPage, 2);
    const sourceName = initialNames[1];
    const targetName = initialNames[0];
    await shoppingListPage.reorder(sourceName, targetName);

    const names = await shoppingListPage.itemNames();

    expect(names[0]).toBe(sourceName);
    expect(names[1]).toBe(targetName);
  });

  test('keeps reorder state after a page reload', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    const initialNames = await ensureMinimumItems(shoppingListPage, 2);
    const sourceName = initialNames[1];
    const targetName = initialNames[0];
    await shoppingListPage.reorder(sourceName, targetName);
    await page.reload();
    await expect(page.getByRole('listitem').first()).toBeVisible();

    const names = await shoppingListPage.itemNames();

    expect(names[0]).toBe(sourceName);
    expect(names[1]).toBe(targetName);
  });

  test('switches color mode', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await page.getByLabel('toggle color mode').click();

    await expect(page.getByLabel('toggle color mode')).toBeVisible();
  });

  test('persists color mode selection in localStorage', async ({ page }) => {
    const shoppingListPage = new ShoppingListPage(page);

    await shoppingListPage.goto();
    await page.getByLabel('toggle color mode').click();
    await page.reload();

    await expect(page.getByLabel('toggle color mode')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('shopping-list-theme-mode')))
      .toBe('dark');
  });
});