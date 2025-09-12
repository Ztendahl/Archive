import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';
import { migrate } from '../src/db/migrate';

describe('migrate', () => {
  it('tracks schema version in single-row meta table', () => {
    const db = new Database(':memory:');
    migrate(db as any);
    const first = db.prepare('SELECT * FROM meta').all();
    expect(first.length).toBe(1);
    expect(first[0].id).toBe(1);
    expect(first[0].schema_version).toBe(1);
    migrate(db as any);
    const second = db.prepare('SELECT * FROM meta').all();
    expect(second.length).toBe(1);
    expect(second[0].schema_version).toBe(1);
  });
});
