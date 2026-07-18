// ────────────────────────────────────────────────────────────────
//  salaryLedger.js — শিক্ষক বেতন লেজার (HR/Payroll) Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const salaryLedger = {
  dashboard: () => call("salary_ledger:dashboard"),
  statement: (teacherId) => call("salary_ledger:statement", teacherId),
  listByTeacher: (teacherId) => call("salary_ledger:listByTeacher", teacherId),
  duesByTeacher: () => call("salary_ledger:duesByTeacher"),
  add: (data) => call("salary_ledger:add", data),
  collect: (data) => call("salary_ledger:collect", data),
  reverse: (id, meta) => call("salary_ledger:reverse", { id, meta }),
};
