# Project Documentation

This is a cross-platform React Native + Web application backed by a SQLite
database. It is structured to share code across mobile (iOS/Android) and web
environments using React Native Web and Expo.

## Project Structure

```
.
├── migrations/                # SQL files that evolve the SQLite schema
├── src/
│   ├── App.tsx               # Root component tying form and list together
│   ├── components/           # UI pieces used by the app
│   │   ├── PersonForm.tsx    # Simple form that saves a person record
│   │   └── PersonList.tsx    # Renders records from the database
│   ├── db/                   # Data access and migration helpers
│   │   ├── adapters/         # Platform-specific SQLite bindings
│   │   │   ├── sqlite-node.ts
│   │   │   ├── sqlite-rn.ts
│   │   │   └── sqlite-web.ts
│   │   ├── index.ts          # Selects adapter by platform
│   │   ├── migrate.ts        # Applies files in migrations/ to the database
│   │   └── people.repository.ts # CRUD operations for people table
│   └── ipc/                  # IPC handlers for desktop hosts
│       └── people.ts         # Bridges UI calls to repository functions
├── tests/                    # Vitest unit tests
│   └── peopleRepository.test.ts
├── app.config.ts             # Expo configuration
├── babel.config.js           # Babel setup for React Native
└── package.json              # Dependencies and npm scripts
```

### Data Layer

This repo uses a platform-specific SQLite adapter (Node, RN, Web) behind a common repository interface.

The app stores people records in `archive.db` using the
[`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) library on desktop.
SQL migrations in `migrations/` and the helper in `src/db/migrate.ts` ensure the
database schema is kept up to date. `src/db/people.repository.ts` exposes
functions to list, create/update, fetch and delete people. For desktop targets
an IPC layer (`src/ipc/people.ts`) forwards calls from the renderer process to
the repository.

### Platforms & Storage

This app uses a thin DB adapter per platform, all behind `peopleRepository`:

| Platform  | Adapter                   | Storage path                          |
|-----------|---------------------------|---------------------------------------|
| Desktop   | better-sqlite3 (Node)     | Electron `app.getPath('userData')`    |
| iOS/Android | expo-sqlite | App document directory |
| Web       | sql.js (WASM) or IndexedDB | Browser storage                       |

Migrations are applied via `src/db/migrate.ts` (Node/Web) or on app start (RN).
Schema version is tracked in `meta(schema_version INT)`.

State lives in platform-specific app storage and should be backed up or exported accordingly.

Optional SQLite encryption (e.g., SQLCipher) may be enabled on mobile. Be mindful of data export and backup.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Platform specific commands:
   ```bash
   npm run android   # Run on Android device/emulator
   npm run ios       # Run on iOS simulator
   npm run web       # Run in web browser
   ```
4. For desktop and web, run migrations:
   ```bash
   npm run migrate
   ```
   For React Native, migrations run automatically on app launch. For desktop and web,
   you must run `npm run migrate` manually before first launch.

## Testing

Unit tests are written with [Vitest](https://vitest.dev/). Run them with:

```bash
npm test
```

End-to-end frameworks (Detox, Playwright) are not yet configured; see
`tests/` for unit examples.

Adapter-specific tests can mock the underlying SQLite library (e.g., mock
`better-sqlite3` in React Native or web tests).

### Development Notes

- Adapters for React Native and Web are placeholders — only the Node adapter
  (`sqlite-node.ts`) is functional right now.
- Make sure to install missing dev dependencies (`typescript`, `ts-node`,
  `vitest`, `@eslint/js`, etc.) before running lint/typecheck/test/migrate scripts.
- The CI pipeline runs linting, type checks, and unit tests; it will fail until
  all adapters and dependencies are in place.

The application entry point is located at `src/App.tsx` and uses React Native
components that work on both mobile and desktop via React Native Web.

