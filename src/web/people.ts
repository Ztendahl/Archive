import { Platform } from 'react-native';
import { createPeopleRepository } from '../db/people.repository';
import type { SQLiteAdapter } from '../db/adapters/types';
import type { InitSqlJsStatic } from 'sql.js';
import { fromDb, toDb, type PersonInput } from '../db/people.mapper';

let sqlJsLoadPromise: Promise<void> | null = null;
let peopleInitPromise: Promise<void> | null = null;

async function ensureSqlJs(): Promise<void> {
  const g = globalThis as { initSqlJs?: InitSqlJsStatic };
  if (g.initSqlJs) return;
  if (!sqlJsLoadPromise) {
    sqlJsLoadPromise = import('sql.js').then((mod) => {
      const anyMod = mod as any;
      const initSqlJs: InitSqlJsStatic = (anyMod.default ?? anyMod) as InitSqlJsStatic;
      g.initSqlJs = initSqlJs;
    });
  }
  await sqlJsLoadPromise;
}

/**
 * Ensure window.api.people is available in non-Electron environments.
 * Initializes an appropriate SQLite adapter based on the platform and
 * exposes repository methods as async functions.
 */
export async function ensurePeopleApi(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.api?.people) return;
  if (peopleInitPromise) return peopleInitPromise;

  peopleInitPromise = (async () => {
    let adapter: SQLiteAdapter;

    if (Platform.OS === 'web') {
      await ensureSqlJs();
      const { initSQLiteWeb, createSQLiteWebAdapter } = await import('../db/adapters/sqlite-web');
      await initSQLiteWeb();
      adapter = createSQLiteWebAdapter();
    } else {
      const { createSQLiteRNAdapter } = await import('../db/adapters/sqlite-rn');
      adapter = createSQLiteRNAdapter();
    }

    const repository = createPeopleRepository(adapter);

    window.api = window.api ?? {};
    window.api.people = {
      list: async () => repository.listPeople().map(fromDb),
      save: async (person: PersonInput) => fromDb(repository.savePerson(toDb(person))),
    };
  })();

  try {
    await peopleInitPromise;
  } finally {
    peopleInitPromise = null;
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!window.api?.people) {
      console.warn(
        'window.api.people is undefined; ensure ensurePeopleApi() runs before using the API.',
      );
    }
  }, 5000);
}

