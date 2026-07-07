// ────────────────────────────────────────────────────────────────
//  menus.js — মেনু প্ল্যানার Data API (dated + template + copy)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const menus = {
  list: (filter) => call("menu:list", filter || {}),
  templates: () => call("menu:templates"),
  get: (id) => call("menu:get", id),
  getByDateMeal: (date, mealType) => call("menu:getByDateMeal", { date, mealType }),
  save: (data) => call("menu:save", data),
  copy: (payload) => call("menu:copy", payload),
  remove: (id) => call("menu:delete", id),
};
