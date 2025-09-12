import Database from 'better-sqlite3';
import type { SQLiteAdapter } from './types';
export function createSQLiteNodeAdapter(databasePath: string = 'archive.db'): SQLiteAdapter {
  const db = new Database(databasePath);
  return db as SQLiteAdapter;
}
