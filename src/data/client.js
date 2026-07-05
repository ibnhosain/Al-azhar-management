// ────────────────────────────────────────────────────────────────
//  client.js — Data Layer-এর একমাত্র transport সিদ্ধান্ত-বিন্দু।
//
//  এখন:      Electron → window.api (IPC → SQLite)
//            Web      → webAdapter (in-memory)
//  ভবিষ্যতে: Online   → fetch()  ← শুধু এই ফাইলে একটি শাখা যোগ করলেই হবে,
//                                   React/entity API-তে কিছু বদলাতে হবে না।
// ────────────────────────────────────────────────────────────────
import { webCall } from "./webAdapter";

const isElectron =
  typeof window !== "undefined" && !!(window.api && window.api.isElectron);

export const environment = isElectron ? "electron" : "web";

// একক এন্ট্রি: চ্যানেল + পেলোড → ফলাফল (Promise)।
export async function call(channel, payload) {
  if (isElectron) {
    return window.api.invoke(channel, payload);
  }
  return webCall(channel, payload);
}
