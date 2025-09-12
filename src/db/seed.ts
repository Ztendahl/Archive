import { createPeopleRepository } from './people.repository';

export function seed(): void {
  const repo = createPeopleRepository();
  repo.savePerson({ first_name: 'Ada', last_name: 'Lovelace' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
