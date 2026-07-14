import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import App from '../App';

let items = [];

function resetItems() {
  items = [
    { id: 1, name: 'Milk', completed: false, position: 0, created_at: '2023-01-01T00:00:00.000Z' },
    { id: 2, name: 'Eggs', completed: false, position: 1, created_at: '2023-01-02T00:00:00.000Z' },
    { id: 3, name: 'Bread', completed: false, position: 2, created_at: '2023-01-03T00:00:00.000Z' },
  ];
}

const defaultHandlers = [
  rest.get('/api/items', (req, res, ctx) => res(ctx.status(200), ctx.json(items))),
  rest.post('/api/items', async (req, res, ctx) => {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }

    const newItem = {
      id: items.length + 1,
      name,
      completed: false,
      position: items.length,
      created_at: new Date().toISOString(),
    };

    items = [...items, newItem];

    return res(ctx.status(201), ctx.json(newItem));
  }),
  rest.patch('/api/items/:id', async (req, res, ctx) => {
    const id = Number.parseInt(req.params.id, 10);
    const body = await req.json();
    const currentItem = items.find((item) => item.id === id);

    if (!currentItem) {
      return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    }

    const updatedItem = {
      ...currentItem,
      ...('name' in body ? { name: body.name.trim() } : {}),
      ...('completed' in body ? { completed: body.completed } : {}),
    };

    items = items.map((item) => (item.id === id ? updatedItem : item));

    return res(ctx.status(200), ctx.json(updatedItem));
  }),
  rest.put('/api/items/reorder', async (req, res, ctx) => {
    const body = await req.json();
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : [];

    items = orderedIds.map((id, position) => {
      const currentItem = items.find((item) => item.id === id);
      return {
        ...currentItem,
        position,
      };
    });

    return res(ctx.status(200), ctx.json(items));
  }),
];

const server = setupServer(...defaultHandlers);

beforeAll(() => server.listen());
beforeEach(() => {
  resetItems();
  server.resetHandlers(...defaultHandlers);
});
afterEach(() => server.resetHandlers(...defaultHandlers));
afterAll(() => server.close());

describe('App', () => {
  it('renders the seeded shopping list', async () => {
    render(<App />);

    expect(await screen.findByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Eggs')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
  });

  it('adds a new item', async () => {
    const user = userEvent.setup();

    render(<App />);

    const input = await screen.findByLabelText('New item');
    await user.type(input, 'Coffee');
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(await screen.findByText('Coffee')).toBeInTheDocument();
  });

  it('toggles completion state and keeps the item text attached', async () => {
    const user = userEvent.setup();

    render(<App />);

    const milkCheckbox = await screen.findByLabelText('Mark Milk complete');
    await user.click(milkCheckbox);

    await waitFor(() => {
      expect(milkCheckbox).toBeChecked();
    });
    expect(screen.getByText('Milk')).toHaveStyle('text-decoration: line-through');
  });

  it('edits an existing item in place', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Edit Milk' }));
    const editor = screen.getByLabelText('Edit Milk');
    await user.clear(editor);
    await user.type(editor, 'Oat Milk');
    await user.click(screen.getByRole('button', { name: 'Save item name' }));

    expect(await screen.findByText('Oat Milk')).toBeInTheDocument();
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
  });

  it('reorders items when a dragged item is dropped', async () => {
    render(<App />);

    const sourceHandle = await screen.findByRole('button', { name: 'Reorder Eggs' });
    const targetItem = screen.getByText('Milk').closest('li');

    fireEvent.dragStart(sourceHandle);
    fireEvent.dragOver(targetItem);
    fireEvent.drop(targetItem);

    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[0]).toHaveTextContent('Eggs');
      expect(listItems[1]).toHaveTextContent('Milk');
    });
  });

  it('shows an empty state when the list has no items', async () => {
    server.use(rest.get('/api/items', (req, res, ctx) => res(ctx.status(200), ctx.json([]))));

    render(<App />);

    expect(await screen.findByText(/Your list is empty/i)).toBeInTheDocument();
  });
});