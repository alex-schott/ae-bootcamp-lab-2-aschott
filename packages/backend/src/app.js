const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

const INITIAL_ITEMS = ['Milk', 'Eggs', 'Bread'];

const app = express();
const db = new Database(':memory:');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertStmt = db.prepare(
  'INSERT INTO items (name, completed, position) VALUES (?, ?, ?)'
);
const selectItemStmt = db.prepare(
  'SELECT id, name, completed, position, created_at FROM items WHERE id = ?'
);
const selectItemsStmt = db.prepare(
  'SELECT id, name, completed, position, created_at FROM items ORDER BY position ASC, id ASC'
);
const selectNextPositionStmt = db.prepare(
  'SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM items'
);
const updatePositionStmt = db.prepare('UPDATE items SET position = ? WHERE id = ?');

function normalizeItem(item) {
  if (!item) {
    return null;
  }

  return {
    ...item,
    completed: Boolean(item.completed),
  };
}

function getItemById(id) {
  return normalizeItem(selectItemStmt.get(id));
}

function getAllItems() {
  return selectItemsStmt.all().map(normalizeItem);
}

function seedInitialItems() {
  INITIAL_ITEMS.forEach((name, position) => {
    insertStmt.run(name, 0, position);
  });
}

function resetDatabase() {
  db.prepare('DELETE FROM items').run();
  seedInitialItems();
}

resetDatabase();

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

app.get('/api/items', (req, res) => {
  try {
    res.json(getAllItems());
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const nextPosition = selectNextPositionStmt.get().nextPosition;
    const result = insertStmt.run(name, 0, nextPosition);

    res.status(201).json(getItemById(result.lastInsertRowid));
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.patch('/api/items/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = getItemById(id);

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

      if (!name) {
        return res.status(400).json({ error: 'Item name is required' });
      }

      updates.push('name = ?');
      values.push(name);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'completed')) {
      if (typeof req.body.completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean' });
      }

      updates.push('completed = ?');
      values.push(req.body.completed ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'At least one field must be updated' });
    }

    values.push(id);
    db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json(getItemById(id));
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.put('/api/items/reorder', (req, res) => {
  try {
    const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : null;

    if (!orderedIds) {
      return res.status(400).json({ error: 'orderedIds must be provided as an array' });
    }

    const parsedIds = orderedIds.map((id) => Number.parseInt(id, 10));

    if (parsedIds.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: 'orderedIds must contain valid item IDs' });
    }

    const uniqueIds = new Set(parsedIds);

    if (uniqueIds.size !== parsedIds.length) {
      return res.status(400).json({ error: 'orderedIds must not contain duplicates' });
    }

    const currentIds = getAllItems().map((item) => item.id);
    const matchesCurrentOrder =
      currentIds.length === parsedIds.length &&
      currentIds.every((id) => uniqueIds.has(id));

    if (!matchesCurrentOrder) {
      return res.status(400).json({ error: 'orderedIds must match the current item set' });
    }

    const updateOrder = db.transaction((ids) => {
      ids.forEach((id, position) => {
        updatePositionStmt.run(position, id);
      });
    });

    updateOrder(parsedIds);

    res.json(getAllItems());
  } catch (error) {
    console.error('Error reordering items:', error);
    res.status(500).json({ error: 'Failed to reorder items' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = getItemById(id);

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id });
      return;
    }

    res.status(404).json({ error: 'Item not found' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = {
  app,
  db,
  getAllItems,
  getItemById,
  normalizeItem,
  resetDatabase,
};