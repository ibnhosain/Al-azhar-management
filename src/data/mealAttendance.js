// ────────────────────────────────────────────────────────────────
//  mealAttendance.js — মিল হাজিরা Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const mealAttendance = {
  get: (date, mealType) => call("meal_attendance:get", { date, mealType }),
  save: (date, mealType, records) => call("meal_attendance:save", { date, mealType, records }),
  summary: (date, mealType) => call("meal_attendance:summary", { date, mealType }),
};
