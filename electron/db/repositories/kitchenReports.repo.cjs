// ────────────────────────────────────────────────────────────────
//  kitchenReports.repo.cjs — রান্নাঘর রিপোর্ট (সব READ-only)।
//  Recipe / Menu / Ingredient Usage / Menu History।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const mealListRepo = require("./mealList.repo.cjs");
const menuRepo = require("./menu.repo.cjs");

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

// প্রতিটি পদের উপকরণ সংখ্যা + জনপ্রতি খরচ।
function recipeReport() {
  const db = getDb();
  const dishes = db.all("SELECT id, name, category, meal_type FROM dishes ORDER BY name ASC");
  return dishes.map((d) => {
    const items = db.all(
      "SELECT ri.qty_per_person, i.avg_cost FROM recipe_items ri LEFT JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.dish_id = ?",
      [d.id]
    );
    const costPerPerson = items.reduce((s, it) => s + (Number(it.qty_per_person) || 0) * (Number(it.avg_cost) || 0), 0);
    return { id: d.id, name: d.name, category: d.category, meal_type: d.meal_type, item_count: items.length, cost_per_person: round(costPerPerson) };
  });
}

// তারিখ পরিসরের dated মেনু (পদ সংখ্যা সহ)।
function menuReport(from, to) {
  return menuRepo.list({ from, to }).map((m) => ({
    id: m.id, m_date: m.m_date, meal_type: m.meal_type, menu_type: m.menu_type,
    title: m.title, dish_count: m.dish_count, dish_names: m.dish_names,
  }));
}

// তারিখ পরিসরে মোট উপকরণ ব্যবহার (প্রতিদিনের মেনু × ঐদিনের মিল সংখ্যা)।
function ingredientUsage(from, to) {
  const db = getDb();
  const menus = menuRepo.list({ from, to });
  const map = {};
  for (const m of menus) {
    const servings = mealListRepo.generate(m.m_date, m.meal_type).summary.total;
    for (const mi of m.items) {
      const items = db.all(
        "SELECT ri.ingredient_id, ri.qty_per_person, i.name_bn, i.unit, i.avg_cost FROM recipe_items ri LEFT JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.dish_id = ?",
        [mi.dish_id]
      );
      for (const it of items) {
        if (!it.ingredient_id) continue;
        const k = it.ingredient_id;
        if (!map[k]) map[k] = { ingredient_id: k, ingredient: it.name_bn || "—", unit: it.unit || "", required: 0, cost: 0 };
        const req = (Number(it.qty_per_person) || 0) * servings;
        map[k].required += req;
        map[k].cost += req * (Number(it.avg_cost) || 0);
      }
    }
  }
  return Object.values(map)
    .map((r) => ({ ...r, required: round(r.required), cost: round(r.cost) }))
    .sort((a, b) => b.required - a.required);
}

// মেনু ইতিহাস (পদ নাম সহ)।
function menuHistory(from, to) {
  return menuRepo.list({ from, to }).map((m) => ({
    id: m.id, m_date: m.m_date, meal_type: m.meal_type, menu_type: m.menu_type, title: m.title, dish_names: m.dish_names,
  }));
}

// বর্তমান স্টক মূল্য (উপকরণভিত্তিক) — Phase 3।
function stockValue() {
  return require("./store.repo.cjs").balances();
}

// তারিখ পরিসরের ক্রয় তালিকা — Phase 3।
function purchaseReport(from, to) {
  return require("./purchase.repo.cjs").list({ from, to });
}

// কস্ট অ্যানালাইসিস — ক্রয়/খরচ/অপচয় মূল্য + বর্তমান স্টক মূল্য — Phase 3।
//  unit_cost না থাকলে উপকরণের avg_cost fallback হিসেবে ব্যবহৃত।
function costAnalysis(from, to) {
  const db = getDb();
  const val = (source) => {
    const r = db.get(
      `SELECT COALESCE(SUM(t.qty * COALESCE(NULLIF(t.unit_cost,0), i.avg_cost)), 0) AS v
         FROM store_transactions t LEFT JOIN ingredients i ON i.id = t.ingredient_id
        WHERE t.source = ? AND t.t_date >= ? AND t.t_date <= ?`,
      [source, from, to]
    );
    return round(r.v);
  };
  return {
    purchaseValue: val("purchase"),
    consumptionValue: val("consumption"),
    wasteValue: val("waste"),
    currentStockValue: require("./store.repo.cjs").summary().totalValue,
  };
}

module.exports = { recipeReport, menuReport, ingredientUsage, menuHistory, stockValue, purchaseReport, costAnalysis };
