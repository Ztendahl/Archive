import { beforeEach, describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';
import path from 'node:path';
import 'fake-indexeddb/auto';
import Database from 'better-sqlite3';

// Mock expo-sqlite using better-sqlite3 for RN adapter tests
vi.mock('expo-sqlite', () => {
  return {
    openDatabaseSync: () => {
      const db = new Database(':memory:');
      return {
        execSync(sql: string) {
          db.exec(sql);
        },
        prepareSync(sql: string) {
          const stmt = db.prepare(sql);
          return {
            executeSync<T>(params?: any): T[] {
              try {
                return stmt.all(params ?? {}) as T[];
              } catch {
                stmt.run(params ?? {});
                return [] as T[];
              }
            },
            finalizeSync() {
              /* no-op */
            },
          };
        },
      };
    },
  };
});

describe('React Native SQLite adapter', () => {
  it('executes basic CRUD operations', async () => {
    const { createSQLiteRNAdapter } = await import('../src/db/adapters/sqlite-rn');
    const db = createSQLiteRNAdapter();
    db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)');
    db.prepare('INSERT INTO t (name) VALUES (?)').run(['Alice']);
    const row = db
      .prepare('SELECT * FROM t')
      .get<{ id: number; name: string }>();
    expect(row?.name).toBe('Alice');
  });
});

async function resetIndexedDB(): Promise<void> {
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('archive.db');
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(undefined);
  });
}

describe('Web SQLite adapter', () => {
  beforeEach(async () => {
    await resetIndexedDB();
    vi.resetModules();
  });

  it('persists data to IndexedDB', async () => {
    (globalThis as any).initSqlJs = () =>
      initSqlJs({ locateFile: (file) => path.resolve('node_modules/sql.js/dist', file) });
    const web1 = await import('../src/db/adapters/sqlite-web');
    await web1.initSQLiteWeb();
    const db1 = web1.createSQLiteWebAdapter();
    db1.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)');
    db1.prepare('INSERT INTO t (name) VALUES (?)').run(['Bob']);

    // Simulate a page reload
    vi.resetModules();
    (globalThis as any).initSqlJs = () =>
      initSqlJs({ locateFile: (file) => path.resolve('node_modules/sql.js/dist', file) });
    const web2 = await import('../src/db/adapters/sqlite-web');
    await web2.initSQLiteWeb();
    const db2 = web2.createSQLiteWebAdapter();
    const rows = db2
      .prepare('SELECT * FROM t')
      .all<{ id: number; name: string }>();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Bob');
  });
});

