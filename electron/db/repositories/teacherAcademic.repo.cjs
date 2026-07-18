// ────────────────────────────────────────────────────────────────
//  teacherAcademic.repo.cjs — শিক্ষক একাডেমিক লগ (ক্লাস ডায়েরি / পারফরম্যান্স নোট)।
//  বিষয়/ক্লাস/রুটিন/সার্টিফিকেট teachers.extra JSON-এ থাকে (আলাদা নয়)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

const today = () => new Date().toISOString().slice(0, 10);

function list(teacherId, logType) {
  const db = getDb();
  if (logType) return db.all("SELECT * FROM teacher_academic_log WHERE teacher_id = ? AND log_type = ? ORDER BY date(log_date) DESC, id DESC", [teacherId, logType]);
  return db.all("SELECT * FROM teacher_academic_log WHERE teacher_id = ? ORDER BY date(log_date) DESC, id DESC", [teacherId]);
}

function add(data = {}) {
  const db = getDb();
  const res = db.run(
    `INSERT INTO teacher_academic_log (teacher_id, log_type, log_date, class, subject, title, detail, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.teacher_id || null, data.log_type || "diary", data.log_date || today(),
      data.class || null, data.subject || null, data.title || null, data.detail || null, data.rating || null]
  );
  return db.get("SELECT * FROM teacher_academic_log WHERE id = ?", [Number(res.lastInsertRowid)]);
}

function remove(id) {
  getDb().run("DELETE FROM teacher_academic_log WHERE id = ?", [id]);
  return { id };
}

module.exports = { list, add, remove };
