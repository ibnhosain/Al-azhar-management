// ────────────────────────────────────────────────────────────────
//  purchases.js — কিচেন ক্রয় Data API (header + items)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const purchases = {
  list: (filter) => call("purchase:list", filter || {}),
  get: (id) => call("purchase:get", id),
  create: (header, items) => call("purchase:create", { header, items }),
  remove: (id) => call("purchase:delete", id),
};
