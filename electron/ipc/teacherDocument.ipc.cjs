// ────────────────────────────────────────────────────────────────
//  teacherDocument.ipc.cjs — শিক্ষক ডকুমেন্ট IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain, shell } = require("electron");
const repo = require("../db/repositories/teacherDocument.repo.cjs");

function register() {
  ipcMain.handle("teacher_document:list", (_e, teacherId) => repo.list(teacherId));
  ipcMain.handle("teacher_document:add", (_e, data) => repo.add(data));
  ipcMain.handle("teacher_document:remove", (_e, id) => repo.remove(id));
  ipcMain.handle("teacher_document:open", async (_e, id) => {
    const p = repo.fullPath(id);
    if (!p) return { ok: false, error: "ফাইল পাওয়া যায়নি" };
    const err = await shell.openPath(p);          // "" = সফল
    return err ? { ok: false, error: err } : { ok: true };
  });
}

module.exports = { register };
