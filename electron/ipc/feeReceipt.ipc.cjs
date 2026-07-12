// ────────────────────────────────────────────────────────────────
//  feeReceipt.ipc.cjs — বেতন ব্যবস্থাপনা IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/feeReceipt.repo.cjs");

function register() {
  ipcMain.handle("fee_receipt:list", (_e, filter) => repo.list(filter || {}));
  ipcMain.handle("fee_receipt:totals", (_e, filter) => repo.totals(filter || {}));
  ipcMain.handle("fee_receipt:get", (_e, id) => repo.getById(id));
  ipcMain.handle("fee_receipt:dues", (_e, { studentId, beforeMonth }) => repo.duesForStudent(studentId, beforeMonth));
  ipcMain.handle("fee_receipt:create", (_e, data) => repo.create(data));
  ipcMain.handle("fee_receipt:delete", (_e, id) => repo.remove(id));
}

module.exports = { register };
