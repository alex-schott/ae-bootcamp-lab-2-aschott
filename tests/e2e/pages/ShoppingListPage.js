class ShoppingListPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async addItem(name) {
    await this.page.getByLabel('New item').fill(name);
    await this.page.getByRole('button', { name: 'Add item' }).click();
  }

  async toggleItem(name) {
    await this.page.getByLabel(`Mark ${name} complete`).click();
  }

  async startEdit(name) {
    await this.page.getByRole('button', { name: `Edit ${name}` }).click();
  }

  async saveEdit(originalName, nextName) {
    const editor = this.page.getByLabel(`Edit ${originalName}`);
    await editor.fill(nextName);
    await this.page.getByRole('button', { name: 'Save item name' }).click();
  }

  async reorder(sourceName, targetName) {
    const sourceHandle = this.page.getByRole('button', { name: `Reorder ${sourceName}` });
    const targetRow = this.page.getByRole('listitem').filter({ hasText: targetName });

    await sourceHandle.dragTo(targetRow);
  }

  async itemOrder() {
    const rows = this.page.getByRole('listitem');
    const rowCount = await rows.count();
    const order = [];

    for (let index = 0; index < rowCount; index += 1) {
      order.push(await rows.nth(index).textContent());
    }

    return order;
  }

  async itemNames() {
    const checkboxes = this.page.getByRole('checkbox');
    const count = await checkboxes.count();
    const names = [];

    for (let index = 0; index < count; index += 1) {
      const ariaLabel = await checkboxes.nth(index).getAttribute('aria-label');
      names.push((ariaLabel || '').replace(/^Mark\s+/, '').replace(/\s+complete$/, ''));
    }

    return names;
  }
}

module.exports = ShoppingListPage;