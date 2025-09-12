import fs from 'fs';
import path from 'path';
import { getDatabase } from './index';
import { SQLiteAdapter } from './adapters/types';

export function migrate(db: SQLiteAdapter = getDatabase()): void {
  db.exec('CREATE TABLE IF NOT EXISTS meta (schema_version INTEGER)');
  const row = db.prepare('SELECT schema_version FROM meta').get();
  let current = row?.schema_version || 0;
  const dir = path.resolve('migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const version = parseInt(file.split('_')[0], 10);
    if (version > current) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      db.exec(sql);
      db.prepare('INSERT OR REPLACE INTO meta(schema_version) VALUES (?)').run(version);
      current = version;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}
