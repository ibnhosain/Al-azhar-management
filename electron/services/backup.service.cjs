// ────────────────────────────────────────────────────────────────
//  backup.service.cjs — ডেটাবেস ব্যাকআপ, রিস্টোর, অটো-ব্যাকআপ, লোকেশন পরিবর্তন।
//  DB একটি একক ফাইল (madrasa.db) হওয়ায় ব্যাকআপ = নিরাপদ ফাইল কপি।
//  ব্যাকআপ ও DB ইনস্টল ফোল্ডারের বাইরে → সফটওয়্যার আপডেটেও অক্ষত।
// ────────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const settings = require("./settings.service.cjs");
const paths = require("../config/paths.cjs");
const conn = require("../db/connection.cjs");

const AUTO_KEEP = 10; // সর্বশেষ কয়টি ব্যাকআপ রাখা হবে (অটো-প্রুন)

function ensureBackupDir() {
  const dir = paths.getBackupDir(settings.getDbDirectory());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function createBackup(label) {
  const src = conn.getDatabasePath();
  if (!src || !fs.existsSync(src)) throw new Error("ডেটাবেস ফাইল পাওয়া যায়নি");
  const dir = ensureBackupDir();
  const name = `madrasa-backup-${timestamp()}${label ? "-" + label : ""}.db`;
  const dest = path.join(dir, name);
  fs.copyFileSync(src, dest);
  settings.saveSettings({ lastBackupAt: new Date().toISOString() });
  return { name, path: dest, size: fs.statSync(dest).size, at: new Date().toISOString() };
}

function listBackups() {
  const dir = ensureBackupDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => {
      const st = fs.statSync(path.join(dir, f));
      return { name: f, path: path.join(dir, f), size: st.size, at: st.mtime.toISOString() };
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1)); // নতুন আগে
}

function deleteBackup(backupPath) {
  if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  return { ok: true };
}

function restoreBackup(backupPath) {
  if (!fs.existsSync(backupPath)) throw new Error("ব্যাকআপ ফাইল পাওয়া যায়নি");
  const live = conn.getDatabasePath();
  try { createBackup("pre-restore"); } catch { /* নিরাপত্তা-ব্যাকআপ ব্যর্থ হলেও এগোব */ }
  conn.closeDatabase();
  fs.copyFileSync(backupPath, live);
  conn.initDatabase(); // নতুন ডেটা নিয়ে পুনরায় খোলা
  return { ok: true };
}

function pruneAuto() {
  const extra = listBackups().slice(AUTO_KEEP);
  for (const b of extra) {
    try { fs.unlinkSync(b.path); } catch { /* ignore */ }
  }
}

function autoBackupIfDue() {
  const s = settings.loadSettings();
  if (!s.autoBackup) return { skipped: "disabled" };
  const last = s.lastBackupAt ? new Date(s.lastBackupAt).getTime() : 0;
  const dueMs = (s.autoBackupIntervalHours || 24) * 3600 * 1000;
  if (Date.now() - last < dueMs) return { skipped: "not-due" };
  const b = createBackup("auto");
  pruneAuto();
  return { created: b.name };
}

function setAutoBackup(enabled) {
  settings.saveSettings({ autoBackup: !!enabled });
  return getInfo();
}

// DB লোকেশন পরিবর্তন: বর্তমান DB নতুন ফোল্ডারে কপি করে সেখান থেকে চালানো।
function changeDbLocation(newDir) {
  fs.mkdirSync(newDir, { recursive: true });
  const src = conn.getDatabasePath();
  const dest = paths.getDbFilePath(newDir);
  conn.closeDatabase();
  if (src && fs.existsSync(src) && path.resolve(src) !== path.resolve(dest)) {
    fs.copyFileSync(src, dest);
  }
  settings.setDbDirectory(newDir);
  conn.initDatabase();
  return getInfo();
}

function getInfo() {
  const s = settings.loadSettings();
  let dbSize = 0;
  try { dbSize = fs.statSync(conn.getDatabasePath()).size; } catch { /* ignore */ }
  return {
    dbPath: conn.getDatabasePath(),
    dbDirectory: settings.getDbDirectory(),
    backupDir: paths.getBackupDir(settings.getDbDirectory()),
    autoBackup: s.autoBackup,
    autoBackupIntervalHours: s.autoBackupIntervalHours,
    lastBackupAt: s.lastBackupAt,
    backupCount: listBackups().length,
    dbSize,
  };
}

module.exports = {
  ensureBackupDir, createBackup, listBackups, deleteBackup, restoreBackup,
  autoBackupIfDue, setAutoBackup, changeDbLocation, getInfo,
};
