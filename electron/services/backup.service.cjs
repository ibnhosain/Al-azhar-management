// ────────────────────────────────────────────────────────────────
//  backup.service.cjs — এক ZIP ফাইলে সম্পূর্ণ ব্যাকআপ:
//    madrasa.db + photos/ + config.json  (ভবিষ্যতের attachment-ও এখানেই)
//  Restore পুরোটা ফিরিয়ে আনে (DB লোকেশন বর্তমানটাই রাখা হয়)।
//  ব্যাকআপ/DB ইনস্টল ফোল্ডারের বাইরে → আপডেটেও নিরাপদ।
// ────────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const settings = require("./settings.service.cjs");
const paths = require("../config/paths.cjs");
const conn = require("../db/connection.cjs");

const AUTO_KEEP = 10;

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
  const name = `madrasa-backup-${timestamp()}${label ? "-" + label : ""}.zip`;
  const dest = path.join(dir, name);

  const zip = new AdmZip();
  zip.addLocalFile(src, "", "madrasa.db");
  const photosDir = paths.getPhotosDir(settings.getDbDirectory());
  if (fs.existsSync(photosDir)) zip.addLocalFolder(photosDir, "photos");
  try {
    const cfg = paths.getConfigFilePath();
    if (fs.existsSync(cfg)) zip.addLocalFile(cfg, "", "config.json");
  } catch { /* ignore */ }
  zip.writeZip(dest);

  settings.saveSettings({ lastBackupAt: new Date().toISOString() });
  return { name, path: dest, size: fs.statSync(dest).size, at: new Date().toISOString() };
}

function listBackups() {
  const dir = ensureBackupDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => {
      const st = fs.statSync(path.join(dir, f));
      return { name: f, path: path.join(dir, f), size: st.size, at: st.mtime.toISOString() };
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

function deleteBackup(backupPath) {
  if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  return { ok: true };
}

function restoreBackup(zipPath) {
  if (!fs.existsSync(zipPath)) throw new Error("ব্যাকআপ ফাইল পাওয়া যায়নি");
  try { createBackup("pre-restore"); } catch { /* এগোব */ }

  const dir = ensureBackupDir();
  const tmp = path.join(dir, "_restore_tmp");
  fs.rmSync(tmp, { recursive: true, force: true });
  new AdmZip(zipPath).extractAllTo(tmp, true);

  const live = conn.getDatabasePath();
  conn.closeDatabase();

  const tdb = path.join(tmp, "madrasa.db");
  if (fs.existsSync(tdb)) fs.copyFileSync(tdb, live);

  const tphotos = path.join(tmp, "photos");
  if (fs.existsSync(tphotos)) {
    const photosDir = paths.getPhotosDir(settings.getDbDirectory());
    fs.rmSync(photosDir, { recursive: true, force: true });
    fs.cpSync(tphotos, photosDir, { recursive: true });
  }

  // config ফিরিয়ে আনি, তবে dbDirectory বর্তমানটাই রাখি (লোকেশন হারাবে না)
  try {
    const tcfg = path.join(tmp, "config.json");
    if (fs.existsSync(tcfg)) {
      const restored = JSON.parse(fs.readFileSync(tcfg, "utf-8"));
      restored.dbDirectory = settings.getDbDirectory();
      restored.setupComplete = true;
      fs.writeFileSync(paths.getConfigFilePath(), JSON.stringify(restored, null, 2), "utf-8");
      settings.reset();
    }
  } catch { /* ignore */ }

  fs.rmSync(tmp, { recursive: true, force: true });
  conn.initDatabase();
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

// DB লোকেশন পরিবর্তন: DB + photos নতুন ফোল্ডারে কপি করে সেখান থেকে চালানো।
function changeDbLocation(newDir) {
  fs.mkdirSync(newDir, { recursive: true });
  const src = conn.getDatabasePath();
  const dest = paths.getDbFilePath(newDir);
  const oldPhotos = paths.getPhotosDir(settings.getDbDirectory());
  conn.closeDatabase();
  if (src && fs.existsSync(src) && path.resolve(src) !== path.resolve(dest)) {
    fs.copyFileSync(src, dest);
    try { if (fs.existsSync(oldPhotos)) fs.cpSync(oldPhotos, paths.getPhotosDir(newDir), { recursive: true }); } catch { /* ignore */ }
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
    photosDir: paths.getPhotosDir(settings.getDbDirectory()),
    autoBackup: s.autoBackup,
    autoBackupIntervalHours: s.autoBackupIntervalHours,
    lastBackupAt: s.lastBackupAt,
    setupComplete: s.setupComplete,
    backupCount: listBackups().length,
    dbSize,
  };
}

function completeSetup() {
  settings.saveSettings({ setupComplete: true });
  return getInfo();
}

module.exports = {
  ensureBackupDir, createBackup, listBackups, deleteBackup, restoreBackup,
  autoBackupIfDue, setAutoBackup, changeDbLocation, getInfo, completeSetup,
};
