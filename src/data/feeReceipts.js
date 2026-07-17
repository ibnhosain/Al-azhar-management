// ────────────────────────────────────────────────────────────────
//  feeReceipts.js — বেতন ব্যবস্থাপনা (মানি রিসিট) Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const feeReceipts = {
  list: (filter) => call("fee_receipt:list", filter || {}),
  totals: (filter) => call("fee_receipt:totals", filter || {}),
  get: (id) => call("fee_receipt:get", id),
  dues: (studentId, beforeMonth) => call("fee_receipt:dues", { studentId, beforeMonth }),
  summary: (studentId) => call("fee_receipt:summary", studentId),
  duesByStudent: () => call("fee_receipt:duesByStudent"),
  create: (data) => call("fee_receipt:create", data),
  collect: (data) => call("fee_receipt:collect", data),
  remove: (id) => call("fee_receipt:delete", id),
};
