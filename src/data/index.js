// ────────────────────────────────────────────────────────────────
//  data/index.js — Data Layer-এর একক প্রবেশদ্বার।
//  React-এ: import { students, receipts, attendance, ... } from "../data";
// ────────────────────────────────────────────────────────────────
import { makeCrud } from "./crud";

export { students } from "./students";
export { teachers } from "./teachers";
export { attendance } from "./attendance";
export { boardingBazar } from "./boardingBazar";
export { backup } from "./backup";
export { environment, call } from "./client";
export { seedResource } from "./webAdapter";

// schema v2 এন্টিটি — একই প্যাটার্নে তৈরি
export const receipts = makeCrud("receipts");
export const expenses = makeCrud("expenses");
export const notices = makeCrud("notices");
export const boarding = makeCrud("boarding");
export const sponsors = makeCrud("sponsors");
export const loans = makeCrud("loans");
export const orphans = makeCrud("orphans");

// schema v3 — Boarding module
export const boardingExpense = makeCrud("boarding_expense");

// schema v4 — Boarding sub-modules
export const rooms = makeCrud("rooms");
export const beds = makeCrud("beds");
export const bedAllocations = makeCrud("bed_allocations");
export const meals = makeCrud("meals");
export const leaves = makeCrud("leaves");
export const visitors = makeCrud("visitors");
