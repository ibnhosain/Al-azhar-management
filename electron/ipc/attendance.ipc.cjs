// ────────────────────────────────────────────────────────────────
//  attendance.ipc.cjs — হাজিরার IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/attendance.repo.cjs");

function register() {
  ipcMain.handle("attendance:getByDate", (_e, date) => repo.getByDate(date));
  ipcMain.handle("attendance:saveForDate", (_e, { date, records }) => repo.saveForDate(date, records));
}

module.exports = { register };
