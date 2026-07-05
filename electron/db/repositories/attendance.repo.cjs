// ────────────────────────────────────────────────────────────────
//  attendance.repo.cjs — দৈনিক হাজিরা (custom, CRUD নয়)।
//  একটি তারিখের জন্য সব শিক্ষার্থীর হাজিরা একসাথে সংরক্ষণ/লোড হয়।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

function getByDate(date) {
  return getDb().all("SELECT * FROM attendance WHERE date = ? ORDER BY id ASC", [date]);
}

// ওই তারিখের পুরনো রেকর্ড মুছে নতুন করে সংরক্ষণ (transaction-এ)।
function saveForDate(date, records) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.run("DELETE FROM attendance WHERE date = ?", [date]);
    for (const r of records) {
      db.run(
        "INSERT INTO attendance (student_code, student_name, class, roll, date, status) VALUES (?, ?, ?, ?, ?, ?)",
        [r.student_code ?? null, r.student_name ?? null, r.class ?? null, r.roll ?? null, date, r.status ?? null]
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return getByDate(date);
}

module.exports = { getByDate, saveForDate };
