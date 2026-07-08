// ────────────────────────────────────────────────────────────────
//  mealApproval.repo.cjs — মিল অনুমোদন (তারিখ+বেলা প্রতি ১টি)।
//  অনুমোদনে প্রকৃত সংখ্যা (হাজির + গেস্ট) × রেসিপি জনপ্রতি চাহিদা →
//  store_transactions-এ 'out' (consumption, ref_id=approval id) পোস্ট হয়।
//  প্রত্যাহারে ঐ consumption এন্ট্রি মুছে যায় (স্টক ফেরত)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const attendance = require("./mealAttendance.repo.cjs");
const guest = require("./guestMeal.repo.cjs");
const calc = require("./ingredientCalc.repo.cjs");

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

function get(date, mealType) {
  return getDb().get("SELECT * FROM meal_approvals WHERE m_date = ? AND meal_type = ? ORDER BY id DESC LIMIT 1", [date, mealType]) || null;
}

function status(date, mealType) {
  const a = get(date, mealType);
  const att = attendance.summary(date, mealType);
  const g = guest.sumForMeal(date, mealType);
  const total = att.present + g;
  const pp = calc.perPerson(date, mealType);
  const consumption = pp.items
    .map((it) => ({ ingredient: it.ingredient, unit: it.unit, qty: round(it.qty_per_person * total) }))
    .filter((r) => r.qty > 0)
    .sort((x, y) => y.qty - x.qty);
  return {
    approval: a, status: a ? a.status : "draft",
    present: att.present, absent: att.absent, leave: att.leave, guest: g, total,
    hasMenu: !!(pp.menu && pp.items.length), menuTitle: pp.menu ? pp.menu.title : null, consumption,
  };
}

function approve(date, mealType, meta = {}) {
  const db = getDb();
  const att = attendance.summary(date, mealType);
  const g = guest.sumForMeal(date, mealType);
  const present = att.present;
  const total = present + g;
  db.exec("BEGIN");
  try {
    const existing = db.get("SELECT id FROM meal_approvals WHERE m_date = ? AND meal_type = ?", [date, mealType]);
    let id;
    if (existing) {
      id = existing.id;
      db.run("UPDATE meal_approvals SET status='approved', present_count=?, guest_count=?, total_count=?, approved_by=?, approved_at=datetime('now','localtime'), note=? WHERE id=?",
        [present, g, total, meta.approved_by || null, meta.note || null, id]);
    } else {
      const res = db.run("INSERT INTO meal_approvals (m_date, meal_type, status, present_count, guest_count, total_count, approved_by, approved_at, note) VALUES (?, ?, 'approved', ?, ?, ?, ?, datetime('now','localtime'), ?)",
        [date, mealType, present, g, total, meta.approved_by || null, meta.note || null]);
      id = Number(res.lastInsertRowid);
    }
    // পুনঃঅনুমোদন নিরাপদ: আগের consumption মুছে নতুন করে পোস্ট
    db.run("DELETE FROM store_transactions WHERE source='consumption' AND ref_id=?", [id]);
    const { items } = calc.perPerson(date, mealType);
    for (const it of items) {
      const qty = round(it.qty_per_person * total);
      if (qty <= 0) continue;
      db.run("INSERT INTO store_transactions (ingredient_id, t_date, type, qty, unit, unit_cost, source, ref_id, note) VALUES (?, ?, 'out', ?, ?, 0, 'consumption', ?, ?)",
        [it.ingredient_id, date, qty, it.unit || null, id, "মিল অনুমোদন (" + mealType + ")"]);
    }
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
  return status(date, mealType);
}

function revert(date, mealType) {
  const db = getDb();
  const row = db.get("SELECT id FROM meal_approvals WHERE m_date = ? AND meal_type = ?", [date, mealType]);
  if (!row) return status(date, mealType);
  db.exec("BEGIN");
  try {
    db.run("DELETE FROM store_transactions WHERE source='consumption' AND ref_id=?", [row.id]);
    db.run("UPDATE meal_approvals SET status='draft', approved_at=NULL WHERE id=?", [row.id]);
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
  return status(date, mealType);
}

module.exports = { get, status, approve, revert };
