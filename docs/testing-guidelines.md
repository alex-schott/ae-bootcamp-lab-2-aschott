# Testing Guidelines

## Test Types and Locations

### Unit Tests
- **Framework**: Jest
- **Purpose**: Test individual functions and React components in isolation
- **File naming**: `*.test.js` or `*.test.ts`, named to match the module under test (e.g., `app.test.js` for `app.js`)
- **Backend location**: `packages/backend/__tests__/`
- **Frontend location**: `packages/frontend/src/__tests__/`
- Mock all external dependencies (database, HTTP calls) — unit tests must not perform real I/O

### Integration Tests
- **Framework**: Jest + [Supertest](https://github.com/ladjs/supertest)
- **Purpose**: Test backend API endpoints with real HTTP requests against the running Express app
- **File naming**: `*.test.js` or `*.test.ts`, named after the resource being tested (e.g., `items-api.test.js`)
- **Location**: `packages/backend/__tests__/integration/`
- Run via: `npm run test:integration`

### End-to-End (E2E) Tests
- **Framework**: [Playwright](https://playwright.dev/) (required — do not substitute Cypress or other frameworks)
- **Purpose**: Test complete UI workflows through browser automation
- **File naming**: `*.spec.js` or `*.spec.ts`, named after the user journey (e.g., `shopping-list-workflow.spec.ts`)
- **Location**: `tests/e2e/`
- Run via: `npm run test:e2e`
- Install browsers once with: `npm run test:e2e:install`

## Running Tests

| Command | What it runs |
|---|---|
| `npm test` | Frontend + backend unit tests |
| `npm run test:frontend` | Frontend unit tests only |
| `npm run test:backend` | Backend unit tests only |
| `npm run test:integration` | Backend integration tests only |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:all` | All of the above |

## Frontend Testing Conventions

- Use [React Testing Library](https://testing-library.com/react) for rendering components and querying the DOM
- Use [Mock Service Worker (MSW)](https://mswjs.io/) to intercept and mock API requests in frontend tests — do not mock `fetch` or `axios` directly
- Prefer queries that reflect how users interact with the UI (`getByRole`, `getByLabelText`, `getByText`) over implementation-specific queries (`getByTestId`)

## Playwright / E2E Conventions

- **One browser only**: Configure Playwright to run against Chromium only (do not run across multiple browsers in this project)
- **Page Object Model (POM)**: All E2E tests must use the POM pattern — create a page object class per page/feature area in `tests/e2e/pages/`
- **Limit scope**: Focus on 5–8 critical user journeys (happy paths and key edge cases); do not aim for exhaustive UI coverage
- Use environment variables for base URLs and ports (see Port Configuration below)

## Port Configuration

Always use environment variables with sensible defaults:

```js
// Backend
const PORT = process.env.PORT || 3030;

// Frontend (React default, overridable)
// PORT=3000 (set via environment variable when needed)
```

This allows CI/CD workflows to dynamically detect and configure ports without hardcoding values.

## General Principles

- **All tests must be isolated and independent** — each test sets up its own data and makes no assumptions about state left by other tests
- **Setup and teardown hooks are required** — use `beforeEach`/`afterEach` (or `beforeAll`/`afterAll` where appropriate) so tests pass reliably on repeated runs
- **New features require tests** — all new functionality should include appropriate unit, integration, or E2E tests depending on scope
- **Tests should be maintainable** — avoid duplicating test logic; extract shared helpers or fixtures rather than copying setup code
- **Coverage**: Aim for meaningful coverage of business logic; avoid writing tests purely to hit a coverage number
