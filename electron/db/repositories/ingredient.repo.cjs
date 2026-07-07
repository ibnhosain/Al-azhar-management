// ────────────────────────────────────────────────────────────────
//  ingredient.repo.cjs — উপকরণ মাস্টার (factory CRUD)।
//  typed টেবিল (avg_cost/min_stock REAL) explicit schema v7-এ; কলাম তালিকা
//  factory-কে দেওয়া হয় (institution_id বাদ → DEFAULT 1 প্রযোজ্য)।
// ────────────────────────────────────────────────────────────────
const { createRepository } = require("../repository.factory.cjs");

const COLS = ["name_bn", "name_en", "category", "unit", "avg_cost", "purchase_unit", "conversion_factor", "min_stock", "active", "note"];

const repo = createRepository("ingredients", COLS);

module.exports = { COLS, ...repo };
