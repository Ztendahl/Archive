import type { Person, PersonInput } from './db/people.mapper';

interface PeopleApi {
  list(): Promise<Person[]>;
  save(person: PersonInput): Promise<Person>;
}

declare global {
  interface Window {
    api?: {
      people?: PeopleApi;
    };
  }
}

export {};

