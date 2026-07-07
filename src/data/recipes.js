// ────────────────────────────────────────────────────────────────
//  recipes.js — পদের রেসিপি (dish ১:১ + উপকরণ আইটেম) Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const recipes = {
  getByDish: (dishId) => call("recipe:getByDish", dishId),
  saveForDish: (dishId, data) => call("recipe:saveForDish", { dishId, data }),
};
