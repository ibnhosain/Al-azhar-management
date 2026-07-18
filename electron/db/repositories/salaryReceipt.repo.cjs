// ────────────────────────────────────────────────────────────────
//  salaryReceipt.repo.cjs — সংরক্ষিত বেতন রশিদ (শিক্ষকের পোর্টালে)।
//  snapshot-এ প্রিন্টের সম্পূর্ণ ডেটা (JSON); ledger অপরিবর্তিত।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

function decorate(row) {
  if (!row) return row;
  let snap = null;
  try { snap = row.snapshot ? JSON.parse(row.snapshot) : null; } catch { snap = null; }
  return { ...row, snapshot: snap };
}

function list(teacherId) {
  return getDb().all("SELECT * FROM salary_receipts WHERE teacher_id = ? ORDER BY id DESC", [teacherId]).map(decorate);
}

function getById(id) {
  return decorate(getDb().get("SELECT * FROM salary_receipts WHERE id = ?", [id]));
}

function nextNo(db) {
  const r = db.get("SELECT COUNT(*) AS c FROM salary_receipts");
  return "SR-" + String((r ? r.c : 0) + 1).padStart(5, "0");
}

function add(data = {}) {
  const db = getDb();
  const res = db.run(
    `INSERT INTO salary_receipts (teacher_id, ledger_id, receipt_no, teacher_name, teacher_code, month, amount, method, reference, collected_by, r_date, snapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.teacher_id || null, data.ledger_id || null, data.receipt_no || nextNo(db),
      data.teacher_name || null, data.teacher_code || null, data.month || null, round(data.amount),
      data.method || null, data.reference || null, data.collected_by || null,
      data.r_date || new Date().toISOString().slice(0, 10),
      data.snapshot ? JSON.stringify(data.snapshot) : null]
  );
  return getById(Number(res.lastInsertRowid));
}

function remove(id) {
  getDb().run("DELETE FROM salary_receipts WHERE id = ?", [id]);
  return { id };
}

module.exports = { list, getById, add, remove };
