import fs from 'fs';
import path from 'path';
import { createSQLiteNodeAdapter } from './adapters/sqlite-node';
import type { SQLiteAdapter } from './adapters/types';

export function migrate(db: SQLiteAdapter = createSQLiteNodeAdapter()): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO meta(id, schema_version) VALUES (1, 0);
  `);
  const row = db.prepare('SELECT schema_version FROM meta WHERE id = 1').get();
  let current = row?.schema_version || 0;
  const dir = path.resolve('migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  db.exec('BEGIN');
  try {
    for (const file of files) {
      const version = parseInt(file.split('_')[0], 10);
      if (version > current) {
        const sql = fs.readFileSync(path.join(dir, file), 'utf8');
        db.exec(sql);
        db
          .prepare('UPDATE meta SET schema_version = ? WHERE id = 1')
          .run(version);
        current = version;
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}
