// ────────────────────────────────────────────────────────────────
//  market.js — স্মার্ট মার্কেট প্ল্যানার Data API (dynamic)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const market = {
  plan: (date, mealType) => call("market:plan", { date, mealType }),
};
