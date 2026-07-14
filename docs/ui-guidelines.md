# UI Guidelines

## Component Library

This project uses [Material UI (MUI)](https://mui.com/) as its component library.

- Install via `@mui/material` and `@emotion/react` / `@emotion/styled`
- Use MUI components (e.g., `Button`, `TextField`, `IconButton`, `AppBar`) rather than raw HTML elements or custom-styled equivalents
- Follow MUI's component API conventions for props and variants

## Light and Dark Mode

The app supports both light and dark color modes using MUI's theming system.

- Use `createTheme` with a `palette.mode` of `"light"` or `"dark"` to define the theme
- Wrap the app in a `ThemeProvider` and `CssBaseline` at the root level
- Store the user's current mode preference in React state (or `localStorage` for persistence across sessions)
- Provide a toggle button in the top app bar (e.g., a `IconButton` with a `Brightness4` / `Brightness7` icon from `@mui/icons-material`) to switch between modes

## App Bar

- Include a top-level `AppBar` component that is visible on all pages
- Place the light/dark mode toggle in the `AppBar`, aligned to the right

## List Item States

- **Unchecked**: Display item text at full opacity in the default body color
- **Checked**: Display item text with a strikethrough and reduced opacity (e.g., `text-decoration: line-through`, `opacity: 0.5`) to visually distinguish completed items
- Use MUI's `Checkbox` component for the completion toggle

## Drag-and-Drop Affordance

- Display a drag handle icon (e.g., `DragHandle` from `@mui/icons-material`) on the left side of each list item
- The cursor should change to `grab` on hover of the drag handle to signal reorderability
- Use a visual indicator (e.g., a highlighted drop zone) while an item is being dragged

## Inline Edit State

- When a user activates edit mode on a list item, replace the item label with a MUI `TextField` in place
- The `TextField` should be pre-populated with the current item text and focused automatically
- Provide a way to confirm the edit (e.g., pressing Enter or a save `IconButton`) and to cancel (e.g., pressing Escape)

## Empty State

- When the shopping list has no items, display a friendly placeholder message (e.g., "Your list is empty — add an item above")
- Optionally include a subtle icon to reinforce the empty state visually

## Responsiveness

- Wrap the main content in a `Container` component with a reasonable `maxWidth` (e.g., `sm` or `md`) so the layout is centered and readable on both mobile and desktop
- Ensure touch targets (buttons, checkboxes, drag handles) are large enough for mobile use (minimum 44×44px)

## Accessibility

- Rely on MUI's built-in `aria` attributes wherever possible (e.g., `Checkbox` labels, `IconButton` `aria-label` props)
- Ensure sufficient color contrast for text and interactive elements in both light and dark modes (WCAG AA minimum)
- All interactive icons must have an accessible label (use `aria-label` on `IconButton`)

## General Principles

- Prefer MUI's `sx` prop or `styled` utility for custom styling over plain CSS where possible
- Use MUI's built-in spacing and typography scale for consistency
- Keep the UI clean and minimal — avoid unnecessary decorative elements
