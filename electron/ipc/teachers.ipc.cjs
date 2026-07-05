// ────────────────────────────────────────────────────────────────
//  teachers.ipc.cjs — teachers সম্পর্কিত IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/teachers.repo.cjs");

function register() {
  ipcMain.handle("teachers:list", () => repo.list());
  ipcMain.handle("teachers:get", (_e, id) => repo.getById(id));
  ipcMain.handle("teachers:create", (_e, data) => repo.create(data));
  ipcMain.handle("teachers:update", (_e, { id, data }) => repo.update(id, data));
  ipcMain.handle("teachers:delete", (_e, id) => repo.remove(id));
}

module.exports = { register };
