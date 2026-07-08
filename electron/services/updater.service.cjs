// ────────────────────────────────────────────────────────────────
//  updater.service.cjs — Professional Auto Update
//                        (electron-updater + GitHub Releases)।
//
//  নিরাপত্তা: আপডেট শুধু ইনস্টল ফোল্ডারের অ্যাপ ফাইল প্রতিস্থাপন করে।
//  ডেটাবেস (D:\BustanulIslam\Data), Photos, Backup, Config, Documents ও
//  ভবিষ্যতের Attachment ইনস্টল ফোল্ডারের বাইরে → আপডেটে কখনো স্পর্শ হয় না।
//
//  autoDownload=false → ব্যবহারকারীর সম্মতিতে ডাউনলোড।
//  ইভেন্ট renderer-এ "updater:event" চ্যানেলে যায় (preload bridge)।
//  Pause/Resume: CancellationToken দিয়ে ডাউনলোড থামানো/পুনরায় শুরু।
//  Feed provider configurable (update.config.cjs) — পরে custom server।
// ────────────────────────────────────────────────────────────────
const { app, ipcMain } = require("electron");
const { autoUpdater, CancellationToken } = require("electron-updater");
const { getProvider } = require("../config/update.config.cjs");

let win = null;
let wired = false;
let lastManual = false;      // ম্যানুয়াল চেক (menu/settings) নাকি নীরব startup
let cancelToken = null;      // চলমান ডাউনলোড বাতিলের টোকেন (pause)

function send(payload) {
  try {
    if (win && !win.isDestroyed()) win.webContents.send("updater:event", payload);
  } catch { /* উইন্ডো বন্ধ থাকলে উপেক্ষা */ }
}

// GitHub releaseNotes string বা [{version,note}] — টেক্সটে রূপান্তর।
function normalizeNotes(rn) {
  if (!rn) return "";
  if (typeof rn === "string") return rn.replace(/<[^>]+>/g, "").trim();
  if (Array.isArray(rn)) return rn.map((x) => (x && x.note ? x.note : "")).join("\n\n").replace(/<[^>]+>/g, "").trim();
  return String(rn);
}
const sizeOf = (info) => (info && info.files && info.files[0] && info.files[0].size) || null;

function wireEvents() {
  if (wired) return;
  wired = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  try { autoUpdater.setFeedURL(getProvider()); } catch { /* electron-builder app-update.yml fallback */ }

  autoUpdater.on("checking-for-update", () => send({ status: "checking", manual: lastManual }));
  autoUpdater.on("update-available", (i) => send({ status: "available", manual: lastManual, version: i.version, releaseDate: i.releaseDate, releaseNotes: normalizeNotes(i.releaseNotes), size: sizeOf(i) }));
  autoUpdater.on("update-not-available", (i) => send({ status: "up-to-date", manual: lastManual, version: i && i.version }));
  autoUpdater.on("download-progress", (p) => send({
    status: "downloading",
    percent: Math.round((p.percent || 0) * 10) / 10,
    transferred: p.transferred, total: p.total, bytesPerSecond: p.bytesPerSecond,
  }));
  autoUpdater.on("update-downloaded", (i) => send({ status: "downloaded", version: i.version, releaseNotes: normalizeNotes(i.releaseNotes), size: sizeOf(i) }));
  autoUpdater.on("error", (e) => send({ status: "error", manual: lastManual, message: friendlyError(e) }));
}

// ব্যবহারকারী-বান্ধব ত্রুটি বার্তা (No Internet / Not Found / ইত্যাদি)।
function friendlyError(e) {
  const m = (e && e.message ? e.message : String(e)) || "অজানা ত্রুটি";
  if (/net::|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|network/i.test(m)) return "ইন্টারনেট সংযোগ পাওয়া যায়নি।";
  if (/404|not found|latest\.yml/i.test(m)) return "রিলিজ পাওয়া যায়নি (এখনো প্রকাশিত হয়নি?)।";
  if (/EACCES|EPERM|permission/i.test(m)) return "অনুমতি সমস্যা — ইনস্টলার চালানো যায়নি।";
  if (/sha512|checksum|signature|validation/i.test(m)) return "ফাইল যাচাই ব্যর্থ — ডাউনলোড ক্ষতিগ্রস্ত।";
  return m;
}

function init(mainWindow) {
  win = mainWindow;
  wireEvents();
}

async function check(manual = false) {
  lastManual = !!manual;
  if (!app.isPackaged) { send({ status: "dev", manual: lastManual }); return { dev: true }; }
  try { await autoUpdater.checkForUpdates(); return { ok: true }; }
  catch (e) { send({ status: "error", manual: lastManual, message: friendlyError(e) }); return { error: true }; }
}

async function download() {
  if (!app.isPackaged) { send({ status: "dev" }); return { dev: true }; }
  cancelToken = new CancellationToken();
  try {
    await autoUpdater.downloadUpdate(cancelToken);
    return { ok: true };
  } catch (e) {
    // pause করলে cancellation error আসে — ওটাকে ত্রুটি নয়, "paused" হিসেবে দেখাই
    if (cancelToken && cancelToken.cancelled) { send({ status: "paused" }); return { paused: true }; }
    send({ status: "error", message: friendlyError(e) });
    return { error: true };
  }
}

function pause() {
  if (cancelToken && !cancelToken.cancelled) cancelToken.cancel();
  send({ status: "paused" });
  return { ok: true };
}

// electron-updater আংশিক ফাইল ক্যাশে রাখে → resume = আবার downloadUpdate (বাকি অংশ)।
function resume() { return download(); }

function install() {
  if (!app.isPackaged) return { dev: true };
  send({ status: "installing" });
  setImmediate(() => autoUpdater.quitAndInstall(false, true)); // isSilent=false, forceRunAfter=true
  return { ok: true };
}

function register() {
  ipcMain.handle("updater:check", () => check(true));
  ipcMain.handle("updater:download", () => download());
  ipcMain.handle("updater:pause", () => pause());
  ipcMain.handle("updater:resume", () => resume());
  ipcMain.handle("updater:install", () => install());
  ipcMain.handle("updater:version", () => app.getVersion());
}

module.exports = { init, register, check };
