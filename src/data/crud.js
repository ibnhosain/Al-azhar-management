// ────────────────────────────────────────────────────────────────
//  crud.js — যেকোনো এন্টিটির জন্য স্ট্যান্ডার্ড CRUD API তৈরি করে।
//  (students/teachers-এর মতোই, শুধু resource নাম বদলে)
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export function makeCrud(resource) {
  return {
    list: () => call(`${resource}:list`),
    get: (id) => call(`${resource}:get`, id),
    create: (data) => call(`${resource}:create`, data),
    update: (id, data) => call(`${resource}:update`, { id, data }),
    remove: (id) => call(`${resource}:delete`, id),
  };
}
