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

function findByStudentMonth(db, studentId, month) {
  return db.get("SELECT * FROM fee_receipts WHERE student_id = ? AND month = ? ORDER BY id ASC LIMIT 1", [studentId, month]);
}

// এক ছাত্রের সম্পূর্ণ বেতন সারাংশ: প্রতি মাসের নির্ধারিত/পরিশোধিত/বকেয়া + স্ট্যাটাস।
// স্ট্যাটাস "পরিশোধিত" কেবল তখনই যখন ঐ মাসের বকেয়া ≤ ০ (অর্থাৎ নির্ধারিত ফি পুরো পরিশোধ)।
function studentSummary(studentId) {
  const db = getDb();
  const rows = db.all(
    "SELECT month, year, total_amount, total_received, total_discount, total_due, items FROM fee_receipts WHERE student_id = ? ORDER BY month ASC",
    [studentId]
  );
  const months = rows.map((r) => ({
    month: r.month, year: r.year,
    amount: round(r.total_amount), received: round(r.total_received),
    discount: round(r.total_discount), due: round(r.total_due),
    status: round(r.total_due) <= 0 ? "পরিশোধিত" : "বকেয়া",
    items: parseItems(r.items),
  }));
  return {
    months,
    dueMonths: months.filter((m) => m.due > 0),
    totalAmount: round(months.reduce((s, m) => s + m.amount, 0)),
    totalReceived: round(months.reduce((s, m) => s + m.received, 0)),
    totalDiscount: round(months.reduce((s, m) => s + m.discount, 0)),
    totalDue: round(months.reduce((s, m) => s + m.due, 0)),
  };
}

// সব ছাত্রের মোট বকেয়া/পরিশোধিত (তালিকায় দ্রুত দেখানোর জন্য) — { [student_id]: {due, received} }
function duesByStudent() {
  const db = getDb();
  const rows = db.all("SELECT student_id, SUM(total_due) AS due, SUM(total_received) AS received FROM fee_receipts WHERE student_id IS NOT NULL GROUP BY student_id");
  const map = {};
  rows.forEach((r) => { map[r.student_id] = { due: round(r.due), received: round(r.received) }; });
  return map;
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

// মাস-কেন্দ্রিক আদায় — ঐ (ছাত্র, মাস)-এর রেকর্ড থাকলে তাতে যোগ (accumulate),
// না থাকলে নতুন তৈরি। প্রতি ফি-র নির্ধারিত পরিমাণ (amount = ভর্তির সময়ের বেতন) authoritative;
// বকেয়া = max(0, নির্ধারিত − ক্রমযোজিত পরিশোধিত − ছাড়)।
function collect(data = {}) {
  const db = getDb();
  const incoming = data.items || [];
  const existing = data.student_id ? findByStudentMonth(db, data.student_id, data.month) : null;

  let items;
  if (existing) {
    const map = {};
    for (const it of parseItems(existing.items)) map[it.fee] = { ...it };
    for (const it of incoming) {
      const cur = map[it.fee];
      const target = Number(it.amount) || (cur ? Number(cur.amount) : 0);
      const addRecv = Number(it.received) || 0;
      const addDisc = Number(it.discount) || 0;
      if (cur) {
        cur.amount = target;                                   // নির্ধারিত ফি authoritative
        cur.fund = it.fund || cur.fund;
        cur.received = round((Number(cur.received) || 0) + addRecv);
        cur.discount = round((Number(cur.discount) || 0) + addDisc);
      } else {
        map[it.fee] = { fee: it.fee, fund: it.fund, amount: target, received: addRecv, discount: addDisc };
      }
      const m = map[it.fee];
      m.due = Math.max(0, round(m.amount - m.received - m.discount));
    }
    items = Object.values(map);
    const t = totalsOf(items);
    db.run(
      `UPDATE fee_receipts SET items = ?, total_amount = ?, total_received = ?, total_discount = ?, total_due = ?, collector = ?, note = ?, r_date = ? WHERE id = ?`,
      [JSON.stringify(items), round(t.amount), round(t.received), round(t.discount), round(t.due),
        data.collector || existing.collector, data.note != null ? data.note : existing.note,
        data.r_date || new Date().toISOString().slice(0, 10), existing.id]
    );
    return getById(existing.id);
  }

  // নতুন মাস
  items = incoming.map((it) => {
    const amount = Number(it.amount) || 0, received = Number(it.received) || 0, discount = Number(it.discount) || 0;
    return { fee: it.fee, fund: it.fund, amount, received, discount, due: Math.max(0, round(amount - received - discount)) };
  });
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

module.exports = { list, totals, getById, duesForStudent, studentSummary, duesByStudent, create, collect, remove };
