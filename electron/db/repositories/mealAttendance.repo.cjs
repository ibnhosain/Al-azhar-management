// ────────────────────────────────────────────────────────────────
//  mealAttendance.repo.cjs — মিল হাজিরা (তারিখ+বেলা প্রতি ছাত্র)।
//  save = ঐ বেলার সব রো প্রতিস্থাপন (দৈনিক হাজিরার প্যাটার্নের মতো)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

function getForMeal(date, mealType) {
  return getDb().all("SELECT * FROM meal_attendance WHERE m_date = ? AND meal_type = ? ORDER BY id ASC", [date, mealType]);
}

function summary(date, mealType) {
  const rows = getDb().all("SELECT status, COUNT(*) AS c FROM meal_attendance WHERE m_date = ? AND meal_type = ? GROUP BY status", [date, mealType]);
  const s = { present: 0, absent: 0, leave: 0, total: 0 };
  rows.forEach((r) => { if (s[r.status] !== undefined) s[r.status] = r.c; s.total += r.c; });
  return s;
}

function saveForMeal(date, mealType, records) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.run("DELETE FROM meal_attendance WHERE m_date = ? AND meal_type = ?", [date, mealType]);
    for (const r of records || []) {
      db.run(
        "INSERT INTO meal_attendance (m_date, meal_type, student_id, student_code, student_name, status, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [date, mealType, r.student_id || null, r.student_code || null, r.student_name || null, r.status || "present", r.note || null]
      );
    }
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
  return summary(date, mealType);
}

module.exports = { getForMeal, saveForMeal, summary };
