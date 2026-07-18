// ────────────────────────────────────────────────────────────────
//  teacherDocument.js — শিক্ষক ডকুমেন্ট Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const teacherDocument = {
  list: (teacherId) => call("teacher_document:list", teacherId),
  add: (data) => call("teacher_document:add", data),
  remove: (id) => call("teacher_document:remove", id),
  open: (id) => call("teacher_document:open", id),
};
