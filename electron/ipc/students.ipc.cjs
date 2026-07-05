// ────────────────────────────────────────────────────────────────
//  students.ipc.cjs — students সম্পর্কিত IPC চ্যানেল।
//  renderer থেকে আসা invoke কল repository-তে পাঠায়।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/students.repo.cjs");

function register() {
  ipcMain.handle("students:list", () => repo.list());
  ipcMain.handle("students:get", (_e, id) => repo.getById(id));
  ipcMain.handle("students:create", (_e, data) => repo.create(data));
  ipcMain.handle("students:update", (_e, { id, data }) => repo.update(id, data));
  ipcMain.handle("students:delete", (_e, id) => repo.remove(id));
}

module.exports = { register };
