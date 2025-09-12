import { describe, it, expect } from 'vitest';
import { migrate } from '../src/db/migrate';

describe('migrate', () => {
  it('tracks schema version in single-row meta table', ({ db }) => {
    const first = db.prepare('SELECT * FROM meta').all() as {
      id: number;
      schema_version: number;
    }[];
    expect(first.length).toBe(1);
    expect(first[0].id).toBe(1);
    expect(first[0].schema_version).toBe(1);
    migrate(db as any);
    const second = db.prepare('SELECT * FROM meta').all() as {
      id: number;
      schema_version: number;
    }[];
    expect(second.length).toBe(1);
    expect(second[0].schema_version).toBe(1);
  });

  it('creates people table for CRUD operations', ({ db }) => {
    db.prepare('INSERT INTO people (id, first_name, last_name) VALUES (?, ?, ?)').run(
      '1',
      'John',
      'Doe',
    );
    const row = db.prepare('SELECT * FROM people WHERE id = ?').get('1') as {
      first_name: string;
      last_name: string;
    };
    expect(row.first_name).toBe('John');
    expect(row.last_name).toBe('Doe');
  });
});
