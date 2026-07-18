// ────────────────────────────────────────────────────────────────
//  salaryLedger.repo.cjs — শিক্ষক বেতন লেজার (HR/Payroll)।
//  ব্যাংক-স্টেটমেন্ট নীতি: প্রতিটি লেনদেন স্থায়ী ও অপরিবর্তনীয় (append-only)।
//  কখনো overwrite/delete হয় না — ভুল সংশোধনে বিপরীত এন্ট্রি (reverse) যোগ হয়।
//
//  চিহ্ন নিয়ম (running balance = শিক্ষককে প্রদেয় নিট):
//    earning  (salary/allowance/bonus)  → + (প্রাপ্য বাড়ে)
//    payment  (payment/advance)         → − (পরিশোধ)
//    deduction(deduction/loan)          → − (কর্তন)
//    balance > 0 → বকেয়া (প্রদেয়); balance < 0 → অতিরিক্ত পরিশোধ/অগ্রিম।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const nz = (n) => Number(n) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const signOf = (t) => (t.kind === "earning" ? nz(t.amount) : -nz(t.amount));

const EARNING_CATS = { salary: 1, allowance: 1, bonus: 1 };
const PAYMENT_CATS = { payment: 1, advance: 1 };
const DEDUCTION_CATS = { deduction: 1, loan: 1 };
function kindOf(category) {
  if (EARNING_CATS[category]) return "earning";
  if (PAYMENT_CATS[category]) return "payment";
  if (DEDUCTION_CATS[category]) return "deduction";
  return "earning";
}

function insert(db, d) {
  const kind = d.kind || kindOf(d.category);
  const res = db.run(
    `INSERT INTO salary_ledger (teacher_id, teacher_code, teacher_name, month, txn_date, kind, category, amount, method, reference, notes, collected_by, reversed_of)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.teacher_id || null, d.teacher_code || null, d.teacher_name || null, d.month || null,
      d.txn_date || today(), kind, d.category || "salary", round(Math.abs(nz(d.amount))),
      d.method || null, d.reference || null, d.notes || null, d.collected_by || null, d.reversed_of || null]
  );
  return getById(Number(res.lastInsertRowid));
}

function getById(id) {
  return getDb().get("SELECT * FROM salary_ledger WHERE id = ?", [id]);
}

// একটি একক লেনদেন যোগ (append-only)।
function add(data = {}) {
  if (nz(data.amount) <= 0) throw new Error("পরিমাণ ধনাত্মক হতে হবে");
  return insert(getDb(), data);
}

// ঐ (শিক্ষক, মাস)-এ নির্দিষ্ট category-র earning ইতিমধ্যে আছে কিনা।
function hasCategory(db, teacherId, month, category) {
  const r = db.get("SELECT COUNT(*) AS c FROM salary_ledger WHERE teacher_id = ? AND month = ? AND category = ? AND reversed_of IS NULL", [teacherId, month, category]);
  return (r ? r.c : 0) > 0;
}

// এক মাসের বেতন accrue (idempotent) — একই category দুইবার বসে না (ডুপ্লিকেট নয়)।
// salary বাধ্যতামূলক; allowance/bonus/deduction ঐচ্ছিক।
function accrue(db, d) {
  const created = [];
  const base = { teacher_id: d.teacher_id, teacher_code: d.teacher_code, teacher_name: d.teacher_name, month: d.month, txn_date: d.txn_date || today(), collected_by: d.collected_by };
  const put = (category, amount) => {
    if (nz(amount) <= 0) return;
    if (hasCategory(db, d.teacher_id, d.month, category)) return; // ইতিমধ্যে আছে → ডুপ্লিকেট নয়
    created.push(insert(db, { ...base, category, amount }));
  };
  put("salary", d.salary);
  put("allowance", d.allowance);
  put("bonus", d.bonus);
  put("deduction", d.deduction);
  return created;
}

// UI-মুখী: এক মাসের বেতন নিশ্চিত (accrue, একবার) + একটি পরিশোধ লেনদেন (append)।
//  প্রতিটি পরিশোধ আলাদা স্থায়ী সারি — আগের কোনো সারি overwrite হয় না।
function collect(data = {}) {
  const db = getDb();
  accrue(db, data);
  let payment = null;
  if (nz(data.pay_amount) > 0) {
    payment = insert(db, {
      teacher_id: data.teacher_id, teacher_code: data.teacher_code, teacher_name: data.teacher_name,
      month: data.month, txn_date: data.txn_date || today(),
      category: data.pay_category || "payment", amount: data.pay_amount,
      method: data.method, reference: data.reference, notes: data.notes, collected_by: data.collected_by,
    });
  }
  return { payment, statement: statement(data.teacher_id) };
}

// ভুল সংশোধন — মূল লেনদেন অপরিবর্তিত রেখে বিপরীত (reversal) এন্ট্রি যোগ (net শূন্য)।
function reverse(id, meta = {}) {
  const db = getDb();
  const orig = getById(id);
  if (!orig) throw new Error("লেনদেন পাওয়া যায়নি");
  const oppositeKind = orig.kind === "earning" ? "payment" : "earning";
  return insert(db, {
    teacher_id: orig.teacher_id, teacher_code: orig.teacher_code, teacher_name: orig.teacher_name,
    month: orig.month, txn_date: meta.txn_date || today(), kind: oppositeKind, category: "adjustment",
    amount: orig.amount, notes: meta.notes || `বাতিল/সংশোধন — লেনদেন #${id}`, collected_by: meta.collected_by, reversed_of: id,
  });
}

