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
          if (params === undefined) {
            stmt.run();
          } else {
            stmt.run(params);
          }
        },
        get<T = any>(params?: any): T | undefined {
          return (params === undefined ? stmt.get() : stmt.get(params)) as T | undefined;
        },
        all<T = any>(params?: any): T[] {
          return (params === undefined ? stmt.all() : stmt.all(params)) as T[];
        },
      };
    },
  };
}
