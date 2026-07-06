// ────────────────────────────────────────────────────────────────
//  settings.service.cjs — অ্যাপ সেটিংস (মূলত DB ডিরেক্টরি) পড়া/লেখা।
//  সেটিংস userData/config.json-এ থাকে — ইনস্টল ফোল্ডারের বাইরে,
//  তাই সফটওয়্যার আপডেটেও ব্যবহারকারীর নির্বাচিত পাথ অক্ষত থাকে।
// ────────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const paths = require("../config/paths.cjs");

let cache = null;

const DEFAULTS = {
  dbDirectory: paths.DEFAULT_DB_DIR,   // ডিফল্ট: D:\BustanulIslam\Data
  autoBackup: true,
  autoBackupIntervalHours: 24,
  lastBackupAt: null,
  setupComplete: false,                // প্রথম-রান সেটআপ শেষ হয়েছে কিনা
};

function readConfigFile() {
  try {
    return JSON.parse(fs.readFileSync(paths.getConfigFilePath(), "utf-8"));
  } catch {
    return {}; // ফাইল নেই/ভাঙা → খালি অবজেক্ট, ডিফল্ট প্রযোজ্য হবে
  }
}

function writeConfigFile(data) {
  const file = paths.getConfigFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function loadSettings() {
  if (!cache) cache = { ...DEFAULTS, ...readConfigFile() };
  return cache;
}

function saveSettings(patch) {
  cache = { ...loadSettings(), ...patch };
  writeConfigFile(cache);
  return cache;
}

function getDbDirectory() {
  return loadSettings().dbDirectory;
}

function setDbDirectory(dir) {
  return saveSettings({ dbDirectory: dir });
}

// DB ডিরেক্টরি আছে কিনা নিশ্চিত করে; না থাকলে তৈরি করে।
// ডিফল্ট পাথ (যেমন D:\) তৈরি করা না গেলে userData/Data-তে fallback করে
// এবং সেই পাথ সংরক্ষণ করে — যাতে অ্যাপ কখনও DB ছাড়া আটকে না যায়।
function ensureDbDirectory() {
  const dir = getDbDirectory();
  try {
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    const fallback = path.join(paths.getUserDataDir(), "Data");
    fs.mkdirSync(fallback, { recursive: true });
    if (dir !== fallback) saveSettings({ dbDirectory: fallback });
    return fallback;
  }
}

module.exports = {
  loadSettings,
  saveSettings,
  getDbDirectory,
  setDbDirectory,
  ensureDbDirectory,
};
