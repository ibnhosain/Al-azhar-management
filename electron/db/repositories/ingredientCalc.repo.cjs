// ────────────────────────────────────────────────────────────────
//  ingredientCalc.repo.cjs — স্মার্ট উপকরণ ক্যালকুলেটর (READ-only, dynamic)।
//  সূত্র: রেসিপি (জনপ্রতি পরিমাণ) × ঐ বেলার মিল সংখ্যা (ছাত্র + গেস্ট)।
//  কোনো ফলাফল সংরক্ষণ হয় না — প্রতিবার গণনা করে ফেরত।
//  perPerson() — জনপ্রতি চাহিদা (মিল অনুমোদনে প্রকৃত সংখ্যা × এই মান)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const mealListRepo = require("./mealList.repo.cjs");
const menuRepo = require("./menu.repo.cjs");

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

// ঐ বেলার মেনুর সব পদের উপকরণ জনপ্রতি পরিমাণে একত্র করা।
function perPerson(date, mealType) {
  const db = getDb();
  const menu = menuRepo.getByDateMeal(date, mealType);
  if (!menu || !menu.items.length) return { menu, items: [] };
  const map = {};
  for (const mi of menu.items) {
    const rows = db.all(
      `SELECT ri.ingredient_id, ri.qty_per_person, ri.unit, ri.optional,
              i.name_bn, i.unit AS ing_unit, i.avg_cost
         FROM recipe_items ri LEFT JOIN ingredients i ON i.id = ri.ingredient_id
        WHERE ri.dish_id = ?`,
      [mi.dish_id]
    );
    for (const it of rows) {
      if (!it.ingredient_id) continue;
      const k = it.ingredient_id;
      if (!map[k]) map[k] = { ingredient_id: k, ingredient: it.name_bn || "—", unit: it.unit || it.ing_unit || "", qty_per_person: 0, avg_cost: Number(it.avg_cost) || 0, optional: true };
      map[k].qty_per_person += Number(it.qty_per_person) || 0;
      if (it.optional !== "1") map[k].optional = false;
    }
  }
  return { menu, items: Object.values(map) };
}

// ঐ বেলার মোট মিল সংখ্যা = ছাত্র (মিল লিস্ট) + গেস্ট।
function servingsFor(date, mealType) {
  const ml = mealListRepo.generate(date, mealType);
  return (ml.summary.total || 0) + (ml.summary.guest || 0);
}

function generate(date, mealType) {
  const { menu, items } = perPerson(date, mealType);
  const servings = servingsFor(date, mealType);
  if (!menu || !items.length) {
    return { servings, hasMenu: !!menu, menu: menu ? { title: menu.title, meal_type: menu.meal_type } : null, rows: [], totalCost: 0 };
  }
  let totalCost = 0;
  const rows = items.map((a) => {
    const required = round(a.qty_per_person * servings);
    const cost = round(required * a.avg_cost);
    totalCost += cost;
    return { ingredient_id: a.ingredient_id, ingredient: a.ingredient, required, unit: a.unit, cost, remarks: a.optional ? "ঐচ্ছিক" : "" };
  }).sort((x, y) => y.cost - x.cost);
  return { servings, hasMenu: true, menu: { title: menu.title, meal_type: menu.meal_type, dish_names: menu.dish_names }, rows, totalCost: round(totalCost) };
}

module.exports = { generate, perPerson, servingsFor };
