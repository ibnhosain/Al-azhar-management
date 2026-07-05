// ────────────────────────────────────────────────────────────────
//  ipc/index.cjs — সব IPC হ্যান্ডলার এক জায়গা থেকে রেজিস্টার।
// ────────────────────────────────────────────────────────────────
const students = require("./students.ipc.cjs");
const teachers = require("./teachers.ipc.cjs");
const attendance = require("./attendance.ipc.cjs");
const { registerCrud } = require("./crud.ipc.cjs");
const repos = require("../db/repositories/index.cjs");

function registerIpc() {
  // schema v1 এন্টিটি (আলাদা repo)
  students.register();
  teachers.register();

  // schema v2 এন্টিটি (entities config থেকে): receipts, expenses, notices,
  // boarding, sponsors, loans, orphans — সবগুলোর জন্য স্ট্যান্ডার্ড CRUD চ্যানেল
  for (const [resource, repo] of Object.entries(repos)) {
    registerCrud(resource, repo);
  }

  // দৈনিক হাজিরা (custom চ্যানেল)
  attendance.register();
}

module.exports = { registerIpc };
