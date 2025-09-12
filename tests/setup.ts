import Database from 'better-sqlite3';
import { beforeEach, afterEach } from 'vitest';
import { migrate } from '../src/db/migrate';

declare module 'vitest' {
  export interface TestContext {
    db: Database;
  }
}

beforeEach((ctx) => {
  const db = new Database(':memory:');
  migrate(db as any);
  ctx.db = db;
});

afterEach((ctx) => {
  ctx.db.close();
});
