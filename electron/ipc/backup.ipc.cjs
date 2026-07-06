// ────────────────────────────────────────────────────────────────
//  backup.ipc.cjs — ব্যাকআপ/রিস্টোর/লোকেশন সম্পর্কিত IPC।
// ────────────────────────────────────────────────────────────────
const { ipcMain, dialog, shell, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const backup = require("../services/backup.service.cjs");

function register() {
  ipcMain.handle("backup:info", () => backup.getInfo());
  ipcMain.handle("backup:list", () => backup.listBackups());
  ipcMain.handle("backup:create", () => backup.createBackup("manual"));
  ipcMain.handle("backup:restore", (_e, p) => backup.restoreBackup(p));
  ipcMain.handle("backup:delete", (_e, p) => backup.deleteBackup(p));
  ipcMain.handle("backup:setAuto", (_e, enabled) => backup.setAutoBackup(enabled));
  ipcMain.handle("backup:completeSetup", () => backup.completeSetup());
  ipcMain.handle("backup:openFolder", () => { shell.openPath(backup.ensureBackupDir()); return { ok: true }; });

  ipcMain.handle("backup:chooseDir", async () => {
    const win = BrowserWindow.getFocusedWindow();
    const r = await dialog.showOpenDialog(win, {
      title: "ডেটাবেস ফোল্ডার নির্বাচন করুন",
      properties: ["openDirectory", "createDirectory"],
    });
    if (r.canceled || !r.filePaths[0]) return { canceled: true };
    return backup.changeDbLocation(r.filePaths[0]);
  });

  // বাইরের কোনো ফোল্ডারে একটি ব্যাকআপ কপি রপ্তানি
  ipcMain.handle("backup:exportTo", async () => {
    const win = BrowserWindow.getFocusedWindow();
    const r = await dialog.showOpenDialog(win, {
      title: "ব্যাকআপ সংরক্ষণের ফোল্ডার নির্বাচন করুন",
      properties: ["openDirectory", "createDirectory"],
    });
    if (r.canceled || !r.filePaths[0]) return { canceled: true };
    const b = backup.createBackup("manual");
    const dest = path.join(r.filePaths[0], b.name);
    fs.copyFileSync(b.path, dest);
    return { ok: true, path: dest };
  });
}

module.exports = { register };
