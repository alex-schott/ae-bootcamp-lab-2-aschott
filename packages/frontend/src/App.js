import React, { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  IconButton,
  LinearProgress,
  List,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const THEME_STORAGE_KEY = 'shopping-list-theme-mode';

function createAppTheme(mode) {
  const isDarkMode = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDarkMode ? '#5eead4' : '#115e59',
      },
      secondary: {
        main: isDarkMode ? '#f59e0b' : '#c2410c',
      },
      background: {
        default: isDarkMode ? '#081017' : '#f7f6f2',
        paper: isDarkMode ? '#0f172a' : '#ffffff',
      },
    },
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily: '"Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif',
      h4: {
        fontWeight: 800,
        letterSpacing: '-0.04em',
      },
      h6: {
        fontWeight: 700,
      },
      button: {
        textTransform: 'none',
        fontWeight: 700,
      },
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
          disableTouchRipple: true,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}

function moveItem(items, sourceId, destinationId) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const destinationIndex = items.findIndex((item) => item.id === destinationId);

  if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(destinationIndex, 0, movedItem);

  return nextItems.map((item, position) => ({
    ...item,
    position,
  }));
}

function requestJson(path, options = {}) {
  return fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (response) => {
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error || 'Request failed');
    }

    return payload;
  });
}

