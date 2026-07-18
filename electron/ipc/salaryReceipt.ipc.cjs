// ────────────────────────────────────────────────────────────────
//  salaryReceipt.ipc.cjs — সংরক্ষিত বেতন রশিদ IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/salaryReceipt.repo.cjs");

function register() {
  ipcMain.handle("salary_receipt:list", (_e, teacherId) => repo.list(teacherId));
  ipcMain.handle("salary_receipt:add", (_e, data) => repo.add(data));
  ipcMain.handle("salary_receipt:remove", (_e, id) => repo.remove(id));
}

module.exports = { register };
