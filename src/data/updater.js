// ────────────────────────────────────────────────────────────────
//  updater.js — Auto Update Data API (electron-updater bridge)।
//  subscribe() মূল প্রসেস থেকে push ইভেন্ট শোনে (checking/downloading/…)।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const updater = {
  check: () => call("updater:check"),
  download: () => call("updater:download"),
  pause: () => call("updater:pause"),
  resume: () => call("updater:resume"),
  install: () => call("updater:install"),
  version: () => call("updater:version"),
  subscribe: (cb) =>
    (typeof window !== "undefined" && window.api && window.api.onUpdaterEvent
      ? window.api.onUpdaterEvent(cb)
      : () => {}),
};
