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

  // ── v7: Kitchen পরিকল্পনা — উপকরণ মাস্টার, পদ, রেসিপি, মেনু ──
  //  টেবিলগুলো typed (REAL/INTEGER) তাই entities auto-gen নয়, এখানে explicit।
  //  ভবিষ্যতের Kitchen Store/Purchase/Supplier ingredient_id দিয়ে এগুলোকে
  //  রেফার করতে পারবে — বিদ্যমান টেবিল না বদলেই (future-ready)।
  function v7(db) {
    db.exec(`
      -- factory-managed কলামে NOT NULL দেওয়া হয় না: factory omitted কলামে
      -- explicit NULL পাঠায় → DEFAULT থাকলেও NOT NULL ভাঙে (institution_id-এর মতো)।
      CREATE TABLE IF NOT EXISTS ingredients (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        name_bn           TEXT NOT NULL,
        name_en           TEXT,
        category          TEXT,
        unit              TEXT DEFAULT 'কেজি',
        avg_cost          REAL DEFAULT 0,
        purchase_unit     TEXT,
        conversion_factor REAL DEFAULT 1,
        min_stock         REAL DEFAULT 0,
        active            TEXT DEFAULT '1',
        note              TEXT,
        institution_id    INTEGER NOT NULL DEFAULT 1,
        created_at        TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS dishes (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT NOT NULL,
        category       TEXT,
        meal_type      TEXT NOT NULL DEFAULT 'any',
        photo_path     TEXT,
        prep_time      INTEGER NOT NULL DEFAULT 0,
        cook_time      INTEGER NOT NULL DEFAULT 0,
        serving_type   TEXT,
        description    TEXT,
        active         TEXT NOT NULL DEFAULT '1',
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS recipes (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id             INTEGER UNIQUE REFERENCES dishes(id) ON DELETE CASCADE,
        cooking_notes       TEXT,
        prep_notes          TEXT,
        special_instruction TEXT,
        institution_id      INTEGER NOT NULL DEFAULT 1,
        created_at          TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS recipe_items (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id         INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
        ingredient_id   INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
        qty_per_person  REAL NOT NULL DEFAULT 0,
        unit            TEXT,
        optional        TEXT NOT NULL DEFAULT '0',
        note            TEXT,
        created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS menus (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        m_date         TEXT,
        meal_type      TEXT NOT NULL DEFAULT 'lunch',
        menu_type      TEXT NOT NULL DEFAULT 'normal',
        title          TEXT,
        is_template    TEXT NOT NULL DEFAULT '0',
        note           TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_id    INTEGER REFERENCES menus(id) ON DELETE CASCADE,
        dish_id    INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
        note       TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE INDEX IF NOT EXISTS idx_ingredients_cat ON ingredients(category);
      CREATE INDEX IF NOT EXISTS idx_dishes_cat ON dishes(category);
      CREATE INDEX IF NOT EXISTS idx_dishes_meal ON dishes(meal_type);
      CREATE INDEX IF NOT EXISTS idx_recipe_items_dish ON recipe_items(dish_id);
      CREATE INDEX IF NOT EXISTS idx_menus_date ON menus(m_date, meal_type);
      CREATE INDEX IF NOT EXISTS idx_menu_items_menu ON menu_items(menu_id);
    `);
  },

  // ── v8: কিচেন স্টোর / ক্রয় / সরবরাহকারী (Inventory) ──
  //  স্টক একটি লেজার (store_transactions); বর্তমান স্টক লেজার থেকে গণনা হয়।
  //  ক্রয় সেভ করলে প্রতি আইটেমে একটি 'in' লেজার এন্ট্রি স্বয়ংক্রিয়ভাবে বসে।
  //  সব ক্রয়/স্টক ingredient_id দিয়ে Phase 2 উপকরণকে রেফার করে।
  function v8(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT NOT NULL,
        phone          TEXT,
        address        TEXT,
        note           TEXT,
        active         TEXT DEFAULT '1',
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        p_date         TEXT NOT NULL,
        supplier_id    INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        total          REAL DEFAULT 0,
        note           TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id   INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(id),
        qty           REAL NOT NULL DEFAULT 0,
        unit          TEXT,
        unit_cost     REAL NOT NULL DEFAULT 0,
        subtotal      REAL NOT NULL DEFAULT 0,
        created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS store_transactions (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        ingredient_id  INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
        t_date         TEXT NOT NULL,
        type           TEXT NOT NULL DEFAULT 'in',
        qty            REAL NOT NULL DEFAULT 0,
        unit           TEXT,
        unit_cost      REAL NOT NULL DEFAULT 0,
        source         TEXT NOT NULL DEFAULT 'manual',
        ref_id         INTEGER,
        note           TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE INDEX IF NOT EXISTS idx_store_txn_ing ON store_transactions(ingredient_id);
      CREATE INDEX IF NOT EXISTS idx_store_txn_date ON store_transactions(t_date);
      CREATE INDEX IF NOT EXISTS idx_store_txn_src ON store_transactions(source, ref_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_items_pur ON purchase_items(purchase_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(p_date);
    `);
  },

  // ── v9: মিল অপারেশন — হাজিরা / গেস্ট মিল / অনুমোদন ──
  //  অনুমোদন করলে ঐ বেলার প্রকৃত সংখ্যা (হাজির+গেস্ট) × রেসিপি অনুযায়ী
  //  store_transactions-এ 'out' (consumption) পোস্ট হয় (ref_id = approval id)।
  function v9(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS meal_attendance (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        m_date         TEXT NOT NULL,
        meal_type      TEXT NOT NULL,
        student_id     INTEGER REFERENCES students(id) ON DELETE CASCADE,
        student_code   TEXT,
        student_name   TEXT,
        status         TEXT NOT NULL DEFAULT 'present',
        note           TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS guest_meals (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        g_date         TEXT NOT NULL,
        meal_type      TEXT NOT NULL,
        guest_count    INTEGER NOT NULL DEFAULT 0,
        guest_name     TEXT,
        reason         TEXT,
        note           TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS meal_approvals (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        m_date         TEXT NOT NULL,
        meal_type      TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'draft',
        present_count  INTEGER NOT NULL DEFAULT 0,
        guest_count    INTEGER NOT NULL DEFAULT 0,
        total_count    INTEGER NOT NULL DEFAULT 0,
        approved_by    TEXT,
        approved_at    TEXT,
        note           TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE INDEX IF NOT EXISTS idx_mattend_dm ON meal_attendance(m_date, meal_type);
      CREATE INDEX IF NOT EXISTS idx_mattend_student ON meal_attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_guest_dm ON guest_meals(g_date, meal_type);
      CREATE INDEX IF NOT EXISTS idx_approval_dm ON meal_approvals(m_date, meal_type);
    `);
  },

  // ── v10: শিক্ষার্থী ভর্তি ফরমের বাড়তি তথ্য (পিতা/মাতা/অভিভাবক/ঠিকানা/ছবি…)
  //  core কলাম (code/name/class/roll/gender/fee/status) অপরিবর্তিত; বাকি সব
  //  একটি JSON কলাম `extra`-তে রাখা হয় (নমনীয়, ভবিষ্যতে ফিল্ড বাড়ানো সহজ)।
  function v10(db) {
    const cols = db.all("PRAGMA table_info(students)").map((c) => c.name);
    if (!cols.includes("extra")) db.exec("ALTER TABLE students ADD COLUMN extra TEXT");
  },

  // ── v11: বেতন ব্যবস্থাপনা — মানি রিসিট (fee_receipts)।
  //  প্রতিটি রিসিটে এক ছাত্রের এক মাসের ফি আইটেমসমূহ (JSON) + মোট হিসাব।
  function v11(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS fee_receipts (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_no     TEXT,
        student_id     INTEGER REFERENCES students(id) ON DELETE CASCADE,
        student_code   TEXT,
        student_name   TEXT,
        class          TEXT,
        section        TEXT,
        student_type   TEXT,
        month          TEXT,
        year           TEXT,
        items          TEXT,
        total_amount   REAL DEFAULT 0,
        total_received REAL DEFAULT 0,
        total_discount REAL DEFAULT 0,
        total_due      REAL DEFAULT 0,
        collector      TEXT,
        note           TEXT,
        r_date         TEXT,
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_fee_month ON fee_receipts(month);
      CREATE INDEX IF NOT EXISTS idx_fee_student ON fee_receipts(student_id);
    `);
  },

  // ── v12: শিক্ষকের বাড়তি তথ্য (পদবি/যোগ্যতা/ইমেইল/যোগদান/ঠিকানা/ছবি) → extra JSON।
  function v12(db) {
    const cols = db.all("PRAGMA table_info(teachers)").map((c) => c.name);
    if (!cols.includes("extra")) db.exec("ALTER TABLE teachers ADD COLUMN extra TEXT");
  },

  // ── v13: শিক্ষক বেতন লেজার (HR/Payroll) — ব্যাংক-স্টেটমেন্ট নীতি।
  //  প্রতিটি বেতন-সংক্রান্ত লেনদেন একটি স্থায়ী, অপরিবর্তনীয় (append-only) সারি।
  //  কখনো overwrite/delete হয় না; ভুল সংশোধনে বিপরীত এন্ট্রি (reversal) যোগ হয়।
  //  kind: 'earning'(প্রাপ্য: বেতন/ভাতা/বোনাস) | 'payment'(পরিশোধ/অগ্রিম) | 'deduction'(কর্তন/ঋণ)।
  //  নিট প্রাপ্য = Σ earning − Σ payment − Σ deduction (running balance)।
  //  ভবিষ্যতে Finance/Accounts মডিউলের সাথে integrate করার জন্য প্রস্তুত।
  function v13(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS salary_ledger (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id     INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        teacher_code   TEXT,
        teacher_name   TEXT,
        month          TEXT,                       -- YYYY-MM (কোন মাসের বেতন)
        txn_date       TEXT NOT NULL,              -- প্রকৃত লেনদেনের তারিখ
        kind           TEXT NOT NULL,              -- earning | payment | deduction
        category       TEXT NOT NULL,              -- salary/allowance/bonus/payment/advance/loan/deduction/adjustment
        amount         REAL NOT NULL DEFAULT 0,    -- সর্বদা ধনাত্মক
        method         TEXT,                       -- নগদ/ব্যাংক/মোবাইল/চেক
        reference      TEXT,
        notes          TEXT,
        collected_by   TEXT,
        reversed_of    INTEGER,                    -- reversal হলে মূল লেনদেনের id
        institution_id INTEGER NOT NULL DEFAULT 1,
        created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_salledger_teacher ON salary_ledger(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_salledger_month ON salary_ledger(teacher_id, month);
      CREATE INDEX IF NOT EXISTS idx_salledger_date ON salary_ledger(txn_date);
    `);
  },

  // ── v14: শিক্ষক একাডেমিক লগ — ক্লাস ডায়েরি ও পারফরম্যান্স নোট (append)।
  //  বিষয়/ক্লাস/রুটিন/সার্টিফিকেট teachers.extra JSON-এ; এই লগ টেবিলে
  //  সময়-ভিত্তিক এন্ট্রি (রিপোর্টে ব্যবহারযোগ্য)।
  function v14(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_academic_log (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id  INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        log_type    TEXT NOT NULL,           -- 'diary' | 'performance'
        log_date    TEXT,
        class       TEXT,
        subject     TEXT,
        title       TEXT,
        detail      TEXT,
        rating      TEXT,                     -- performance: মান/লেবেল
        created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_tacademic_teacher ON teacher_academic_log(teacher_id, log_type);
    `);
  },

  // ── v15: শিক্ষক ডকুমেন্ট — নিয়োগপত্র/NID/CV/সার্টিফিকেট/চুক্তিপত্র ইত্যাদি ফাইল।
  //  ফাইল <dbDir>/documents/-এ; এই টেবিলে শুধু metadata + সংরক্ষিত ফাইলনাম।
  function v15(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_documents (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id    INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        doc_type      TEXT,                    -- appointment/nid/cv/certificate/experience/contract/other
        title         TEXT,
        original_name TEXT,
        stored_name   TEXT,
        mime          TEXT,
        size          INTEGER DEFAULT 0,
        created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_tdocs_teacher ON teacher_documents(teacher_id);
    `);
  },

  // ── v16: সংরক্ষিত বেতন রশিদ — শিক্ষকের পোর্টালে সংরক্ষণ, পরে প্রিন্ট/ডিলিট।
  //  snapshot = প্রিন্টের সম্পূর্ণ ডেটা (JSON); ledger অপরিবর্তিত থাকে।
  function v16(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS salary_receipts (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id    INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
        ledger_id     INTEGER,
        receipt_no    TEXT,
        teacher_name  TEXT,
        teacher_code  TEXT,
        month         TEXT,
        amount        REAL DEFAULT 0,
        method        TEXT,
        reference     TEXT,
        collected_by  TEXT,
        r_date        TEXT,
        snapshot      TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE INDEX IF NOT EXISTS idx_salreceipt_teacher ON salary_receipts(teacher_id);
    `);
  },

  // ── v17: দৈনিক বাড়ির কাজ (homework) — entities config থেকে auto CRUD; existing DB-র জন্য টেবিল।
  function v17(db) {
    const entities = require("./entities.cjs");
    const columns = entities.homework;
    const cols = columns.map((c) => `        ${c} TEXT`).join(",\n");
    db.exec(
      `CREATE TABLE IF NOT EXISTS homework (\n` +
        `        id INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
        `${cols},\n` +
        `        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))\n` +
        `      );\n` +
      `      CREATE INDEX IF NOT EXISTS idx_homework_date ON homework(h_date);`
    );
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
