// ────────────────────────────────────────────────────────────────
//  teacherAcademic.ipc.cjs — শিক্ষক একাডেমিক লগ IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const repo = require("../db/repositories/teacherAcademic.repo.cjs");

function register() {
  ipcMain.handle("teacher_academic:list", (_e, { teacherId, logType }) => repo.list(teacherId, logType));
  ipcMain.handle("teacher_academic:add", (_e, data) => repo.add(data));
  ipcMain.handle("teacher_academic:remove", (_e, id) => repo.remove(id));
}

module.exports = { register };
