import type { PeopleRepository } from '../db/people.repository';

/**
 * IPC contract for people repository.
 * Channels:
 * - `people:list` → Person[]
 * - `people:get` (id: string) → Person | undefined
 * - `people:save` (person: Person) → Person
 * - `people:delete` (id: string) → true
 * Errors may be thrown with codes `NOT_FOUND` or `VALIDATION_ERROR`.
 */
export function registerPeopleHandlers(ipcMain: any, repository: PeopleRepository): void {
  ipcMain.handle('people:list', async () => {
    return repository.listPeople();
  });

  ipcMain.handle('people:get', async (_event: any, id: string) => {
    return repository.getPerson(id);
  });

  ipcMain.handle('people:save', async (_event: any, person: any) => {
    return repository.savePerson(person);
  });

  ipcMain.handle('people:delete', async (_event: any, id: string) => {
    repository.deletePerson(id);
    return true;
  });
}
