import { v4 as uuidv4 } from 'uuid';
import { SQLiteAdapter } from './adapters/types';
import { getDatabase } from './index';

export interface Person {
  id?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  notes?: string;
  tags?: string;
}

export interface PeopleRepository {
  listPeople(): Person[];
  getPerson(id: string): Person | undefined;
  savePerson(person: Person): Person;
  deletePerson(id: string): void;
}

function initialize(db: SQLiteAdapter): void {
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

export function createPeopleRepository(db: SQLiteAdapter = getDatabase()): PeopleRepository {
  initialize(db);

  const listPeople = () =>
    db.prepare('SELECT * FROM people ORDER BY last_name, first_name').all<Person>();

  const getPerson = (id: string) =>
    db.prepare('SELECT * FROM people WHERE id = ?').get<Person>(id);

  const savePerson = (person: Person) => {
    const record: Person = { ...person };
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

  const deletePerson = (id: string) => {
    db.prepare('DELETE FROM people WHERE id = ?').run(id);
  };

  return { listPeople, getPerson, savePerson, deletePerson };
}
