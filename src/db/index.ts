import { createSQLiteNodeAdapter } from './adapters/sqlite-node.js';
import { SQLiteAdapter } from './adapters/types.js';

export function getDatabase(): SQLiteAdapter {
  if (typeof process !== 'undefined' && process.versions?.node && !(process as any).browser) {
    return createSQLiteNodeAdapter();
  }
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    const createSQLiteRNAdapter = (globalThis as any).createSQLiteRNAdapter;
    if (typeof createSQLiteRNAdapter === 'function') {
      return createSQLiteRNAdapter();
    }
    throw new Error('React Native SQLite adapter not available');
  }
  const createSQLiteWebAdapter = (globalThis as any).createSQLiteWebAdapter;
  if (typeof createSQLiteWebAdapter === 'function') {
    return createSQLiteWebAdapter();
  }
  throw new Error('Web SQLite adapter not available');
}
