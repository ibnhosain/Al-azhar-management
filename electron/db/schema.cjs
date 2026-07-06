// ────────────────────────────────────────────────────────────────
//  schema.cjs — ডেটাবেস টেবিল ও migration।
//  প্রতিটি migration ক্রমিকভাবে একবারই চলে; বর্তমান সংস্করণ
//  SQLite-এর `PRAGMA user_version`-এ সংরক্ষিত থাকে।
//  ভবিষ্যতে নতুন টেবিল/পরিবর্তন দরকার হলে শুধু `migrations` অ্যারের
//  শেষে একটি নতুন ফাংশন যোগ করুন — পুরনো DB নিজে থেকেই আপডেট হবে।
// ────────────────────────────────────────────────────────────────

const migrations = [
  // ── v1: মূল টেবিল (Step 4-এ প্রথমে এগুলো wire হবে) ──
  function v1(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        code        TEXT    UNIQUE,
        name        TEXT    NOT NULL,
        class       TEXT,
        roll        TEXT,
        gender      TEXT,
        fee         TEXT,
        status      TEXT    NOT NULL DEFAULT 'সক্রিয়',
        created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS teachers (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        code        TEXT    UNIQUE,
        name        TEXT    NOT NULL,
        subject     TEXT,
        phone       TEXT,
        salary      TEXT,
        status      TEXT    NOT NULL DEFAULT 'সক্রিয়',
        created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );
    `);
  },

  // ── v2: বাকি ফিচারের টেবিল (entities config থেকে জেনারেট) + attendance ──
  function v2(db) {
    const entities = require("./entities.cjs");
    for (const [table, columns] of Object.entries(entities)) {
      const cols = columns.map((c) => `        ${c} TEXT`).join(",\n");
      db.exec(
        `CREATE TABLE IF NOT EXISTS ${table} (\n` +
          `        id INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
          `${cols},\n` +
          `        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))\n` +
          `      );`
      );
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS attendance (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        student_code  TEXT,
        student_name  TEXT,
        class         TEXT,
        roll          TEXT,
        date          TEXT NOT NULL,
        status        TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        UNIQUE(student_code, date)
      );
    `);
  },

  // ── v3: Boarding module — বাজার (header+items) ও খরচ (amount REAL, যাতে যোগফল হয়) ──
  function v3(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS boarding_expense (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_no     TEXT,
        date           TEXT,
        category       TEXT,
        description    TEXT,
        amount         REAL NOT NULL DEFAULT 0,
        paid_by        TEXT,
        approved_by    TEXT,
        remarks        TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS boarding_bazar (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_no    TEXT,
        date           TEXT,
        fund           TEXT,
        purchased_by   TEXT,
        remarks        TEXT,
        total          REAL NOT NULL DEFAULT 0,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS boarding_bazar_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        bazar_id   INTEGER NOT NULL REFERENCES boarding_bazar(id) ON DELETE CASCADE,
        item_name  TEXT,
        unit       TEXT,
        quantity   REAL NOT NULL DEFAULT 0,
        unit_price REAL NOT NULL DEFAULT 0,
        subtotal   REAL NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_bazar_items_bazar ON boarding_bazar_items(bazar_id);
    `);
  },

  // ── v4: Boarding sub-modules (rooms, beds, allocation, meals, leaves, visitors) ──
  //  entities config থেকে (existing DB-র জন্য; fresh DB v2-তেই তৈরি হয়)।
  function v4(db) {
    const entities = require("./entities.cjs");
    for (const table of ["rooms", "beds", "bed_allocations", "meals", "leaves", "visitors"]) {
      const columns = entities[table];
      if (!columns) continue;
      const cols = columns.map((c) => `        ${c} TEXT`).join(",\n");
      db.exec(
        `CREATE TABLE IF NOT EXISTS ${table} (\n` +
          `        id INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
          `${cols},\n` +
          `        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))\n` +
          `      );`
      );
    }
  },

  // ── v5: Academic / Promotion / Admin ──
  function v5(db) {
    const entities = require("./entities.cjs");
    for (const table of ["academic_results", "exam_routine", "promotions", "staff"]) {
      const columns = entities[table];
      if (!columns) continue;
      const cols = columns.map((c) => `        ${c} TEXT`).join(",\n");
      db.exec(
        `CREATE TABLE IF NOT EXISTS ${table} (\n` +
          `        id INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
          `${cols},\n` +
          `        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))\n` +
          `      );`
      );
    }
  },

  // ── v6: Kitchen & Meal — student meal profiles + holidays + meal pauses ──
  function v6(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_meal_profiles (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id     INTEGER UNIQUE REFERENCES students(id) ON DELETE CASCADE,
        take_breakfast TEXT NOT NULL DEFAULT '1',
        take_lunch     TEXT NOT NULL DEFAULT '1',
        take_dinner    TEXT NOT NULL DEFAULT '1',
        home_food      TEXT NOT NULL DEFAULT '0',
        meal_status    TEXT NOT NULL DEFAULT 'active',
        diet_type      TEXT DEFAULT 'normal',
        allergy        TEXT,
        note           TEXT,
        photo_path     TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
    `);
    const entities = require("./entities.cjs");
    for (const table of ["holidays", "meal_pauses"]) {
      const columns = entities[table];
      if (!columns) continue;
      const cols = columns.map((c) => `        ${c} TEXT`).join(",\n");
      db.exec(
        `CREATE TABLE IF NOT EXISTS ${table} (\n` +
          `        id INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
          `${cols},\n` +
          `        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))\n` +
          `      );`
      );
    }
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(h_date);
      CREATE INDEX IF NOT EXISTS idx_pause_dates ON meal_pauses(from_date, to_date);
      CREATE INDEX IF NOT EXISTS idx_pause_code ON meal_pauses(student_code);
    `);
  },
];

// বর্তমান স্কিমা সংস্করণ পড়া।
function getUserVersion(db) {
  const row = db.get("PRAGMA user_version");
  return row ? Number(row.user_version) : 0;
}

// প্রয়োজনীয় সব migration চালানো (প্রতিটি transaction-এ, নিরাপদভাবে)।
function initSchema(db) {
  const current = getUserVersion(db);
  for (let v = current; v < migrations.length; v++) {
    db.exec("BEGIN");
    try {
      migrations[v](db);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
  return { from: current, to: migrations.length };
}

module.exports = { initSchema, getUserVersion };
