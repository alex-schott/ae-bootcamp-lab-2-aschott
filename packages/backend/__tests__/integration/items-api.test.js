const request = require('supertest');

const { app, db, resetDatabase } = require('../../src/app');

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

describe('shopping list integration API', () => {
  it('returns seeded items in the persisted order', async () => {
    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body.map((item) => item.name)).toEqual(['Milk', 'Eggs', 'Bread']);
    expect(response.body.every((item) => typeof item.completed === 'boolean')).toBe(true);
  });

  it('creates, updates, and preserves item state across requests', async () => {
    const createdItem = await createItem('Coffee');

    const completedResponse = await request(app)
      .patch(`/api/items/${createdItem.id}`)
      .send({ completed: true });

    expect(completedResponse.status).toBe(200);
    expect(completedResponse.body).toMatchObject({ name: 'Coffee', completed: true });

    const renamedResponse = await request(app)
      .patch(`/api/items/${createdItem.id}`)
      .send({ name: 'Cold Brew' });

    expect(renamedResponse.status).toBe(200);
    expect(renamedResponse.body).toMatchObject({ name: 'Cold Brew', completed: true });

    const fetchedResponse = await request(app).get('/api/items');
    const fetchedItem = fetchedResponse.body.find((item) => item.id === createdItem.id);

    expect(fetchedItem).toMatchObject({ name: 'Cold Brew', completed: true });
  });

  it('rejects invalid patch payloads', async () => {
    const createdItem = await createItem('Tea');

    const response = await request(app)
      .patch(`/api/items/${createdItem.id}`)
      .send({ completed: 'yes' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Completed must be a boolean' });
  });

  it('reorders items and keeps their completion state tied to the id', async () => {
    const seededItemsResponse = await request(app).get('/api/items');
    const seededIds = seededItemsResponse.body.map((item) => item.id);
    const firstItem = await createItem('First');
    const secondItem = await createItem('Second');

    await request(app).patch(`/api/items/${secondItem.id}`).send({ completed: true });

    const reorderResponse = await request(app)
      .put('/api/items/reorder')
      .send({ orderedIds: [secondItem.id, firstItem.id, ...seededIds] });

    expect(reorderResponse.status).toBe(200);
    expect(reorderResponse.body.map((item) => item.id)).toEqual([
      secondItem.id,
      firstItem.id,
      ...seededIds,
    ]);
    expect(reorderResponse.body[0]).toMatchObject({ name: 'Second', completed: true, position: 0 });
    expect(reorderResponse.body[1]).toMatchObject({ name: 'First', completed: false, position: 1 });
  });

  it('deletes items through the API', async () => {
    const createdItem = await createItem('Delete Me');

    const deleteResponse = await request(app).delete(`/api/items/${createdItem.id}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: createdItem.id });

    const fetchResponse = await request(app).get('/api/items');
    expect(fetchResponse.body.find((item) => item.id === createdItem.id)).toBeUndefined();
  });
});