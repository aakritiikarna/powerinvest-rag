# PowerInvest interview notes

## Architecture in plain English

- `App.jsx` owns the route map and the two pieces of shared product state: holdings and watchlist.
- `src/components/layout/AppShell.jsx` owns the product shell: grouped sidebar navigation, top bar, mobile menu, profile preview, notification preview, theme action, and page transitions.
- `src/components/shared.jsx` exports reusable page primitives and re-exports the shell so existing pages can stay simple.
- `src/data/stocks.js` contains simulated market data. It is separate so a future API adapter can replace it without redesigning the UI.
- `src/utils/calculations.js` contains portfolio math so the page components mostly focus on rendering.

## React concepts used

- **Functional components and JSX:** Every UI area is a function that returns JSX. Components such as `StatCard` and `StockTable` accept props so they can be reused.
- **`useState`:** Used for controlled form fields, search/filter values, responsive sidebar state, loading state, and popover visibility.
- **`useEffect`:** Used by `useLocalStorage` to persist changes, by `ThemeProvider` to update the document theme, and by `StockExplorer` to simulate an asynchronous data load.
- **`useContext`:** `ThemeContext` makes the selected theme and `toggleTheme` available to the top bar and settings page without passing props through every layer.
- **React Router:** `Routes` and `Route` map URLs to pages; `NavLink` styles the active sidebar item and `Link` handles internal navigation without full page reloads.
- **Framer Motion:** `motion.main`, the mobile sidebar, and popovers use short entrance/exit transitions. The app avoids continuous animation so data remains easy to scan.
- **LocalStorage:** `useLocalStorage` reads the saved JSON value once, then writes updates in an effect. Watchlist, holdings, and theme survive a refresh.
- **Portfolio calculation:** For every holding, `current price × quantity` gives total value. `purchase price × quantity` gives invested value. The difference is profit/loss.
- **Controlled forms:** The input value always comes from React state, and `onChange` updates the state. This makes validation and reset behavior explicit.
- **Reusable components:** Shared status pills, page headers, panels, empty states, tables, and stat cards reduce duplicated markup and keep the visual language consistent.

## Phase 1 interview questions

1. Why is the shell separated into `components/layout/AppShell.jsx` instead of being kept in `App.jsx`?
2. How does grouped navigation make the sidebar easier to extend?
3. Why use `AnimatePresence` for popovers and page transitions instead of animating every component?
4. How does the `shared.jsx` compatibility layer reduce migration risk during a refactor?
5. Which styling concerns belong in CSS variables rather than individual components?
6. How would you replace the disabled “soon” navigation items with real modules in a later phase?

## Broader interview questions

1. Why did you choose Context API instead of Redux for this project?
2. What makes a form a controlled form in React?
3. Why is `key={stock.symbol}` important when rendering the stock list?
4. How does your custom `useLocalStorage` hook handle invalid stored JSON?
5. What happens when a holding is removed from the portfolio?
6. How would you replace simulated stock data with a real API safely?
7. Why does the theme effect update `document.documentElement.dataset.theme`?
8. How does React Router avoid a full page reload between dashboard pages?
9. Which components are reusable, and what props make them reusable?
10. Why are business calculations kept in `utils/calculations.js` instead of inside the JSX?
11. How would you handle loading and error states for a real market endpoint?
12. What would you improve if the portfolio became multi-user?
