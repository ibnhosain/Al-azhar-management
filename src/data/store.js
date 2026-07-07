// ────────────────────────────────────────────────────────────────
//  store.js — কিচেন স্টোর (লেজার) Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const store = {
  balances: () => call("store:balances"),
  low: () => call("store:low"),
  summary: () => call("store:summary"),
  transactions: (filter) => call("store:transactions", filter || {}),
  add: (data) => call("store:add", data),
  remove: (id) => call("store:remove", id),
};
