# Coding Guidelines

## General Formatting

Consistent formatting reduces cognitive overhead and makes code reviews easier. This project follows these conventions:

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for JavaScript strings; double quotes in JSX attributes
- **Semicolons**: Always include semicolons at the end of statements
- **Line length**: Keep lines under 100 characters where practical
- **Trailing commas**: Use trailing commas in multi-line arrays, objects, and function parameters
- **Blank lines**: Use a single blank line to separate logical sections within a function; use two blank lines between top-level declarations

## Linting

[ESLint](https://eslint.org/) is the required linter for this project. All code must pass linting before being committed.

- Use the `eslint:recommended` ruleset as a base
- Frontend code should additionally extend the `react` and `react-hooks` plugins to catch common React mistakes (e.g., missing dependency arrays in `useEffect`)
- Do not disable lint rules inline (`// eslint-disable`) unless there is a documented reason in a comment immediately above the suppression
- Fix lint warnings — do not leave them to accumulate

## Import Organization

Imports should be grouped and ordered consistently to make dependencies easy to scan:

1. **Node built-ins** (e.g., `path`, `fs`)
2. **Third-party packages** (e.g., `react`, `express`, `@mui/material`)
3. **Internal modules** (relative imports, e.g., `./components/ItemList`)

Leave a blank line between each group. Within a group, order imports alphabetically.

```js
// 1. Node built-ins
import path from 'path';

// 2. Third-party
import React, { useState } from 'react';
import { Button } from '@mui/material';

// 3. Internal
import ItemList from './components/ItemList';
import { fetchItems } from './api/items';
```

## Naming Conventions

Clear, descriptive names are preferred over brevity.

- **Variables and functions**: `camelCase` (e.g., `shoppingItems`, `handleAddItem`)
- **React components**: `PascalCase` (e.g., `ShoppingList`, `AddItemForm`)
- **Constants**: `UPPER_SNAKE_CASE` for true module-level constants (e.g., `DEFAULT_PORT`)
- **Files**: Match the name of the primary export — component files use `PascalCase` (e.g., `ItemList.jsx`), utility files use `camelCase` (e.g., `formatDate.js`)
- Avoid abbreviations unless they are universally understood (e.g., `id`, `url`, `api` are fine; `itmNm` is not)

## DRY (Don't Repeat Yourself)

Duplication is a maintenance liability. When the same logic appears in more than one place, extract it:

- Shared UI patterns should become reusable React components
- Repeated data-fetching or transformation logic should be extracted into a custom hook or utility function
- Shared backend logic should be extracted into a service module or middleware
- Test setup that is identical across multiple test files should be extracted into a shared fixture or helper

Avoid over-abstraction, however — only extract when the pattern has appeared at least twice and is likely to appear again or change together.

## Single Responsibility

Each module, function, and component should do one thing well. A React component that fetches data, transforms it, and renders complex UI is doing too much — split data-fetching into a custom hook and keep the component focused on rendering. Similarly, Express route handlers should delegate business logic to service functions rather than embedding it inline.

## Error Handling

- Always handle promise rejections — use `try/catch` in `async` functions or `.catch()` on promise chains
- Return meaningful HTTP status codes and error messages from API endpoints
- In the frontend, surface errors to the user in the UI rather than silently swallowing them in the console
- Never expose internal error details (stack traces, database errors) in API responses sent to clients

## Comments and Documentation

Code should be self-documenting through clear naming and structure. Comments should explain *why*, not *what*:

- Avoid comments that restate what the code already makes obvious
- Use comments to explain non-obvious decisions, workarounds, or important constraints
- Keep comments up to date — a stale comment is worse than no comment

## Environment Variables

Never hardcode environment-specific values (ports, API URLs, secrets) in source code. Use environment variables with sensible defaults:

```js
const PORT = process.env.PORT || 3030;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3030';
```

Never commit secrets or credentials to the repository. Use a `.env` file locally (excluded via `.gitignore`) and CI/CD secrets for deployed environments.

## Git Hygiene

- Write clear, imperative commit messages that describe what changed and why (e.g., `Add drag-and-drop reordering to shopping list`)
- Keep commits focused — one logical change per commit
- Do not commit commented-out code, `console.log` debug statements, or temporary workarounds intended to be removed
