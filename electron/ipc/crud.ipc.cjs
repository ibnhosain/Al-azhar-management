// ────────────────────────────────────────────────────────────────
//  crud.ipc.cjs — যেকোনো repository-র জন্য স্ট্যান্ডার্ড CRUD চ্যানেল রেজিস্টার।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");

function registerCrud(resource, repo) {
  ipcMain.handle(`${resource}:list`, () => repo.list());
  ipcMain.handle(`${resource}:get`, (_e, id) => repo.getById(id));
  ipcMain.handle(`${resource}:create`, (_e, data) => repo.create(data));
  ipcMain.handle(`${resource}:update`, (_e, { id, data }) => repo.update(id, data));
  ipcMain.handle(`${resource}:delete`, (_e, id) => repo.remove(id));
}

module.exports = { registerCrud };
