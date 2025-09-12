import { createPeopleRepository } from './people.repository.js';
import { createSQLiteNodeAdapter } from './adapters/sqlite-node.js';

export function seed(): void {
  const repo = createPeopleRepository(createSQLiteNodeAdapter());
  repo.savePerson({ first_name: 'Ada', last_name: 'Lovelace' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
