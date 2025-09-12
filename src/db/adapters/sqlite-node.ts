import Database from 'better-sqlite3';
import path from 'path';
import { SQLiteAdapter } from './types';

export function createSQLiteNodeAdapter(databasePath: string = path.resolve('archive.db')): SQLiteAdapter {
  const db = new Database(databasePath);
  return db as SQLiteAdapter;
}
