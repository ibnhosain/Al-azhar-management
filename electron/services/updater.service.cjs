// ────────────────────────────────────────────────────────────────
//  updater.service.cjs — Professional Auto Update
//                        (electron-updater + GitHub Releases)।
//
//  নিরাপত্তা: আপডেট শুধু ইনস্টল ফোল্ডারের অ্যাপ ফাইল প্রতিস্থাপন করে।
//  ডেটাবেস (D:\BustanulIslam\Data), Photos, Backup, Config, Documents ও
//  ভবিষ্যতের Attachment ইনস্টল ফোল্ডারের বাইরে → আপডেটে কখনো স্পর্শ হয় না।
//
//  autoDownload=true → অ্যাপ চালুতে আপডেট পেলে ব্যাকগ্রাউন্ডে নিজে ডাউনলোড হয়;
//  autoInstallOnAppQuit=true → ডাউনলোড শেষে অ্যাপ বন্ধ করলে নিজে ইনস্টল হয়
//  (ব্যবহারকারী চাইলে "রিস্টার্ট ও ইনস্টল"-এ সাথে সাথেও পারে)। সম্পূর্ণ hands-free।
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
  autoUpdater.autoDownload = true;            // চালুতে আপডেট পেলে নিজে ডাউনলোড
  autoUpdater.autoInstallOnAppQuit = true;    // অ্যাপ বন্ধ করলে নিজে ইনস্টল
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

// ── Startup gate: অ্যাপ খোলার আগেই আপডেট নেওয়া (forced update on launch) ──
//  প্রকাশিত সংস্করণে: চেক → আপডেট থাকলে splash-এ ডাউনলোড → নীরবে ইনস্টল + রিলঞ্চ।
//  অফলাইন / চেক-টাইমআউট / ত্রুটি হলে ব্লক না করে অ্যাপ স্বাভাবিকভাবে খোলে।
//  ফেরত: Promise<'proceed'|'updating'>  ('updating' হলে অ্যাপ quit হয়ে নতুনটা চালু হবে)।
function startupUpdateGate(onStatus, opts = {}) {
  const emit = (s) => { try { onStatus && onStatus(s); } catch { /* ignore */ } };
  const checkTimeout = opts.checkTimeoutMs || 9000;      // চেক ফেজে সর্বোচ্চ অপেক্ষা
  const downloadTimeout = opts.downloadTimeoutMs || 240000; // ডাউনলোড হ্যাং হলে নিরাপত্তা
  return new Promise((resolve) => {
    if (!app.isPackaged) { emit({ status: "dev" }); return resolve("proceed"); }
    autoUpdater.autoDownload = true;
    let settled = false, timer = null;
    const off = () => {
      autoUpdater.removeListener("update-available", onAvail);
      autoUpdater.removeListener("update-not-available", onNone);
      autoUpdater.removeListener("error", onErr);
      autoUpdater.removeListener("download-progress", onProg);
      autoUpdater.removeListener("update-downloaded", onDone);
      if (timer) clearTimeout(timer);
    };
    const finish = (r) => { if (settled) return; settled = true; off(); resolve(r); };
    function onAvail(i) { emit({ status: "available", version: i.version, size: (i.files && i.files[0] && i.files[0].size) || null }); if (timer) clearTimeout(timer); timer = setTimeout(() => { emit({ status: "timeout" }); finish("proceed"); }, downloadTimeout); }
    function onNone() { emit({ status: "up-to-date" }); finish("proceed"); }
    function onErr(e) { emit({ status: "error", message: friendlyError(e) }); finish("proceed"); }
    function onProg(p) { emit({ status: "downloading", percent: Math.round(p.percent || 0), transferred: p.transferred, total: p.total, bytesPerSecond: p.bytesPerSecond }); }
    function onDone() { emit({ status: "installing" }); if (settled) return; settled = true; off(); resolve("updating"); setImmediate(() => { try { autoUpdater.quitAndInstall(true, true); } catch { /* ignore */ } }); }
    autoUpdater.on("update-available", onAvail);
    autoUpdater.once("update-not-available", onNone);
    autoUpdater.on("error", onErr);
    autoUpdater.on("download-progress", onProg);
    autoUpdater.once("update-downloaded", onDone);
    emit({ status: "checking" });
    timer = setTimeout(() => { emit({ status: "timeout" }); finish("proceed"); }, checkTimeout);
    autoUpdater.checkForUpdates().catch((e) => { emit({ status: "error", message: friendlyError(e) }); finish("proceed"); });
  });
}

function register() {
  ipcMain.handle("updater:check", () => check(true));
  ipcMain.handle("updater:download", () => download());
  ipcMain.handle("updater:pause", () => pause());
  ipcMain.handle("updater:resume", () => resume());
  ipcMain.handle("updater:install", () => install());
  ipcMain.handle("updater:version", () => app.getVersion());
}

module.exports = { init, register, check, startupUpdateGate };
