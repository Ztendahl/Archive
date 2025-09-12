import { openDatabaseSync } from 'expo-sqlite';
import { SQLiteAdapter } from './types.js';

export function createSQLiteRNAdapter(): SQLiteAdapter {
  const db = openDatabaseSync('archive.db');

  return {
    exec(sql: string): void {
      db.execSync(sql);
    },
    prepare(sql: string) {
      return {
        run(params?: any): void {
          const stmt = db.prepareSync(sql);
          try {
            stmt.executeSync(params);
          } finally {
            stmt.finalizeSync();
          }
        },
        get<T = any>(params?: any): T | undefined {
          const stmt = db.prepareSync(sql);
          try {
            const result = stmt.executeSync<T>(params);
            const iterator = result[Symbol.iterator]();
            const row = iterator.next().value as T | undefined;
            return row ?? undefined;
          } finally {
            stmt.finalizeSync();
          }
        },
        all<T = any>(params?: any): T[] {
          const stmt = db.prepareSync(sql);
          try {
            const result = stmt.executeSync<T>(params);
            return Array.from(result) as T[];
          } finally {
            stmt.finalizeSync();
          }
        },
      };
    },
  };
}

(globalThis as any).createSQLiteRNAdapter = createSQLiteRNAdapter;
