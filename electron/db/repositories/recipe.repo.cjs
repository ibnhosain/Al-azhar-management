// ────────────────────────────────────────────────────────────────
//  recipe.repo.cjs — পদের রেসিপি (dishes ১:১) + উপকরণ আইটেম।
//  recipes = নোট হেডার (dish_id UNIQUE); recipe_items = উপকরণ তালিকা।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");

function getByDish(dishId) {
  const db = getDb();
  const head = db.get("SELECT * FROM recipes WHERE dish_id = ?", [dishId]) || {};
  const items = db.all(
    `SELECT ri.id, ri.ingredient_id, ri.qty_per_person, ri.unit, ri.optional, ri.note,
            i.name_bn AS ingredient_name, i.unit AS ingredient_unit, i.avg_cost
       FROM recipe_items ri
       LEFT JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.dish_id = ? ORDER BY ri.id ASC`,
    [dishId]
  );
  return {
    dish_id: Number(dishId),
    cooking_notes: head.cooking_notes || "",
    prep_notes: head.prep_notes || "",
    special_instruction: head.special_instruction || "",
    items,
  };
}

// পুরো রেসিপি সংরক্ষণ (নোট + সব আইটেম প্রতিস্থাপন) — এক transaction-এ।
function saveForDish(dishId, data = {}) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const head = db.get("SELECT id FROM recipes WHERE dish_id = ?", [dishId]);
    if (head) {
      db.run("UPDATE recipes SET cooking_notes=?, prep_notes=?, special_instruction=? WHERE dish_id=?",
        [data.cooking_notes || null, data.prep_notes || null, data.special_instruction || null, dishId]);
    } else {
      db.run("INSERT INTO recipes (dish_id, cooking_notes, prep_notes, special_instruction) VALUES (?, ?, ?, ?)",
        [dishId, data.cooking_notes || null, data.prep_notes || null, data.special_instruction || null]);
    }
    db.run("DELETE FROM recipe_items WHERE dish_id = ?", [dishId]);
    for (const it of data.items || []) {
      if (!it.ingredient_id) continue;
      db.run(
        "INSERT INTO recipe_items (dish_id, ingredient_id, qty_per_person, unit, optional, note) VALUES (?, ?, ?, ?, ?, ?)",
        [dishId, it.ingredient_id, Number(it.qty_per_person) || 0, it.unit || null, it.optional ? "1" : "0", it.note || null]
      );
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return getByDish(dishId);
}

module.exports = { getByDish, saveForDish };
