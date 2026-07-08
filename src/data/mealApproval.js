// ────────────────────────────────────────────────────────────────
//  mealApproval.js — মিল অনুমোদন Data API (অনুমোদনে অটো স্টক খরচ)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const mealApproval = {
  status: (date, mealType) => call("meal_approval:status", { date, mealType }),
  approve: (date, mealType, meta) => call("meal_approval:approve", { date, mealType, meta }),
  revert: (date, mealType) => call("meal_approval:revert", { date, mealType }),
};
