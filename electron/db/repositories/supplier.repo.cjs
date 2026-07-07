// ────────────────────────────────────────────────────────────────
//  supplier.repo.cjs — সরবরাহকারী (factory CRUD)।
// ────────────────────────────────────────────────────────────────
const { createRepository } = require("../repository.factory.cjs");

const COLS = ["name", "phone", "address", "note", "active"];
const repo = createRepository("suppliers", COLS);

module.exports = { COLS, ...repo };
