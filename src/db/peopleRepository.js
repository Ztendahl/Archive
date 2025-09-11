import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

function initialize(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      birth_date TEXT,
      birth_place TEXT,
      death_date TEXT,
      death_place TEXT,
      notes TEXT,
      tags TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_people_last_name ON people(last_name);
    CREATE INDEX IF NOT EXISTS idx_people_birth_date ON people(birth_date);
  `);
}

export function createPeopleRepository(databasePath = path.resolve('archive.db')) {
  const db = typeof databasePath === 'string' ? new Database(databasePath) : databasePath;
  initialize(db);

  const listPeople = () => db.prepare('SELECT * FROM people ORDER BY last_name, first_name').all();

  const getPerson = (id) => db.prepare('SELECT * FROM people WHERE id = ?').get(id);

  const savePerson = (person) => {
    const record = { ...person };
    if (!record.id) {
      record.id = uuidv4();
    }
    const stmt = db.prepare(`INSERT OR REPLACE INTO people (
      id, first_name, last_name, birth_date, birth_place, death_date, death_place, notes, tags
    ) VALUES (@id, @first_name, @last_name, @birth_date, @birth_place, @death_date, @death_place, @notes, @tags)`);
    stmt.run({
      id: record.id,
      first_name: record.first_name || null,
      last_name: record.last_name || null,
      birth_date: record.birth_date || null,
      birth_place: record.birth_place || null,
      death_date: record.death_date || null,
      death_place: record.death_place || null,
      notes: record.notes || null,
      tags: record.tags || null,
    });
    return record;
  };

  const deletePerson = (id) => {
    db.prepare('DELETE FROM people WHERE id = ?').run(id);
  };

  return { listPeople, getPerson, savePerson, deletePerson };
}
