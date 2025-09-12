// Placeholder adapter for React Native using expo-sqlite
// Implementations should provide an object compatible with SQLiteAdapter.
import { SQLiteAdapter } from './types.js';

export function createSQLiteRNAdapter(): SQLiteAdapter {
  throw new Error('React Native SQLite adapter not implemented');
}
