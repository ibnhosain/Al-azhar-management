// ────────────────────────────────────────────────────────────────
//  purchase.repo.cjs — কিচেন ক্রয় (ingredient-linked)।
//  সেভ করলে প্রতি আইটেম স্টোরে 'in' লেজার এন্ট্রি তৈরি করে +
//  উপকরণের avg_cost weighted-average আপডেট করে (খরচ নির্ভুল রাখতে)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const store = require("./store.repo.cjs");

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

function itemsOf(db, pid) {
  return db.all(
    `SELECT pi.*, i.name_bn AS ingredient FROM purchase_items pi
       LEFT JOIN ingredients i ON i.id = pi.ingredient_id WHERE pi.purchase_id = ? ORDER BY pi.id ASC`,
    [pid]
  );
}

function getById(id) {
  const db = getDb();
  const p = db.get("SELECT p.*, s.name AS supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?", [id]);
  if (!p) return null;
  return { ...p, items: itemsOf(db, id) };
}

function list(filter = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filter.from) { where.push("p.p_date >= ?"); params.push(filter.from); }
  if (filter.to) { where.push("p.p_date <= ?"); params.push(filter.to); }
  const rows = db.all(
    `SELECT p.*, s.name AS supplier_name,
            (SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id = p.id) AS item_count
       FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY p.p_date DESC, p.id DESC`,
    params
  );
  return rows;
}

// avg_cost weighted update: new = (priorQty*oldAvg + recvQty*unitCost)/(priorQty+recvQty)
function updateAvgCost(db, ingredientId, recvQty, unitCost) {
  if (!(unitCost > 0) || !(recvQty > 0)) return;
  const ing = db.get("SELECT avg_cost FROM ingredients WHERE id = ?", [ingredientId]);
  if (!ing) return;
  const prior = Math.max(store.currentQty(db, ingredientId), 0);
  const oldAvg = Number(ing.avg_cost) || 0;
  const newAvg = (prior * oldAvg + recvQty * unitCost) / (prior + recvQty);
  db.run("UPDATE ingredients SET avg_cost = ? WHERE id = ?", [round(newAvg), ingredientId]);
}

function create(payload = {}) {
  const db = getDb();
  const header = payload.header || {};
  const items = payload.items || [];
  db.exec("BEGIN");
  try {
    const res = db.run("INSERT INTO purchases (p_date, supplier_id, total, note) VALUES (?, ?, 0, ?)",
      [header.p_date, header.supplier_id || null, header.note || null]);
    const pid = Number(res.lastInsertRowid);
    let total = 0;
    for (const it of items) {
      if (!it.ingredient_id) continue;
      const qty = Number(it.qty) || 0;
      const unitCost = Number(it.unit_cost) || 0;
      const subtotal = round(qty * unitCost);
      total += subtotal;
      db.run("INSERT INTO purchase_items (purchase_id, ingredient_id, qty, unit, unit_cost, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
        [pid, it.ingredient_id, qty, it.unit || null, unitCost, subtotal]);
      // avg_cost আপডেট আগে (prior qty ঠিক রাখতে), তারপর 'in' লেজার
      updateAvgCost(db, it.ingredient_id, qty, unitCost);
      db.run("INSERT INTO store_transactions (ingredient_id, t_date, type, qty, unit, unit_cost, source, ref_id, note) VALUES (?, ?, 'in', ?, ?, ?, 'purchase', ?, ?)",
        [it.ingredient_id, header.p_date, qty, it.unit || null, unitCost, pid, "ক্রয় #" + pid]);
    }
    db.run("UPDATE purchases SET total = ? WHERE id = ?", [round(total), pid]);
    db.exec("COMMIT");
    return getById(pid);
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function remove(id) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.run("DELETE FROM store_transactions WHERE source = 'purchase' AND ref_id = ?", [id]);
    db.run("DELETE FROM purchases WHERE id = ?", [id]); // purchase_items CASCADE
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { id };
}

module.exports = { list, getById, create, remove };
