const request = require('supertest');
const { app, db, getAllItems, getItemById, normalizeItem, resetDatabase } = require('../src/app');

beforeEach(() => {
  resetDatabase();
});

afterAll(() => {
  db.close();
});

describe('app unit coverage', () => {
  it('reports health from the root endpoint', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      message: 'Backend server is running',
    });
  });

  it('normalizes sqlite booleans to JavaScript booleans', () => {
    expect(normalizeItem(null)).toBeNull();
    expect(normalizeItem({ id: 7, name: 'Coffee', completed: 0 })).toEqual({
      id: 7,
      name: 'Coffee',
      completed: false,
    });
    expect(normalizeItem({ id: 8, name: 'Tea', completed: 1 })).toEqual({
      id: 8,
      name: 'Tea',
      completed: true,
    });
  });

  it('returns seeded items from helper queries in display order', () => {
    const items = getAllItems();

    expect(items.map((item) => item.name)).toEqual(['Milk', 'Eggs', 'Bread']);
    expect(items.map((item) => item.position)).toEqual([0, 1, 2]);
    expect(items.every((item) => typeof item.completed === 'boolean')).toBe(true);
  });

  it('returns null from helper lookup when item does not exist', () => {
    expect(getItemById(999999)).toBeNull();
  });

  it('resetDatabase restores seeded rows after direct mutation', () => {
    db.prepare('INSERT INTO items (name, completed, position) VALUES (?, ?, ?)').run('Coffee', 1, 3);
    expect(getAllItems()).toHaveLength(4);

    resetDatabase();

    const items = getAllItems();
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.name)).toEqual(['Milk', 'Eggs', 'Bread']);
  });
});