// ────────────────────────────────────────────────────────────────
//  mealProfiles.js — ছাত্রের মিল প্রোফাইল Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const mealProfiles = {
  list: () => call("meal_profile:list"),
  get: (studentId) => call("meal_profile:get", studentId),
  upsert: (studentId, data) => call("meal_profile:upsert", { studentId, data }),
};
