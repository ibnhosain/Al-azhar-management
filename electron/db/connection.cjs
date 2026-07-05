// ────────────────────────────────────────────────────────────────
//  connection.cjs — SQLite সংযোগ ব্যবস্থাপনা (singleton)।
//  node-sqlite3-wasm ব্যবহার করে (native compile লাগে না)।
//  পুরো অ্যাপে একটিই সংযোগ থাকে; init একবার, তারপর getDb() দিয়ে ব্যবহার।
// ────────────────────────────────────────────────────────────────
const fs = require("fs");
const { Database } = require("node-sqlite3-wasm");
const settings = require("../services/settings.service.cjs");
const paths = require("../config/paths.cjs");
const { initSchema } = require("./schema.cjs");
const { seedIfEmpty } = require("./seed.cjs");

let db = null;
let dbFilePath = null;

// অ্যাপ চালু হলে একবার কল হয়: ডিরেক্টরি নিশ্চিত → DB খোলা → স্কিমা তৈরি।
function initDatabase() {
  if (db) return db;

  const dir = settings.ensureDbDirectory();
  dbFilePath = paths.getDbFilePath(dir);

  const isNewDb = !fs.existsSync(dbFilePath); // ফাইল আগে না থাকলে এটি প্রথম রান

  db = new Database(dbFilePath);
  db.exec("PRAGMA foreign_keys = ON");

  const result = initSchema(db);
  if (isNewDb) seedIfEmpty(db); // শুধু নতুন DB-তে ডেমো ডেটা বসাও
  console.log(`[db] ready at ${dbFilePath} (schema v${result.to}${isNewDb ? ", seeded" : ""})`);
  return db;
}

// চালু থাকা সংযোগ ফেরত দেয় (init না হলে স্পষ্ট এরর)।
function getDb() {
  if (!db) throw new Error("Database not initialized — call initDatabase() first.");
  return db;
}

// বর্তমান DB ফাইলের পাথ (UI/backup-এ দেখানোর জন্য)।
function getDatabasePath() {
  return dbFilePath;
}

// অ্যাপ বন্ধ হওয়ার সময় সংযোগ নিরাপদে বন্ধ করা।
function closeDatabase() {
  if (db) {
    try { db.close(); } catch { /* ignore */ }
    db = null;
  }
}

module.exports = { initDatabase, getDb, getDatabasePath, closeDatabase };
