import BetterSqlite3 from 'better-sqlite3';
import type { Database as BetterDatabase } from 'better-sqlite3';
import { beforeEach, afterEach } from 'vitest';
import { migrate } from '../src/db/migrate';

declare module 'vitest' {
  // Expose the SQLite database on the test context
  export interface TestContext {
    db: BetterDatabase;
  }
}

beforeEach((ctx) => {
  const db = new BetterSqlite3(':memory:');
  migrate(db);
  ctx.db = db;
});

afterEach((ctx) => {
  ctx.db.close();
});
