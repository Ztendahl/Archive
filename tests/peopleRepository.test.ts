import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPeopleRepository, type PeopleRepository } from '../src/db/people.repository';

let repo: PeopleRepository;

beforeEach(() => {
  const db = new Database(':memory:');
  repo = createPeopleRepository(db as any);
});

describe('people repository', () => {
  it('saves and fetches a person', () => {
    const person = repo.savePerson({ first_name: 'Jane', last_name: 'Doe' });
    const fetched = repo.getPerson(person.id);
    expect(fetched?.first_name).toBe('Jane');
  });

  it('lists people', () => {
    repo.savePerson({ first_name: 'A', last_name: 'Person' });
    const list = repo.listPeople();
    expect(list.length).toBe(1);
  });

  it('deletes a person', () => {
    const person = repo.savePerson({ first_name: 'Delete', last_name: 'Me' });
    repo.deletePerson(person.id);
    const list = repo.listPeople();
    expect(list.length).toBe(0);
  });
});