function listByTeacher(teacherId) {
  const rows = getDb().all(
    "SELECT * FROM salary_ledger WHERE teacher_id = ? ORDER BY date(txn_date) ASC, id ASC", [teacherId]
  );
  let bal = 0;
  return rows.map((t) => { bal = round(bal + signOf(t)); return { ...t, signed: round(signOf(t)), balance: bal }; });
}

// এক শিক্ষকের পূর্ণ স্টেটমেন্ট: মোট, মাস-ভিত্তিক রোলআপ, ও running-balance লেনদেন।
function statement(teacherId) {
  const txns = listByTeacher(teacherId);
  const monthMap = {};
  let earned = 0, paid = 0, deducted = 0;
  for (const t of txns) {
    const a = nz(t.amount);
    if (t.kind === "earning") earned = round(earned + a);
    else if (t.kind === "payment") paid = round(paid + a);
    else if (t.kind === "deduction") deducted = round(deducted + a);
    const key = t.month || "—";
    const m = monthMap[key] || (monthMap[key] = { month: key, earned: 0, paid: 0, deducted: 0 });
    if (t.kind === "earning") m.earned = round(m.earned + a);
    else if (t.kind === "payment") m.paid = round(m.paid + a);
    else if (t.kind === "deduction") m.deducted = round(m.deducted + a);
  }
  const months = Object.values(monthMap).sort((x, y) => String(x.month).localeCompare(String(y.month))).map((m) => {
    const due = round(m.earned - m.paid - m.deducted);
    const settled = round(m.paid + m.deducted);
    let status;
    if (m.earned <= 0) status = "—";
    else if (due <= 0) status = "পরিশোধিত";
    else if (settled > 0) status = "আংশিক";
    else status = "বকেয়া";
    return { ...m, due, status };
  });
  const balance = round(earned - paid - deducted);
  return {
    teacherId,
    totalEarned: earned, totalPaid: paid, totalDeducted: deducted,
    balance,                                   // > 0 বকেয়া, < 0 অতিরিক্ত পরিশোধ
    due: Math.max(0, balance),
    overpaid: Math.max(0, -balance),
    months, dueMonths: months.filter((m) => m.due > 0),
    transactions: txns,
  };
}

// সব শিক্ষকের বকেয়া ম্যাপ — { [teacher_id]: {earned, paid, deducted, due} }
function duesByTeacher() {
  const rows = getDb().all(
    `SELECT teacher_id,
       SUM(CASE WHEN kind='earning' THEN amount ELSE 0 END)   AS earned,
       SUM(CASE WHEN kind='payment' THEN amount ELSE 0 END)   AS paid,
       SUM(CASE WHEN kind='deduction' THEN amount ELSE 0 END) AS deducted
     FROM salary_ledger WHERE teacher_id IS NOT NULL GROUP BY teacher_id`
  );
  const map = {};
  rows.forEach((r) => {
    const due = round(nz(r.earned) - nz(r.paid) - nz(r.deducted));
    map[r.teacher_id] = { earned: round(r.earned), paid: round(r.paid), deducted: round(r.deducted), due: Math.max(0, due), balance: due };
  });
  return map;
}

// পে-রোল ড্যাশবোর্ড সমষ্টি।
function dashboard() {
  const db = getDb();
  const teachers = db.all("SELECT id, name, code, salary, status FROM teachers");
  const agg = db.get(
    `SELECT
       SUM(CASE WHEN kind='earning' THEN amount ELSE 0 END)   AS earned,
       SUM(CASE WHEN kind='payment' THEN amount ELSE 0 END)   AS paid,
       SUM(CASE WHEN kind='deduction' THEN amount ELSE 0 END) AS deducted
     FROM salary_ledger`
  ) || {};
  const dues = duesByTeacher();
  const activeSalary = teachers.filter((t) => t.status === "সক্রিয়")
    .reduce((s, t) => s + nz(String(t.salary || "").replace(/[^\d.]/g, "")), 0);
  const dueTeachers = teachers
    .map((t) => ({ id: t.id, name: t.name, code: t.code, due: (dues[t.id] && dues[t.id].due) || 0 }))
    .filter((t) => t.due > 0).sort((a, b) => b.due - a.due);
  const partialCount = teachers.filter((t) => { const d = dues[t.id]; return d && d.paid > 0 && d.due > 0; }).length;
  const recent = db.all(
    "SELECT * FROM salary_ledger WHERE kind='payment' ORDER BY date(txn_date) DESC, id DESC LIMIT 8"
  );
  return {
    teacherCount: teachers.length,
    totalMonthlySalary: round(activeSalary),
    totalEarned: round(agg.earned), totalPaid: round(agg.paid), totalDeducted: round(agg.deducted),
    totalDue: round(dueTeachers.reduce((s, t) => s + t.due, 0)),
    dueTeacherCount: dueTeachers.length, partialCount,
    dueTeachers, recentPayments: recent,
  };
}

