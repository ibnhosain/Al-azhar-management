// ────────────────────────────────────────────────────────────────
//  students.js — students এন্টিটির Data API।
//  React কম্পোনেন্ট শুধু এগুলো কল করবে; ভেতরে IPC/SQL/HTTP লুকানো।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const students = {
  list: () => call("students:list"),
  get: (id) => call("students:get", id),
  create: (data) => call("students:create", data),
  update: (id, data) => call("students:update", { id, data }),
  remove: (id) => call("students:delete", id),
};
