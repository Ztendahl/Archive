# Project Documentation

This is a cross-platform React Native + Web application backed by a SQLite
database. It is structured to share code across mobile (iOS/Android) and web
environments using React Native Web and Expo.

## Project Structure

```
.
├── migrations/                # SQL files that evolve the SQLite schema
├── src/
│   ├── App.js                # Root component tying form and list together
│   ├── components/           # UI pieces used by the app
│   │   ├── PersonForm.js     # Simple form that saves a person record
│   │   └── PersonList.js     # Renders records from the database
│   ├── db/                   # Data access and migration helpers
│   │   ├── migrate.js        # Applies files in migrations/ to the database
│   │   └── peopleRepository.js # CRUD operations for people table
│   └── ipc/                  # IPC handlers for desktop hosts
│       └── people.js         # Bridges UI calls to repository functions
├── tests/                    # Vitest unit tests
│   └── peopleRepository.test.js
├── app.json                  # Expo configuration
├── babel.config.js           # Babel setup for React Native
└── package.json              # Dependencies and npm scripts
```

### Data Layer

The app stores people records in `archive.db` using the
[`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) library. SQL
migrations in `migrations/` and the helper in `src/db/migrate.js` ensure the
database schema is kept up to date. `src/db/peopleRepository.js` exposes
functions to list, create/update, fetch and delete people. For desktop targets
an IPC layer (`src/ipc/people.js`) forwards calls from the renderer process to
the repository.

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

## Testing

Unit tests are written with [Vitest](https://vitest.dev/). Run them with:

```bash
npm test
```

The application entry point is located at `src/App.js` and uses React Native
components that work on both mobile and desktop via React Native Web.

