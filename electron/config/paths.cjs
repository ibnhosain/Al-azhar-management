// ────────────────────────────────────────────────────────────────
//  paths.cjs — অ্যাপের সব গুরুত্বপূর্ণ ফাইল/ফোল্ডার পাথ এক জায়গায়।
//  এখানে পরিবর্তন করলেই পুরো অ্যাপের পাথ বদলে যায় (single source of truth)।
// ────────────────────────────────────────────────────────────────
const { app } = require("electron");
const path = require("path");

// ব্যবহারকারী নিজে পরিবর্তন না করলে ডেটাবেস এখানে থাকবে।
const DEFAULT_DB_DIR = "D:\\BustanulIslam\\Data";
const DB_FILENAME = "madrasa.db";
const CONFIG_FILENAME = "config.json";

// Electron-এর userData: প্রতি-ব্যবহারকারী OS-নির্ধারিত ফোল্ডার।
// এটি ইনস্টল ফোল্ডারের বাইরে → সফটওয়্যার আপডেট/রিইনস্টলে মুছে যায় না।
// তাই ব্যবহারকারীর নির্বাচিত DB-পাথের মতো ছোট সেটিংস এখানে রাখা নিরাপদ।
function getUserDataDir() {
  return app.getPath("userData");
}

// অ্যাপ সেটিংস ফাইল (কোন ফোল্ডারে DB আছে তা এখানে লেখা থাকে)।
function getConfigFilePath() {
  return path.join(getUserDataDir(), CONFIG_FILENAME);
}

// প্রকৃত ডেটাবেস ফাইলের পূর্ণ পাথ (DB ডিরেক্টরির ভিতরে)।
function getDbFilePath(dbDir) {
  return path.join(dbDir, DB_FILENAME);
}

// ব্যাকআপ ফোল্ডার।
function getBackupDir(dbDir) {
  return path.join(dbDir, "backups");
}

// ছাত্র/মিল ছবির ফোল্ডার (DB-র পাশে; ব্যাকআপেও অন্তর্ভুক্ত হবে)।
function getPhotosDir(dbDir) {
  return path.join(dbDir, "photos");
}

module.exports = {
  DEFAULT_DB_DIR,
  DB_FILENAME,
  CONFIG_FILENAME,
  getUserDataDir,
  getConfigFilePath,
  getDbFilePath,
  getBackupDir,
  getPhotosDir,
};
