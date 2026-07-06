// ────────────────────────────────────────────────────────────────
//  boardingBazar.js — বোর্ডিং বাজারের Data API (header + items)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const boardingBazar = {
  list: () => call("boarding_bazar:list"),
  get: (id) => call("boarding_bazar:get", id),
  create: (header, items) => call("boarding_bazar:create", { header, items }),
  update: (id, header, items) => call("boarding_bazar:update", { id, data: { header, items } }),
  remove: (id) => call("boarding_bazar:delete", id),
};
