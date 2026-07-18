// ────────────────────────────────────────────────────────────────
//  salaryLedger.ipc.cjs — শিক্ষক বেতন লেজার (HR/Payroll) IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/salaryLedger.repo.cjs");

function register() {
  ipcMain.handle("salary_ledger:dashboard", () => repo.dashboard());
  ipcMain.handle("salary_ledger:statement", (_e, teacherId) => repo.statement(teacherId));
  ipcMain.handle("salary_ledger:listByTeacher", (_e, teacherId) => repo.listByTeacher(teacherId));
  ipcMain.handle("salary_ledger:duesByTeacher", () => repo.duesByTeacher());
  ipcMain.handle("salary_ledger:add", (_e, data) => repo.add(data));
  ipcMain.handle("salary_ledger:collect", (_e, data) => repo.collect(data));
  ipcMain.handle("salary_ledger:reverse", (_e, { id, meta }) => repo.reverse(id, meta || {}));
  ipcMain.handle("salary_ledger:report", (_e, { type, params }) => repo.report(type, params || {}));
}

module.exports = { register };
