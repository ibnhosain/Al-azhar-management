// ────────────────────────────────────────────────────────────────
//  system.ipc.cjs — বহিঃসংযোগ (WhatsApp/Email/SMS লিংক) OS-এ খোলা।
// ────────────────────────────────────────────────────────────────
const { ipcMain, shell } = require("electron");

function register() {
  ipcMain.handle("system:openExternal", async (_e, url) => {
    if (!url || typeof url !== "string") return { ok: false, error: "invalid url" };
    // শুধু নিরাপদ স্কিম (https/mailto/sms/tel) — অন্য কিছু নয়
    if (!/^(https?:|mailto:|sms:|tel:)/i.test(url)) return { ok: false, error: "unsupported scheme" };
    try { await shell.openExternal(url); return { ok: true }; }
    catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  });
}

module.exports = { register };
