// ────────────────────────────────────────────────────────────────
//  kitchenDashboard.repo.cjs — রান্নাঘর ড্যাশবোর্ড সারাংশ (READ-only)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const menu = require("./menu.repo.cjs");
const store = require("./store.repo.cjs");
const purchase = require("./purchase.repo.cjs");

function overview() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const t = new Date(); t.setDate(t.getDate() + 1);
  const tomorrow = t.toISOString().slice(0, 10);

  return {
    today, tomorrow,
    todayMenus: menu.list({ from: today, to: today }),
    tomorrowMenus: menu.list({ from: tomorrow, to: tomorrow }),
    low: store.lowStock(),
    store: store.summary(),
    recentPurchases: purchase.list({}).slice(0, 5),
    recentTxns: store.listTransactions({}).slice(0, 8),
    counts: {
      dishes: db.get("SELECT COUNT(*) AS c FROM dishes").c,
      ingredients: db.get("SELECT COUNT(*) AS c FROM ingredients").c,
      suppliers: db.get("SELECT COUNT(*) AS c FROM suppliers").c,
      menus: db.get("SELECT COUNT(*) AS c FROM menus WHERE is_template='0'").c,
    },
  };
}

module.exports = { overview };
