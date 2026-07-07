// ────────────────────────────────────────────────────────────────
//  ingredientCalc.js — স্মার্ট উপকরণ ক্যালকুলেটর Data API (dynamic)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const ingredientCalc = {
  generate: (date, mealType) => call("ingredient_calc:generate", { date, mealType }),
};
