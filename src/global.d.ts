import type { Person, PersonInput } from './db/people.mapper';

interface PeopleApi {
  list(): Promise<Person[]>;
  get(id: string): Promise<Person | undefined>;
  save(person: PersonInput): Promise<Person>;
  delete(id: string): Promise<void>;
}

declare global {
  interface Window {
    api?: {
      people?: PeopleApi;
    };
  }
}

export {};