function ItemRow({
  item,
  isDragging,
  isDropTarget,
  isEditing,
  editValue,
  onEditValueChange,
  onToggle,
  onBeginEdit,
  onSaveEdit,
  onCancelEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  return (
    <Paper
      component="li"
      elevation={0}
      draggable={!isEditing}
      onDragStart={() => onDragStart(item.id)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(item.id);
      }}
      onDrop={() => onDrop(item.id)}
      onDragEnd={onDragEnd}
      sx={{
        border: 1,
        borderColor: isDropTarget
          ? 'primary.main'
          : isDragging
            ? 'secondary.main'
            : 'divider',
        boxShadow: isDragging ? 6 : 0,
        opacity: isDragging ? 0.85 : 1,
        transition: 'border-color 160ms ease, box-shadow 160ms ease, opacity 160ms ease',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, py: 1 }}>
        <IconButton
          aria-label={`Reorder ${item.name}`}
          size="small"
          onDragStart={() => onDragStart(item.id)}
          sx={{ cursor: 'grab', color: 'text.secondary' }}
        >
          <DragIndicatorIcon />
        </IconButton>
        <Checkbox
          checked={item.completed}
          onChange={(event) => onToggle(item.id, event.target.checked)}
          inputProps={{ 'aria-label': `Mark ${item.name} complete` }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {isEditing ? (
            <TextField
              autoFocus
              fullWidth
              size="small"
              value={editValue}
              onChange={(event) => onEditValueChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSaveEdit(item.id);
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  onCancelEdit();
                }
              }}
              inputProps={{
                'aria-label': `Edit ${item.name}`,
              }}
            />
          ) : (
            <Typography
              variant="body1"
              sx={{
                textDecoration: item.completed ? 'line-through' : 'none',
                opacity: item.completed ? 0.55 : 1,
                fontWeight: 600,
                wordBreak: 'break-word',
              }}
            >
              {item.name}
            </Typography>
          )}
        </Box>
        {isEditing ? (
          <Stack direction="row" spacing={0.5}>
            <IconButton aria-label="Save item name" onClick={() => onSaveEdit(item.id)}>
              <SaveIcon />
            </IconButton>
            <IconButton aria-label="Cancel edit" onClick={onCancelEdit}>
              <CloseIcon />
            </IconButton>
          </Stack>
        ) : (
          <IconButton aria-label={`Edit ${item.name}`} onClick={() => onBeginEdit(item)}>
            <EditIcon />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

function EmptyState() {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Your list is empty
      </Typography>
      <Typography variant="body2">Add an item above to start building your shopping list.</Typography>
    </Box>
  );
}

function App() {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    let isActive = true;

    async function loadItems() {
      try {
        setLoading(true);
        const response = await requestJson('/api/items');

        if (isActive) {
          setItems(response);
          setError('');
        }
      } catch (loadError) {
        if (isActive) {
          setError(`Failed to load items: ${loadError.message}`);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleAddItem(event) {
    event.preventDefault();

    const trimmedName = newItemName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      const createdItem = await requestJson('/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: trimmedName }),
      });

      setItems((currentItems) => [...currentItems, createdItem]);
      setNewItemName('');
      setError('');
    } catch (addError) {
      setError(`Failed to add item: ${addError.message}`);
    }
  }

  async function handleToggleItem(id, completed) {
    try {
      const updatedItem = await requestJson(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });

      setItems((currentItems) =>
        currentItems.map((item) => (item.id === id ? updatedItem : item))
      );
      setError('');
    } catch (toggleError) {
      setError(`Failed to update item: ${toggleError.message}`);
    }
  }

  function handleBeginEdit(item) {
    setEditingItemId(item.id);
    setEditingValue(item.name);
  }

  function handleCancelEdit() {
    setEditingItemId(null);
    setEditingValue('');
  }

  async function handleSaveEdit(id) {
    const trimmedValue = editingValue.trim();

    if (!trimmedValue) {
      return;
    }

    try {
      const updatedItem = await requestJson(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: trimmedValue }),
      });

      setItems((currentItems) =>
        currentItems.map((item) => (item.id === id ? updatedItem : item))
      );
      handleCancelEdit();
      setError('');
    } catch (saveError) {
      setError(`Failed to save item: ${saveError.message}`);
    }
  }

  async function handleReorderItem(targetId) {
    if (draggedItemId === null || draggedItemId === targetId) {
      return;
    }

    const nextItems = moveItem(items, draggedItemId, targetId);

    if (nextItems === items) {
      return;
    }

    const orderedIds = nextItems.map((item) => item.id);
    setItems(nextItems);
    setDraggedItemId(null);
    setDropTargetId(null);

    try {
      await requestJson('/api/items/reorder', {
        method: 'PUT',
        body: JSON.stringify({ orderedIds }),
      });

      setError('');
    } catch (reorderError) {
      setError(`Failed to reorder items: ${reorderError.message}`);
      const refreshedItems = await requestJson('/api/items');
      setItems(refreshedItems);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: (muiTheme) =>
            `radial-gradient(circle at top, ${alpha(muiTheme.palette.primary.main, 0.18)}, transparent 40%), linear-gradient(180deg, ${muiTheme.palette.background.default} 0%, ${alpha(muiTheme.palette.primary.main, 0.04)} 100%)`,
        }}
      >
        <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(14px)' }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div">
                Shopping List
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track, edit, and reorder what you need next.
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              aria-label="toggle color mode"
              onClick={() => setMode((currentMode) => (currentMode === 'light' ? 'dark' : 'light'))}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
          {loading ? <LinearProgress /> : null}
        </AppBar>

        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
              <Stack component="form" spacing={2} onSubmit={handleAddItem}>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Build your list
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add groceries, household supplies, or whatever you need next.
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="New item"
                    placeholder="Add milk, apples, or coffee"
                    value={newItemName}
                    onChange={(event) => setNewItemName(event.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!newItemName.trim()}
                    sx={{ minWidth: { sm: 140 } }}
                  >
                    Add item
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ px: 1, pb: 1 }}>
                <Typography variant="h6">Items</Typography>
                <Typography variant="body2" color="text.secondary">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </Typography>
              </Stack>

              {items.length === 0 && !loading ? (
                <EmptyState />
              ) : (
                <List component="ul" disablePadding sx={{ display: 'grid', gap: 1.25 }}>
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      isDragging={draggedItemId === item.id}
                      isDropTarget={dropTargetId === item.id}
                      isEditing={editingItemId === item.id}
                      editValue={editingValue}
                      onEditValueChange={setEditingValue}
                      onToggle={handleToggleItem}
                      onBeginEdit={handleBeginEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDragStart={(id) => setDraggedItemId(id)}
                      onDragOver={(id) => setDropTargetId(id)}
                      onDrop={handleReorderItem}
                      onDragEnd={() => {
                        setDraggedItemId(null);
                        setDropTargetId(null);
                      }}
                    />
                  ))}
                </List>
              )}
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;