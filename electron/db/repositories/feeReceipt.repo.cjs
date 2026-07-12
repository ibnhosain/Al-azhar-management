// ────────────────────────────────────────────────────────────────
//  feeReceipt.repo.cjs — বেতন ব্যবস্থাপনা (মানি রিসিট)।
//  প্রতি রিসিট = এক ছাত্রের এক মাসের ফি আইটেম (JSON) + মোট হিসাব।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const parseItems = (s) => { try { return s ? JSON.parse(s) : []; } catch { return []; } };

function totalsOf(items) {
  return (items || []).reduce((t, it) => ({
    amount: t.amount + (Number(it.amount) || 0),
    received: t.received + (Number(it.received) || 0),
    discount: t.discount + (Number(it.discount) || 0),
    due: t.due + (Number(it.due) || 0),
  }), { amount: 0, received: 0, discount: 0, due: 0 });
}

function decorate(row) {
  if (!row) return row;
  return { ...row, items: parseItems(row.items) };
}

function nextReceiptNo(db) {
  const r = db.get("SELECT COUNT(*) AS c FROM fee_receipts");
  return "MR-" + String((r ? r.c : 0) + 1).padStart(5, "0");
}

function list(filter = {}) {
  const db = getDb();
  const where = [], params = [];
  if (filter.month) { where.push("month = ?"); params.push(filter.month); }
  if (filter.class) { where.push("class = ?"); params.push(filter.class); }
  if (filter.section) { where.push("section = ?"); params.push(filter.section); }
  if (filter.collector) { where.push("collector = ?"); params.push(filter.collector); }
  if (filter.studentId) { where.push("student_id = ?"); params.push(filter.studentId); }
  const sql = `SELECT * FROM fee_receipts ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC`;
  return db.all(sql, params).map(decorate);
}

function totals(filter = {}) {
  const rows = list(filter);
  return rows.reduce((t, r) => ({
    amount: round(t.amount + (r.total_amount || 0)),
    received: round(t.received + (r.total_received || 0)),
    discount: round(t.discount + (r.total_discount || 0)),
    due: round(t.due + (r.total_due || 0)),
    count: t.count + 1,
  }), { amount: 0, received: 0, discount: 0, due: 0, count: 0 });
}

function getById(id) {
  return decorate(getDb().get("SELECT * FROM fee_receipts WHERE id = ?", [id]));
}

// ঐ ছাত্রের আগের মাসগুলোর বকেয়া (due > 0), নির্বাচিত মাসের আগের
function duesForStudent(studentId, beforeMonth) {
  const db = getDb();
  const rows = db.all("SELECT month, total_due FROM fee_receipts WHERE student_id = ? AND total_due > 0 ORDER BY month ASC", [studentId]);
  return rows.filter((r) => !beforeMonth || String(r.month) < String(beforeMonth)).map((r) => ({ month: r.month, due: round(r.total_due) }));
}

function create(data = {}) {
  const db = getDb();
  const items = data.items || [];
  const t = totalsOf(items);
  const res = db.run(
    `INSERT INTO fee_receipts (receipt_no, student_id, student_code, student_name, class, section, student_type, month, year, items, total_amount, total_received, total_discount, total_due, collector, note, r_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.receipt_no || nextReceiptNo(db), data.student_id || null, data.student_code || null, data.student_name || null,
      data.class || null, data.section || null, data.student_type || null, data.month || null, data.year || null,
      JSON.stringify(items), round(t.amount), round(t.received), round(t.discount), round(t.due),
      data.collector || null, data.note || null, data.r_date || new Date().toISOString().slice(0, 10),
    ]
  );
  return getById(Number(res.lastInsertRowid));
}

function remove(id) {
  getDb().run("DELETE FROM fee_receipts WHERE id = ?", [id]);
  return { id };
}

module.exports = { list, totals, getById, duesForStudent, create, remove };
