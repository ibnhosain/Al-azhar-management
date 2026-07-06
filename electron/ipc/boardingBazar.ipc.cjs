// ────────────────────────────────────────────────────────────────
//  boardingBazar.ipc.cjs — বোর্ডিং বাজারের IPC (header+items payload)।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/boardingBazar.repo.cjs");

function register() {
  ipcMain.handle("boarding_bazar:list", () => repo.list());
  ipcMain.handle("boarding_bazar:get", (_e, id) => repo.getById(id));
  ipcMain.handle("boarding_bazar:create", (_e, payload) => repo.create(payload || {}));
  ipcMain.handle("boarding_bazar:update", (_e, { id, data }) => repo.update(id, data || {}));
  ipcMain.handle("boarding_bazar:delete", (_e, id) => repo.remove(id));
}

module.exports = { register };
