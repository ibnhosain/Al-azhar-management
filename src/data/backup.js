// ────────────────────────────────────────────────────────────────
//  backup.js — ব্যাকআপ/রিস্টোর/লোকেশন Data API (শুধু Electron-এ সক্রিয়)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const backup = {
  info: () => call("backup:info"),
  list: () => call("backup:list"),
  create: () => call("backup:create"),
  restore: (p) => call("backup:restore", p),
  remove: (p) => call("backup:delete", p),
  setAuto: (enabled) => call("backup:setAuto", enabled),
  openFolder: () => call("backup:openFolder"),
  chooseDir: () => call("backup:chooseDir"),
  exportTo: () => call("backup:exportTo"),
};
