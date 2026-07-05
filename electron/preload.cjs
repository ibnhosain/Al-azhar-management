// ────────────────────────────────────────────────────────────────
//  Electron Preload — renderer ও main-এর মধ্যে নিরাপদ সেতু।
//  contextIsolation চালু থাকায় এখানেই একমাত্র নিয়ন্ত্রিতভাবে
//  window-এর উপর API প্রকাশ করা যায়।
//
//  window.api.invoke(channel, payload) → ipcMain.handle(channel) কল করে।
//  নিরাপত্তার জন্য শুধু নির্দিষ্ট প্যাটার্নের চ্যানেল অনুমোদিত।
// ────────────────────────────────────────────────────────────────
const { contextBridge, ipcRenderer } = require("electron");

// অনুমোদিত চ্যানেল: resource:action  (যেমন students:list, attendance:getByDate)
// ipcMain শুধু রেজিস্টার-করা চ্যানেলেই সাড়া দেয়, তাই প্যাটার্নটি সাধারণ রাখা হয়েছে।
const CHANNEL_RE = /^[a-z_]+:[a-zA-Z]+$/;

contextBridge.exposeInMainWorld("api", {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  invoke: (channel, payload) => {
    if (typeof channel !== "string" || !CHANNEL_RE.test(channel)) {
      return Promise.reject(new Error(`Blocked IPC channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, payload);
  },
});
