// ────────────────────────────────────────────────────────────────
//  guestMeal.repo.cjs — অতিথি মিল (factory CRUD + বেলাভিত্তিক যোগফল)।
//  গেস্ট সংখ্যা মিল লিস্ট summary ও ক্যালকুলেটর/মার্কেট servings-এ যোগ হয়।
// ────────────────────────────────────────────────────────────────
const { createRepository } = require("../repository.factory.cjs");
const { getDb } = require("../connection.cjs");

const COLS = ["g_date", "meal_type", "guest_count", "guest_name", "reason", "note"];
const repo = createRepository("guest_meals", COLS);

function sumForMeal(date, mealType) {
  return Number(getDb().get("SELECT COALESCE(SUM(guest_count),0) AS c FROM guest_meals WHERE g_date = ? AND meal_type = ?", [date, mealType]).c) || 0;
}

module.exports = { COLS, ...repo, sumForMeal };
