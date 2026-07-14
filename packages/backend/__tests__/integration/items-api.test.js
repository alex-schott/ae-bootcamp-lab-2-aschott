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

  it('trims whitespace when creating and renaming an item', async () => {
    const createdItem = await createItem('   Coffee   ');
    expect(createdItem.name).toBe('Coffee');

    const renameResponse = await request(app)
      .patch(`/api/items/${createdItem.id}`)
      .send({ name: '   Cold Brew   ' });

    expect(renameResponse.status).toBe(200);
    expect(renameResponse.body.name).toBe('Cold Brew');
  });

  it('rejects blank names when creating', async () => {
    const response = await request(app).post('/api/items').send({ name: '    ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Item name is required' });
  });

  it('rejects invalid patch payloads', async () => {
    const createdItem = await createItem('Tea');

    const response = await request(app)
      .patch(`/api/items/${createdItem.id}`)
      .send({ completed: 'yes' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Completed must be a boolean' });
  });

  it('rejects patch requests with invalid path parameters', async () => {
    const response = await request(app)
      .patch('/api/items/not-a-number')
      .send({ completed: true });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Valid item ID is required' });
  });

  it('returns not found when patching or deleting missing items', async () => {
    const patchResponse = await request(app).patch('/api/items/99999').send({ completed: true });
    const deleteResponse = await request(app).delete('/api/items/99999');

    expect(patchResponse.status).toBe(404);
    expect(patchResponse.body).toEqual({ error: 'Item not found' });
    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body).toEqual({ error: 'Item not found' });
  });

  it('rejects patch requests that provide no update fields', async () => {
    const createdItem = await createItem('Tea');
    const response = await request(app).patch(`/api/items/${createdItem.id}`).send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'At least one field must be updated' });
  });

  it('rejects blank names when patching', async () => {
    const createdItem = await createItem('Sugar');
    const response = await request(app)
      .patch(`/api/items/${createdItem.id}`)
      .send({ name: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Item name is required' });
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

  it('rejects reorder requests with missing array payload', async () => {
    const response = await request(app).put('/api/items/reorder').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'orderedIds must be provided as an array' });
  });

  it('rejects reorder requests with duplicate ids', async () => {
    const seededItemsResponse = await request(app).get('/api/items');
    const [firstId, secondId] = seededItemsResponse.body.map((item) => item.id);
    const response = await request(app)
      .put('/api/items/reorder')
      .send({ orderedIds: [firstId, firstId, secondId] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'orderedIds must not contain duplicates' });
  });

  it('rejects reorder requests that do not match current item set', async () => {
    const seededItemsResponse = await request(app).get('/api/items');
    const seededIds = seededItemsResponse.body.map((item) => item.id);
    const response = await request(app)
      .put('/api/items/reorder')
      .send({ orderedIds: seededIds.slice(0, 2) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'orderedIds must match the current item set' });
  });

  it('deletes items through the API', async () => {
    const createdItem = await createItem('Delete Me');

    const deleteResponse = await request(app).delete(`/api/items/${createdItem.id}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: createdItem.id });

    const fetchResponse = await request(app).get('/api/items');
    expect(fetchResponse.body.find((item) => item.id === createdItem.id)).toBeUndefined();
  });

  it('rejects delete requests with invalid path parameters', async () => {
    const response = await request(app).delete('/api/items/not-a-number');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Valid item ID is required' });
  });
});