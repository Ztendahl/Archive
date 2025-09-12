// Placeholder adapter for React Native using react-native-quick-sqlite or expo-sqlite
// Implementations should provide an object compatible with SQLiteAdapter.
import { SQLiteAdapter } from './types';

export function createSQLiteRNAdapter(): SQLiteAdapter {
  throw new Error('React Native SQLite adapter not implemented');
}
