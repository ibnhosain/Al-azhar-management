// ────────────────────────────────────────────────────────────────
//  mealList.js — Smart Meal List (auto-generated) Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const mealList = {
  generate: (date, mealType) => call("meal_list:generate", { date, mealType }),
};
