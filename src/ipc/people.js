export function registerPeopleHandlers(ipcMain, repository) {
  ipcMain.handle('people:list', async () => {
    return repository.listPeople();
  });

  ipcMain.handle('people:get', async (event, id) => {
    return repository.getPerson(id);
  });

  ipcMain.handle('people:save', async (event, person) => {
    return repository.savePerson(person);
  });

  ipcMain.handle('people:delete', async (event, id) => {
    repository.deletePerson(id);
    return true;
  });
}
