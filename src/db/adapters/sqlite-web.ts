import type { SQLiteAdapter } from './types';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm';

const DB_NAME = 'archive.db';
const STORE_NAME = 'db';

let db: any = null;
let initPromise: Promise<void> | null = null;

async function initialize(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: () => wasmUrl,
  });
  const data = await loadFromIndexedDB();
  db = data ? new SQL.Database(data) : new SQL.Database();
}

export function initSQLiteWeb(): Promise<void> {
  if (!initPromise) {
    initPromise = initialize();
  }
  return initPromise;
}

function persist(): void {
  if (!db) return;
  const data = db.export();
  void saveToIndexedDB(data);
}

function mapParams(params: any): any {
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    const mapped: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith(':') || key.startsWith('@') || key.startsWith('$')) {
        mapped[key] = value;
      } else {
        mapped[`@${key}`] = value;
      }
    }
    return mapped;
  }
  return params;
}

export function createSQLiteWebAdapter(): SQLiteAdapter {
  if (!db) {
    throw new Error('Web SQLite database not initialized');
  }

  return {
    exec(sql: string): void {
      db!.exec(sql);
      persist();
    },
    prepare(sql: string) {
      return {
        run(params?: any): void {
          const stmt = db!.prepare(sql);
          try {
            const p = mapParams(params);
            if (p === undefined) {
              stmt.run();
            } else if (Array.isArray(p) || typeof p === 'object') {
              stmt.run(p);
            } else {
              stmt.run([p]);
            }
          } finally {
            stmt.free();
            persist();
          }
        },
        get<T = any>(params?: any): T | undefined {
          const stmt = db!.prepare(sql);
          try {
            const p = mapParams(params);
            if (p !== undefined) {
              if (Array.isArray(p) || typeof p === 'object') {
                stmt.bind(p);
              } else {
                stmt.bind([p]);
              }
            }
            if (stmt.step()) {
              return stmt.getAsObject() as T;
            }
            return undefined;
          } finally {
            stmt.free();
          }
        },
        all<T = any>(params?: any): T[] {
          const stmt = db!.prepare(sql);
          try {
            const p = mapParams(params);
            if (p !== undefined) {
              if (Array.isArray(p) || typeof p === 'object') {
                stmt.bind(p);
              } else {
                stmt.bind([p]);
              }
            }
            const rows: T[] = [];
            while (stmt.step()) {
              rows.push(stmt.getAsObject() as T);
            }
            return rows;
          } finally {
            stmt.free();
          }
        },
      };
    },
  };
}

(globalThis as any).createSQLiteWebAdapter = createSQLiteWebAdapter;
(globalThis as any).initSQLiteWeb = initSQLiteWeb;

async function loadFromIndexedDB(): Promise<Uint8Array | undefined> {
  const idb: any = (globalThis as any).indexedDB;
  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get('data');
      getReq.onerror = () => reject(getReq.error);
      getReq.onsuccess = () => {
        resolve(getReq.result as Uint8Array | undefined);
      };
    };
  });
}

async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb: any = (globalThis as any).indexedDB;
  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(data, 'data');
      putReq.onerror = () => reject(putReq.error);
      putReq.onsuccess = () => resolve();
    };
  });
}
