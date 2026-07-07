// ────────────────────────────────────────────────────────────────
//  store.repo.cjs — কিচেন স্টোর (লেজার ভিত্তিক)।
//  বর্তমান স্টক কোথাও সংরক্ষণ হয় না — store_transactions থেকে গণনা:
//     in → +qty, out → −qty, adjust → +qty (signed)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000;
const SIGNED = "SUM(CASE t.type WHEN 'in' THEN t.qty WHEN 'out' THEN -t.qty ELSE t.qty END)";

function balances() {
  const db = getDb();
  const rows = db.all(
    `SELECT i.id AS ingredient_id, i.name_bn, i.category, i.unit, i.min_stock, i.avg_cost,
            COALESCE(${SIGNED}, 0) AS current_qty
       FROM ingredients i
       LEFT JOIN store_transactions t ON t.ingredient_id = i.id
      GROUP BY i.id ORDER BY i.name_bn ASC`
  );
  return rows.map((r) => ({
    ...r,
    current_qty: round(r.current_qty),
    stock_value: round(r.current_qty * (r.avg_cost || 0)),
    low: r.current_qty < (r.min_stock || 0),
  }));
}

function currentQty(db, ingredientId) {
  const r = db.get(`SELECT COALESCE(${SIGNED}, 0) AS q FROM store_transactions t WHERE t.ingredient_id = ?`, [ingredientId]);
  return Number(r ? r.q : 0) || 0;
}

function lowStock() {
  return balances().filter((b) => b.low);
}

function summary() {
  const b = balances();
  return {
    itemCount: b.length,
    lowCount: b.filter((x) => x.low).length,
    totalValue: round(b.reduce((s, x) => s + x.stock_value, 0)),
    txnCount: getDb().get("SELECT COUNT(*) AS c FROM store_transactions").c,
  };
}

function listTransactions(filter = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filter.ingredientId) { where.push("t.ingredient_id = ?"); params.push(filter.ingredientId); }
  if (filter.type) { where.push("t.type = ?"); params.push(filter.type); }
  if (filter.source) { where.push("t.source = ?"); params.push(filter.source); }
  if (filter.from) { where.push("t.t_date >= ?"); params.push(filter.from); }
  if (filter.to) { where.push("t.t_date <= ?"); params.push(filter.to); }
  const sql = `SELECT t.*, i.name_bn AS ingredient FROM store_transactions t
               LEFT JOIN ingredients i ON i.id = t.ingredient_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY t.t_date DESC, t.id DESC`;
  return db.all(sql, params);
}

// একটি লেজার এন্ট্রি (manual in/out/adjust/waste)।
function addTransaction(data = {}) {
  const db = getDb();
  const res = db.run(
    "INSERT INTO store_transactions (ingredient_id, t_date, type, qty, unit, unit_cost, source, ref_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [data.ingredient_id, data.t_date, data.type || "in", Number(data.qty) || 0, data.unit || null, Number(data.unit_cost) || 0, data.source || "manual", data.ref_id || null, data.note || null]
  );
  return db.get("SELECT * FROM store_transactions WHERE id = ?", [Number(res.lastInsertRowid)]);
}

function removeTransaction(id) {
  getDb().run("DELETE FROM store_transactions WHERE id = ?", [id]);
  return { id };
}

module.exports = { balances, currentQty, lowStock, summary, listTransactions, addTransaction, removeTransaction, round };
