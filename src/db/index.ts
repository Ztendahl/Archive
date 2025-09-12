import { createSQLiteNodeAdapter } from './adapters/sqlite-node';
import { createSQLiteRNAdapter } from './adapters/sqlite-rn';
import { createSQLiteWebAdapter } from './adapters/sqlite-web';
import { SQLiteAdapter } from './adapters/types';

export function getDatabase(): SQLiteAdapter {
  if (typeof process !== 'undefined' && process.versions?.node && !process.browser) {
    return createSQLiteNodeAdapter();
  }
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return createSQLiteRNAdapter();
  }
  return createSQLiteWebAdapter();
}
