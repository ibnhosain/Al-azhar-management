// ────────────────────────────────────────────────────────────────
//  boardingBazar.repo.cjs — বোর্ডিং বাজার (ক্রয়) — header + একাধিক item।
//  header ও items সবসময় একসাথে transaction-এ সংরক্ষিত হয় (data-integrity)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

function itemsOf(bazarId) {
  return getDb().all(
    "SELECT id, item_name, unit, quantity, unit_price, subtotal FROM boarding_bazar_items WHERE bazar_id = ? ORDER BY id ASC",
    [bazarId]
  );
}

function decorate(row) {
  const items = itemsOf(row.id);
  return {
    ...row,
    items,
    item_count: items.length,
    summary: items.map((i) => i.item_name).filter(Boolean).join(", "),
  };
}

function list() {
  // নতুন ক্রয় উপরে (id DESC)
  return getDb().all("SELECT * FROM boarding_bazar ORDER BY id DESC").map(decorate);
}

function getById(id) {
  const row = getDb().get("SELECT * FROM boarding_bazar WHERE id = ?", [id]);
  return row ? { ...row, items: itemsOf(id) } : null;
}

function computeTotal(items) {
  return (items || []).reduce(
    (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );
}

function insertItems(db, bazarId, items) {
  for (const it of items || []) {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    db.run(
      "INSERT INTO boarding_bazar_items (bazar_id, item_name, unit, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
      [bazarId, it.item_name ?? null, it.unit ?? null, qty, price, qty * price]
    );
  }
}

function create({ header = {}, items = [] }) {
  const db = getDb();
  const total = computeTotal(items);
  db.exec("BEGIN");
  try {
    const res = db.run(
      "INSERT INTO boarding_bazar (purchase_no, date, fund, purchased_by, remarks, total) VALUES (?, ?, ?, ?, ?, ?)",
      [header.purchase_no ?? null, header.date ?? null, header.fund ?? null, header.purchased_by ?? null, header.remarks ?? null, total]
    );
    const id = Number(res.lastInsertRowid);
    insertItems(db, id, items);
    db.exec("COMMIT");
    return getById(id);
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function update(id, { header = {}, items = [] }) {
  const db = getDb();
  const total = computeTotal(items);
  db.exec("BEGIN");
  try {
    db.run(
      "UPDATE boarding_bazar SET purchase_no = ?, date = ?, fund = ?, purchased_by = ?, remarks = ?, total = ? WHERE id = ?",
      [header.purchase_no ?? null, header.date ?? null, header.fund ?? null, header.purchased_by ?? null, header.remarks ?? null, total, id]
    );
    db.run("DELETE FROM boarding_bazar_items WHERE bazar_id = ?", [id]);
    insertItems(db, id, items);
    db.exec("COMMIT");
    return getById(id);
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function remove(id) {
  getDb().run("DELETE FROM boarding_bazar WHERE id = ?", [id]); // items ON DELETE CASCADE
  return { id };
}

module.exports = { list, getById, create, update, remove };
