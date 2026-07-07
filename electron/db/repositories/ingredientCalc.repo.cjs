// ────────────────────────────────────────────────────────────────
//  ingredientCalc.repo.cjs — স্মার্ট উপকরণ ক্যালকুলেটর (READ-only, dynamic)।
//  সূত্র: রেসিপি (জনপ্রতি পরিমাণ) × ঐ বেলার মিল সংখ্যা (Phase 1 dynamic)।
//  কোনো ফলাফল সংরক্ষণ হয় না — প্রতিবার গণনা করে ফেরত।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const mealListRepo = require("./mealList.repo.cjs");
const menuRepo = require("./menu.repo.cjs");

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

function aggregate(db, dishIds, servings) {
  const map = {};
  for (const dishId of dishIds) {
    if (!dishId) continue;
    const items = db.all(
      `SELECT ri.ingredient_id, ri.qty_per_person, ri.unit, ri.optional,
              i.name_bn, i.unit AS ing_unit, i.avg_cost
         FROM recipe_items ri LEFT JOIN ingredients i ON i.id = ri.ingredient_id
        WHERE ri.dish_id = ?`,
      [dishId]
    );
    for (const it of items) {
      if (!it.ingredient_id) continue;
      const key = it.ingredient_id;
      if (!map[key]) map[key] = { ingredient_id: key, ingredient: it.name_bn || "—", unit: it.unit || it.ing_unit || "", required: 0, avg_cost: Number(it.avg_cost) || 0, optional: true };
      map[key].required += (Number(it.qty_per_person) || 0) * servings;
      if (it.optional !== "1") map[key].optional = false;
    }
  }
  return Object.values(map);
}

function generate(date, mealType) {
  const db = getDb();
  const ml = mealListRepo.generate(date, mealType);
  const servings = ml.summary.total;
  const menu = menuRepo.getByDateMeal(date, mealType);
  if (!menu || !menu.items.length) {
    return { servings, hasMenu: !!menu, menu: menu ? { title: menu.title, meal_type: menu.meal_type } : null, rows: [], totalCost: 0 };
  }
  const agg = aggregate(db, menu.items.map((i) => i.dish_id), servings);
  let totalCost = 0;
  const rows = agg.map((a) => {
    const cost = a.required * a.avg_cost;
    totalCost += cost;
    return { ingredient_id: a.ingredient_id, ingredient: a.ingredient, required: round(a.required), unit: a.unit, cost: round(cost), remarks: a.optional ? "ঐচ্ছিক" : "" };
  }).sort((x, y) => y.cost - x.cost);
  return { servings, hasMenu: true, menu: { title: menu.title, meal_type: menu.meal_type, dish_names: menu.dish_names }, rows, totalCost: round(totalCost) };
}

module.exports = { generate };
