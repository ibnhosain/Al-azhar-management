// ────────────────────────────────────────────────────────────────
//  market.repo.cjs — স্মার্ট মার্কেট প্ল্যানার (READ-only, dynamic)।
//  ঘাটতি = প্রয়োজন (রেসিপি×মিল সংখ্যা) − বর্তমান স্টক। সংরক্ষণ হয় না।
//  mealType='all' হলে সকাল+দুপুর+রাত একত্রে।
// ────────────────────────────────────────────────────────────────
const store = require("./store.repo.cjs");
const calc = require("./ingredientCalc.repo.cjs");

const round = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

function plan(date, mealType) {
  const meals = mealType === "all" ? ["breakfast", "lunch", "dinner"] : [mealType];
  const req = {};
  for (const m of meals) {
    const c = calc.generate(date, m);
    for (const r of c.rows) {
      if (!req[r.ingredient_id]) req[r.ingredient_id] = { ingredient_id: r.ingredient_id, ingredient: r.ingredient, unit: r.unit, required: 0 };
      req[r.ingredient_id].required += r.required;
    }
  }
  const bal = {};
  store.balances().forEach((b) => { bal[b.ingredient_id] = b; });
  const rows = Object.values(req).map((r) => {
    const b = bal[r.ingredient_id] || {};
    const stock = b.current_qty || 0;
    const shortage = Math.max(0, round(r.required - stock));
    return { ...r, required: round(r.required), stock: round(stock), shortage, est_cost: round(shortage * (b.avg_cost || 0)) };
  }).sort((a, b) => b.shortage - a.shortage);
  return { rows, totalCost: round(rows.reduce((s, r) => s + r.est_cost, 0)), buyCount: rows.filter((r) => r.shortage > 0).length };
}

module.exports = { plan };
