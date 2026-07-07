// ────────────────────────────────────────────────────────────────
//  menu.repo.cjs — দৈনিক/টেমপ্লেট মেনু + পদ (menu_items)।
//  Daily/Weekly/Monthly/Ramadan/Eid/Special সব এই এক টেবিলে:
//   - dated মেনু (is_template='0', m_date সেট) — নির্দিষ্ট দিনের বেলা
//   - template মেনু (is_template='1', m_date NULL) — পুনঃব্যবহারযোগ্য
//  Weekly/Monthly = UI-তে dated মেনুর ক্যালেন্ডার ভিউ (আলাদা storage নয়)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

function itemsOf(db, menuId) {
  return db.all(
    `SELECT mi.id, mi.dish_id, mi.note, d.name AS dish_name, d.category AS dish_category
       FROM menu_items mi LEFT JOIN dishes d ON d.id = mi.dish_id
      WHERE mi.menu_id = ? ORDER BY mi.id ASC`,
    [menuId]
  );
}

function decorate(db, m) {
  const items = itemsOf(db, m.id);
  return { ...m, items, dish_names: items.map((i) => i.dish_name).filter(Boolean).join(", "), dish_count: items.length };
}

function getById(id) {
  const db = getDb();
  const m = db.get("SELECT * FROM menus WHERE id = ?", [id]);
  return m ? decorate(db, m) : null;
}

function list(filter = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (filter.templates) where.push("is_template = '1'");
  else where.push("is_template = '0'");
  if (filter.from) { where.push("m_date >= ?"); params.push(filter.from); }
  if (filter.to) { where.push("m_date <= ?"); params.push(filter.to); }
  if (filter.meal_type) { where.push("meal_type = ?"); params.push(filter.meal_type); }
  if (filter.menu_type) { where.push("menu_type = ?"); params.push(filter.menu_type); }
  const sql = `SELECT * FROM menus WHERE ${where.join(" AND ")} ORDER BY m_date DESC, id DESC`;
  return db.all(sql, params).map((m) => decorate(db, m));
}

function templates() {
  return list({ templates: true });
}

function getByDateMeal(date, mealType) {
  const db = getDb();
  const m = db.get("SELECT * FROM menus WHERE is_template='0' AND m_date = ? AND meal_type = ? ORDER BY id DESC LIMIT 1", [date, mealType]);
  return m ? decorate(db, m) : null;
}

function setItems(db, menuId, items) {
  db.run("DELETE FROM menu_items WHERE menu_id = ?", [menuId]);
  for (const it of items || []) {
    const dishId = typeof it === "object" ? it.dish_id : it;
    if (!dishId) continue;
    db.run("INSERT INTO menu_items (menu_id, dish_id, note) VALUES (?, ?, ?)", [menuId, dishId, (it && it.note) || null]);
  }
}

// হেডার + পদ একসাথে সংরক্ষণ (নতুন বা আপডেট) — transaction।
function save(data = {}) {
  const db = getDb();
  const isTpl = data.is_template ? "1" : "0";
  db.exec("BEGIN");
  try {
    let id = data.id;
    const fields = [data.m_date || null, data.meal_type || "lunch", data.menu_type || "normal", data.title || null, isTpl, data.note || null];
    if (id) {
      db.run("UPDATE menus SET m_date=?, meal_type=?, menu_type=?, title=?, is_template=?, note=? WHERE id=?", [...fields, id]);
    } else {
      const res = db.run("INSERT INTO menus (m_date, meal_type, menu_type, title, is_template, note) VALUES (?, ?, ?, ?, ?, ?)", fields);
      id = Number(res.lastInsertRowid);
    }
    if (data.items) setItems(db, id, data.items);
    db.exec("COMMIT");
    return getById(id);
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// আগের মেনু/টেমপ্লেট থেকে নতুন dated মেনুতে পদ কপি।
function copy(payload = {}) {
  const src = getById(payload.fromId);
  if (!src) throw new Error("উৎস মেনু পাওয়া যায়নি");
  return save({
    m_date: payload.m_date || null,
    meal_type: payload.meal_type || src.meal_type,
    menu_type: payload.menu_type || (src.is_template === "1" ? "normal" : src.menu_type),
    title: payload.title || src.title,
    is_template: payload.is_template ? 1 : 0,
    note: src.note,
    items: src.items.map((i) => ({ dish_id: i.dish_id, note: i.note })),
  });
}

function remove(id) {
  getDb().run("DELETE FROM menus WHERE id = ?", [id]);
  return { id };
}

module.exports = { list, templates, getById, getByDateMeal, save, copy, remove };
