// ────────────────────────────────────────────────────────────────
//  students.repo.cjs — students টেবিলের CRUD (Repository)।
//  এখানে শুধু ডেটা-লজিক; কোনো IPC/UI কোড নেই।
//  ভবিষ্যতে একই লজিক অনলাইন সার্ভারেও reuse করা যাবে।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

const COLS = "id, code, name, class, roll, gender, fee, status, created_at";

function list() {
  return getDb().all(`SELECT ${COLS} FROM students ORDER BY id ASC`);
}

function getById(id) {
  return getDb().get(`SELECT ${COLS} FROM students WHERE id = ?`, [id]);
}

function create(data) {
  const db = getDb();
  const res = db.run(
    `INSERT INTO students (code, name, class, roll, gender, fee, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.code ?? null,
      data.name,
      data.class ?? null,
      data.roll ?? null,
      data.gender ?? null,
      data.fee ?? null,
      data.status ?? "সক্রিয়",
    ]
  );
  return getById(Number(res.lastInsertRowid));
}

function update(id, data) {
  const db = getDb();
  db.run(
    `UPDATE students
       SET code = ?, name = ?, class = ?, roll = ?, gender = ?, fee = ?, status = ?
     WHERE id = ?`,
    [
      data.code ?? null,
      data.name,
      data.class ?? null,
      data.roll ?? null,
      data.gender ?? null,
      data.fee ?? null,
      data.status ?? "সক্রিয়",
      id,
    ]
  );
  return getById(id);
}

function remove(id) {
  getDb().run("DELETE FROM students WHERE id = ?", [id]);
  return { id };
}

module.exports = { list, getById, create, update, remove };
