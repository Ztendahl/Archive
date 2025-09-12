import { describe, it, expect } from 'vitest';
import { createPeopleRepository } from '../src/db/people.repository';

describe('people repository', () => {
  it('saves and fetches a person', ({ db }) => {
    const repo = createPeopleRepository(db as any);
    const person = repo.savePerson({ first_name: 'Jane', last_name: 'Doe' });
    const fetched = repo.getPerson(person.id!);
    expect(fetched?.first_name).toBe('Jane');
  });

  it('lists people', ({ db }) => {
    const repo = createPeopleRepository(db as any);
    repo.savePerson({ first_name: 'A', last_name: 'Person' });
    const list = repo.listPeople();
    expect(list.length).toBe(1);
  });

  it('updates a person', ({ db }) => {
    const repo = createPeopleRepository(db as any);
    const person = repo.savePerson({ first_name: 'Old', last_name: 'Name' });
    repo.savePerson({ ...person, first_name: 'New' });
    const fetched = repo.getPerson(person.id!);
    expect(fetched?.first_name).toBe('New');
  });

  it('deletes a person', ({ db }) => {
    const repo = createPeopleRepository(db as any);
    const person = repo.savePerson({ first_name: 'Delete', last_name: 'Me' });
    repo.deletePerson(person.id!);
    const list = repo.listPeople();
    expect(list.length).toBe(0);
  });
});
