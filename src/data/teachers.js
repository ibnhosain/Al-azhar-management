// ────────────────────────────────────────────────────────────────
//  teachers.js — teachers এন্টিটির Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const teachers = {
  list: () => call("teachers:list"),
  get: (id) => call("teachers:get", id),
  create: (data) => call("teachers:create", data),
  update: (id, data) => call("teachers:update", { id, data }),
  remove: (id) => call("teachers:delete", id),
};
