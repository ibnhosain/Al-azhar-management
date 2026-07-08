// ────────────────────────────────────────────────────────────────
//  kitchen.ipc.cjs — Kitchen module IPC চ্যানেল (Phase 1 + Phase 2)।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const { registerCrud } = require("./crud.ipc.cjs");

const mealProfile = require("../db/repositories/mealProfile.repo.cjs");
const mealList = require("../db/repositories/mealList.repo.cjs");
const ingredient = require("../db/repositories/ingredient.repo.cjs");
const dish = require("../db/repositories/dish.repo.cjs");
const recipe = require("../db/repositories/recipe.repo.cjs");
const menu = require("../db/repositories/menu.repo.cjs");
const ingredientCalc = require("../db/repositories/ingredientCalc.repo.cjs");
const reports = require("../db/repositories/kitchenReports.repo.cjs");
const supplier = require("../db/repositories/supplier.repo.cjs");
const store = require("../db/repositories/store.repo.cjs");
const purchase = require("../db/repositories/purchase.repo.cjs");
const market = require("../db/repositories/market.repo.cjs");
const dashboard = require("../db/repositories/kitchenDashboard.repo.cjs");
const mealAttendance = require("../db/repositories/mealAttendance.repo.cjs");
const guestMeal = require("../db/repositories/guestMeal.repo.cjs");
const mealApproval = require("../db/repositories/mealApproval.repo.cjs");

function register() {
  // Phase 1
  ipcMain.handle("meal_profile:list", () => mealProfile.listWithStudents());
  ipcMain.handle("meal_profile:get", (_e, studentId) => mealProfile.getByStudent(studentId));
  ipcMain.handle("meal_profile:upsert", (_e, { studentId, data }) => mealProfile.upsert(studentId, data));
  ipcMain.handle("meal_list:generate", (_e, { date, mealType }) => mealList.generate(date, mealType));

  // Phase 2 — standard CRUD (factory-backed)
  registerCrud("ingredient", ingredient);
  registerCrud("dish", dish);

  // Phase 2 — recipe (dish ১:১ + items)
  ipcMain.handle("recipe:getByDish", (_e, dishId) => recipe.getByDish(dishId));
  ipcMain.handle("recipe:saveForDish", (_e, { dishId, data }) => recipe.saveForDish(dishId, data));

  // Phase 2 — menu planner
  ipcMain.handle("menu:list", (_e, filter) => menu.list(filter || {}));
  ipcMain.handle("menu:templates", () => menu.templates());
  ipcMain.handle("menu:get", (_e, id) => menu.getById(id));
  ipcMain.handle("menu:getByDateMeal", (_e, { date, mealType }) => menu.getByDateMeal(date, mealType));
  ipcMain.handle("menu:save", (_e, data) => menu.save(data));
  ipcMain.handle("menu:copy", (_e, payload) => menu.copy(payload));
  ipcMain.handle("menu:delete", (_e, id) => menu.remove(id));

  // Phase 2 — dynamic ingredient calculator
  ipcMain.handle("ingredient_calc:generate", (_e, { date, mealType }) => ingredientCalc.generate(date, mealType));

  // Phase 2 — reports
  ipcMain.handle("kitchen_report:recipe", () => reports.recipeReport());
  ipcMain.handle("kitchen_report:menu", (_e, { from, to }) => reports.menuReport(from, to));
  ipcMain.handle("kitchen_report:usage", (_e, { from, to }) => reports.ingredientUsage(from, to));
  ipcMain.handle("kitchen_report:history", (_e, { from, to }) => reports.menuHistory(from, to));

  // Phase 3 — supplier CRUD (factory)
  registerCrud("supplier", supplier);

  // Phase 3 — kitchen store (ledger)
  ipcMain.handle("store:balances", () => store.balances());
  ipcMain.handle("store:low", () => store.lowStock());
  ipcMain.handle("store:summary", () => store.summary());
  ipcMain.handle("store:transactions", (_e, filter) => store.listTransactions(filter || {}));
  ipcMain.handle("store:add", (_e, data) => store.addTransaction(data));
  ipcMain.handle("store:remove", (_e, id) => store.removeTransaction(id));

  // Phase 3 — purchase
  ipcMain.handle("purchase:list", (_e, filter) => purchase.list(filter || {}));
  ipcMain.handle("purchase:get", (_e, id) => purchase.getById(id));
  ipcMain.handle("purchase:create", (_e, payload) => purchase.create(payload));
  ipcMain.handle("purchase:delete", (_e, id) => purchase.remove(id));

  // Phase 3 — market planner (dynamic)
  ipcMain.handle("market:plan", (_e, { date, mealType }) => market.plan(date, mealType));

  // Phase 3 — cost reports + dashboard
  ipcMain.handle("kitchen_report:stock", () => reports.stockValue());
  ipcMain.handle("kitchen_report:purchase", (_e, { from, to }) => reports.purchaseReport(from, to));
  ipcMain.handle("kitchen_report:cost", (_e, { from, to }) => reports.costAnalysis(from, to));
  ipcMain.handle("kitchen_dash:overview", () => dashboard.overview());

  // Phase 4 — মিল হাজিরা
  ipcMain.handle("meal_attendance:get", (_e, { date, mealType }) => mealAttendance.getForMeal(date, mealType));
  ipcMain.handle("meal_attendance:save", (_e, { date, mealType, records }) => mealAttendance.saveForMeal(date, mealType, records));
  ipcMain.handle("meal_attendance:summary", (_e, { date, mealType }) => mealAttendance.summary(date, mealType));

  // Phase 4 — গেস্ট মিল (factory CRUD)
  registerCrud("guest_meal", guestMeal);

  // Phase 4 — মিল অনুমোদন
  ipcMain.handle("meal_approval:status", (_e, { date, mealType }) => mealApproval.status(date, mealType));
  ipcMain.handle("meal_approval:approve", (_e, { date, mealType, meta }) => mealApproval.approve(date, mealType, meta || {}));
  ipcMain.handle("meal_approval:revert", (_e, { date, mealType }) => mealApproval.revert(date, mealType));
}

module.exports = { register };
