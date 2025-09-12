// Placeholder adapter for web environments using sql.js or IndexedDB
// Implementations should provide an object compatible with SQLiteAdapter.
import { SQLiteAdapter } from './types';

export function createSQLiteWebAdapter(): SQLiteAdapter {
  throw new Error('Web SQLite adapter not implemented');
}
