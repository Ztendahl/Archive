import { createPeopleRepository } from './people.repository';
import { createSQLiteNodeAdapter } from './adapters/sqlite-node';

export function seed(): void {
  const repo = createPeopleRepository(createSQLiteNodeAdapter());
  repo.savePerson({ first_name: 'Ada', last_name: 'Lovelace' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
