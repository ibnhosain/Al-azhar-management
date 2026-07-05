// ────────────────────────────────────────────────────────────────
//  repositories/index.cjs — entities config থেকে সব CRUD repository তৈরি।
//  ফলাফল: { receipts, expenses, notices, boarding, sponsors, loans, orphans }
// ────────────────────────────────────────────────────────────────
const { createRepository } = require("../repository.factory.cjs");
const entities = require("../entities.cjs");

const repos = {};
for (const [table, columns] of Object.entries(entities)) {
  repos[table] = createRepository(table, columns);
}

module.exports = repos;
