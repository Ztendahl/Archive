import { Platform } from 'react-native';
import { createPeopleRepository } from '../db/people.repository.js';

/**
 * Ensure window.api.people is available in non-Electron environments.
 * Initializes an appropriate SQLite adapter based on the platform and
 * exposes repository methods as async functions.
 */
export async function ensurePeopleApi(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.api?.people) return;

  let adapter;
  if (Platform.OS === 'web') {
    const { initSQLiteWeb, createSQLiteWebAdapter } = await import('../db/adapters/sqlite-web.js');
    await initSQLiteWeb();
    adapter = createSQLiteWebAdapter();
  } else {
    const { createSQLiteRNAdapter } = await import('../db/adapters/sqlite-rn.js');
    adapter = createSQLiteRNAdapter();
  }

  const repository = createPeopleRepository(adapter);

  window.api = window.api || {};
  window.api.people = {
    list: async () => repository.listPeople(),
    save: async (person: any) => repository.savePerson(person),
  };
}
