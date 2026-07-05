// ────────────────────────────────────────────────────────────────
//  attendance.js — দৈনিক হাজিরার Data API (custom, CRUD নয়)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const attendance = {
  getByDate: (date) => call("attendance:getByDate", date),
  saveForDate: (date, records) => call("attendance:saveForDate", { date, records }),
};
