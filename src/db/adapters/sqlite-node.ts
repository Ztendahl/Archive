import Database from 'better-sqlite3';
import type { SQLiteAdapter } from './types';

export function createSQLiteNodeAdapter(databasePath: string = 'archive.db'): SQLiteAdapter {
  const db = new Database(databasePath);

  return {
    exec(sql: string): void {
      db.exec(sql);
    },
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      return {
        run(params?: any): void {
          stmt.run(params);
        },
        get<T = any>(params?: any): T | undefined {
          return stmt.get(params) as T | undefined;
        },
        all<T = any>(params?: any): T[] {
          return stmt.all(params) as T[];
        },
      };
    },
  };
}
