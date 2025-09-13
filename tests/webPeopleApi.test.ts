/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import 'fake-indexeddb/auto';

async function resetIndexedDB(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('archive.db');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

describe('ensurePeopleApi', () => {
  beforeEach(async () => {
    await resetIndexedDB();
    vi.resetModules();
    (window as any).api = undefined;
    vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));
    vi.mock('sql.js/dist/sql-wasm.wasm', () => ({
      default: path.resolve('node_modules/sql.js/dist/sql-wasm.wasm'),
    }));
  });

  it('provides CRUD operations', async () => {
    const { ensurePeopleApi } = await import('../src/web/people');
    await ensurePeopleApi();
    const api = window.api?.people;
    expect(api).toBeDefined();
    const created = await api!.save({ firstName: 'Test', lastName: 'User' });
    const fetched = await api!.get(created.id);
    expect(fetched?.firstName).toBe('Test');
    let list = await api!.list();
    expect(list).toHaveLength(1);
    await api!.delete(created.id);
    list = await api!.list();
    expect(list).toHaveLength(0);
  });
});
