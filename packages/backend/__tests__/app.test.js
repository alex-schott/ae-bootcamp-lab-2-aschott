const request = require('supertest');
const { app, db, resetDatabase } = require('../src/app');

beforeEach(() => {
  resetDatabase();
});

afterAll(() => {
  db.close();
});

async function createItem(name = 'Temp Item') {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  return response.body;
}

describe('shopping list API', () => {
  it('returns seeded items in display order', async () => {
    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body.map((item) => item.name)).toEqual(['Milk', 'Eggs', 'Bread']);
    expect(response.body[0]).toMatchObject({ id: expect.any(Number), completed: false, position: 0 });
  });

  it('creates a new item at the end of the list', async () => {
    const item = await createItem('Coffee');

    expect(item).toMatchObject({
      id: expect.any(Number),
      name: 'Coffee',
      completed: false,
      position: 3,
    });
  });

  it('rejects blank item names', async () => {
    const response = await request(app).post('/api/items').send({ name: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Item name is required' });
  });

  it('updates item text without losing completion state', async () => {
    const item = await createItem('Old Name');

    const completionResponse = await request(app)
      .patch(`/api/items/${item.id}`)
      .send({ completed: true });

    expect(completionResponse.status).toBe(200);
    expect(completionResponse.body).toMatchObject({ completed: true, name: 'Old Name' });

    const renameResponse = await request(app)
      .patch(`/api/items/${item.id}`)
      .send({ name: 'New Name' });

    expect(renameResponse.status).toBe(200);
    expect(renameResponse.body).toMatchObject({ name: 'New Name', completed: true });
  });

  it('reorders items and keeps item data attached to each id', async () => {
    const initialItems = (await request(app).get('/api/items')).body;
    const first = await createItem('First');
    const second = await createItem('Second');

    await request(app).patch(`/api/items/${second.id}`).send({ completed: true });

    const response = await request(app)
      .put('/api/items/reorder')
      .send({
        orderedIds: [second.id, first.id, ...initialItems.map((item) => item.id)],
      });

    expect(response.status).toBe(200);
    expect(response.body.map((item) => item.id)).toEqual([
      second.id,
      first.id,
      ...initialItems.map((item) => item.id),
    ]);
    expect(response.body[0]).toMatchObject({ name: 'Second', completed: true, position: 0 });
    expect(response.body[1]).toMatchObject({ name: 'First', completed: false, position: 1 });
  });

  it('rejects invalid reorder payloads', async () => {
    const response = await request(app).put('/api/items/reorder').send({ orderedIds: ['x'] });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('valid item IDs');
  });

  it('deletes an existing item', async () => {
    const item = await createItem('Delete Me');

    const deleteResponse = await request(app).delete(`/api/items/${item.id}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });
  });
});