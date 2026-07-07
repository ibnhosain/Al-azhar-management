// ────────────────────────────────────────────────────────────────
//  kitchenReports.js — রান্নাঘর রিপোর্ট Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const kitchenReports = {
  recipe: () => call("kitchen_report:recipe"),
  menu: (from, to) => call("kitchen_report:menu", { from, to }),
  usage: (from, to) => call("kitchen_report:usage", { from, to }),
  history: (from, to) => call("kitchen_report:history", { from, to }),
  // Phase 3 — cost/inventory
  stock: () => call("kitchen_report:stock"),
  purchaseReport: (from, to) => call("kitchen_report:purchase", { from, to }),
  cost: (from, to) => call("kitchen_report:cost", { from, to }),
};
