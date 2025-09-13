import type { DbPerson, DbPersonWithId } from './people.repository';

export interface Person {
  id: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  notes?: string;
  tags?: string;
}

export type PersonInput = Omit<Person, 'id'> & { id?: string };

export function fromDb(db: DbPersonWithId): Person {
  return {
    id: db.id,
    firstName: db.first_name ?? undefined,
    lastName: db.last_name ?? undefined,
    birthDate: db.birth_date ?? undefined,
    birthPlace: db.birth_place ?? undefined,
    deathDate: db.death_date ?? undefined,
    deathPlace: db.death_place ?? undefined,
    notes: db.notes ?? undefined,
    tags: db.tags ?? undefined,
  };
}

export function toDb(person: PersonInput): DbPerson {
  return {
    id: person.id,
    first_name: person.firstName,
    last_name: person.lastName,
    birth_date: person.birthDate,
    birth_place: person.birthPlace,
    death_date: person.deathDate,
    death_place: person.deathPlace,
    notes: person.notes,
    tags: person.tags,
  };
}
