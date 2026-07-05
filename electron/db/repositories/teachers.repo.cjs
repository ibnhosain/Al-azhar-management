// ────────────────────────────────────────────────────────────────
//  teachers.repo.cjs — teachers টেবিলের CRUD (Repository)।
//  students.repo.cjs-এর অনুরূপ প্যাটার্ন (modular ও পুনঃব্যবহারযোগ্য)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

const COLS = "id, code, name, subject, phone, salary, status, created_at";

function list() {
  return getDb().all(`SELECT ${COLS} FROM teachers ORDER BY id ASC`);
}

function getById(id) {
  return getDb().get(`SELECT ${COLS} FROM teachers WHERE id = ?`, [id]);
}

function create(data) {
  const db = getDb();
  const res = db.run(
    `INSERT INTO teachers (code, name, subject, phone, salary, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.code ?? null,
      data.name,
      data.subject ?? null,
      data.phone ?? null,
      data.salary ?? null,
      data.status ?? "সক্রিয়",
    ]
  );
  return getById(Number(res.lastInsertRowid));
}

function update(id, data) {
  const db = getDb();
  db.run(
    `UPDATE teachers
       SET code = ?, name = ?, subject = ?, phone = ?, salary = ?, status = ?
     WHERE id = ?`,
    [
      data.code ?? null,
      data.name,
      data.subject ?? null,
      data.phone ?? null,
      data.salary ?? null,
      data.status ?? "সক্রিয়",
      id,
    ]
  );
  return getById(id);
}

function remove(id) {
  getDb().run("DELETE FROM teachers WHERE id = ?", [id]);
  return { id };
}

module.exports = { list, getById, create, update, remove };
