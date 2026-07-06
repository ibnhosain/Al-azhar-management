// ────────────────────────────────────────────────────────────────
//  ipc/index.cjs — সব IPC হ্যান্ডলার এক জায়গা থেকে রেজিস্টার।
// ────────────────────────────────────────────────────────────────
const students = require("./students.ipc.cjs");
const teachers = require("./teachers.ipc.cjs");
const attendance = require("./attendance.ipc.cjs");
const boardingBazar = require("./boardingBazar.ipc.cjs");
const backupIpc = require("./backup.ipc.cjs");
const kitchen = require("./kitchen.ipc.cjs");
const { registerCrud } = require("./crud.ipc.cjs");
const repos = require("../db/repositories/index.cjs");
const boardingExpenseRepo = require("../db/repositories/boardingExpense.repo.cjs");

function registerIpc() {
  // schema v1 এন্টিটি (আলাদা repo)
  students.register();
  teachers.register();

  // schema v2 এন্টিটি (entities config থেকে): receipts, expenses, notices,
  // boarding, sponsors, loans, orphans — সবগুলোর জন্য স্ট্যান্ডার্ড CRUD চ্যানেল
  for (const [resource, repo] of Object.entries(repos)) {
    registerCrud(resource, repo);
  }

  // schema v3 — Boarding module
  registerCrud("boarding_expense", boardingExpenseRepo);
  boardingBazar.register();

  // দৈনিক হাজিরা (custom চ্যানেল)
  attendance.register();

  // ব্যাকআপ / রিস্টোর / লোকেশন
  backupIpc.register();

  // Kitchen & Meal (Phase 1)
  kitchen.register();
}

module.exports = { registerIpc };
