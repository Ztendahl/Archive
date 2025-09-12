import type { Person } from './db/people.repository';

interface PeopleApi {
  list(): Promise<Person[]>;
  save(person: Person): Promise<Person>;
}

declare global {
  interface Window {
    api?: {
      people?: PeopleApi;
    };
  }
}

export {};

