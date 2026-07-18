// ────────────────────────────────────────────────────────────────
//  salaryReceipt.js — সংরক্ষিত বেতন রশিদ Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const salaryReceipt = {
  list: (teacherId) => call("salary_receipt:list", teacherId),
  add: (data) => call("salary_receipt:add", data),
  remove: (id) => call("salary_receipt:remove", id),
};
