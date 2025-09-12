import { createSQLiteNodeAdapter } from './adapters/sqlite-node.js';
import { createSQLiteRNAdapter } from './adapters/sqlite-rn.js';
import { createSQLiteWebAdapter } from './adapters/sqlite-web.js';
import { SQLiteAdapter } from './adapters/types.js';

export function getDatabase(): SQLiteAdapter {
  if (typeof process !== 'undefined' && process.versions?.node && !(process as any).browser) {
    return createSQLiteNodeAdapter();
  }
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return createSQLiteRNAdapter();
  }
  return createSQLiteWebAdapter();
}
