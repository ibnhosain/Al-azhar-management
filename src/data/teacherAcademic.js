// ────────────────────────────────────────────────────────────────
//  teacherAcademic.js — শিক্ষক একাডেমিক লগ (ডায়েরি/পারফরম্যান্স) Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const teacherAcademic = {
  list: (teacherId, logType) => call("teacher_academic:list", { teacherId, logType }),
  add: (data) => call("teacher_academic:add", data),
  remove: (id) => call("teacher_academic:remove", id),
};