// ── রিপোর্ট (৭ ধরনের) — সব salary_ledger থেকে derive ──
function statusOf(earned, paid, deducted) {
  const due = round(earned - paid - deducted);
  if (earned <= 0) return "—";
  if (due <= 0) return "পরিশোধিত";
  return (paid + deducted) > 0 ? "আংশিক" : "বকেয়া";
}

// ১. শিক্ষক বেতন রিপোর্ট — প্রতি শিক্ষকের নির্ধারিত/প্রাপ্য/পরিশোধ/বকেয়া
function salaryReport() {
  const db = getDb();
  const list = db.all("SELECT id, code, name, salary, status FROM teachers ORDER BY name");
  const dues = duesByTeacher();
  return list.map((t) => {
    const d = dues[t.id] || { earned: 0, paid: 0, deducted: 0, due: 0 };
    return { teacher_id: t.id, code: t.code, name: t.name, emp_status: t.status,
      monthly_salary: round(nz(String(t.salary || "").replace(/[^\d.]/g, ""))),
      earned: d.earned, paid: d.paid, deducted: d.deducted, due: d.due, status: statusOf(d.earned, d.paid, d.deducted) };
  });
}

// ২. মাসিক রিপোর্ট — নির্বাচিত মাসে প্রতি শিক্ষকের হিসাব
function monthlyReport(month) {
  const rows = getDb().all(
    `SELECT teacher_id, teacher_name, teacher_code,
       SUM(CASE WHEN kind='earning' THEN amount ELSE 0 END)   AS earned,
       SUM(CASE WHEN kind='payment' THEN amount ELSE 0 END)   AS paid,
       SUM(CASE WHEN kind='deduction' THEN amount ELSE 0 END) AS deducted
     FROM salary_ledger WHERE month = ? GROUP BY teacher_id ORDER BY teacher_name`, [month]
  );
  return rows.map((r) => ({ teacher_id: r.teacher_id, name: r.teacher_name, code: r.teacher_code,
    earned: round(r.earned), paid: round(r.paid), deducted: round(r.deducted),
    due: round(r.earned - r.paid - r.deducted), status: statusOf(r.earned, r.paid, r.deducted) }));
}

// ৩. বার্ষিক রিপোর্ট — নির্বাচিত বছরের প্রতি মাসের যোগফল
function yearlyReport(year) {
  const rows = getDb().all(
    `SELECT month,
       SUM(CASE WHEN kind='earning' THEN amount ELSE 0 END)   AS earned,
       SUM(CASE WHEN kind='payment' THEN amount ELSE 0 END)   AS paid,
       SUM(CASE WHEN kind='deduction' THEN amount ELSE 0 END) AS deducted
     FROM salary_ledger WHERE month LIKE ? GROUP BY month ORDER BY month`, [year + "-%"]
  );
  return rows.map((r) => ({ month: r.month, earned: round(r.earned), paid: round(r.paid),
    deducted: round(r.deducted), due: round(r.earned - r.paid - r.deducted) }));
}

// ৫. পরিশোধ ইতিহাস — filter: from/to/teacherId/method
function paymentHistory(params = {}) {
  const where = ["kind = 'payment'"], p = [];
  if (params.teacherId) { where.push("teacher_id = ?"); p.push(params.teacherId); }
  if (params.method) { where.push("method = ?"); p.push(params.method); }
  if (params.from) { where.push("date(txn_date) >= date(?)"); p.push(params.from); }
  if (params.to) { where.push("date(txn_date) <= date(?)"); p.push(params.to); }
  return getDb().all(`SELECT * FROM salary_ledger WHERE ${where.join(" AND ")} ORDER BY date(txn_date) DESC, id DESC`, p);
}

// ৬/৭. category রিপোর্ট (advance / loan)
function categoryReport(category) {
  return getDb().all("SELECT * FROM salary_ledger WHERE category = ? ORDER BY date(txn_date) DESC, id DESC", [category]);
}

function report(type, params = {}) {
  switch (type) {
    case "salary": return salaryReport();
    case "monthly": return monthlyReport(params.month);
    case "yearly": return yearlyReport(params.year);
    case "outstanding": return salaryReport().filter((r) => r.due > 0);
    case "payments": return paymentHistory(params);
    case "advance": return categoryReport("advance");
    case "loan": return categoryReport("loan");
    default: return [];
  }
}

module.exports = { add, accrue, collect, reverse, listByTeacher, statement, duesByTeacher, dashboard, report, getById };
