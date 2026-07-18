// ────────────────────────────────────────────────────────────────
//  system.js — সিস্টেম/বহিঃসংযোগ Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const system = {
  openExternal: (url) => call("system:openExternal", url),
};
