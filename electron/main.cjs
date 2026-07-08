// ────────────────────────────────────────────────────────────────
//  Electron Main Process — অ্যাপের এন্ট্রি পয়েন্ট
//  কাজ: ডেস্কটপ উইন্ডো তৈরি করা এবং তাতে React অ্যাপ লোড করা।
//  (SQLite / IPC / Backup — পরবর্তী ধাপে এখানে যুক্ত হবে)
// ────────────────────────────────────────────────────────────────
const { app, BrowserWindow, dialog, Menu, shell } = require("electron");
const path = require("path");
const { initDatabase, closeDatabase } = require("./db/connection.cjs");
const { registerIpc } = require("./ipc/index.cjs");
const backupService = require("./services/backup.service.cjs");
const updaterService = require("./services/updater.service.cjs");

// dev মোডে Vite সার্ভারের URL এখানে থাকবে; প্রোডাকশনে থাকবে না।
const DEV_SERVER_URL = process.env.ELECTRON_START_URL;
const isDev = !!DEV_SERVER_URL;

let mainWindow = null;

// অ্যাপ মেনু: Help → আপডেট চেক করুন + সম্পর্কে (autoHideMenuBar থাকায় Alt-এ দেখা যায়)।
function buildAppMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { role: "fileMenu" },
    { role: "viewMenu" },
    {
      label: "সহায়তা",
      role: "help",
      submenu: [
        { label: "আপডেট চেক করুন", click: () => { try { updaterService.check(true); } catch { /* উপেক্ষা */ } } },
        { type: "separator" },
        {
          label: "সম্পর্কে",
          click: () => dialog.showMessageBox(mainWindow, {
            type: "info", title: "Madrasa Management",
            message: "Madrasa Management",
            detail: "সংস্করণ v" + app.getVersion() + "\n© 2026 Easy Coding Space",
          }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── স্টার্টআপ splash (আপডেট নেওয়ার সময় দেখানো হয়) ──
const SPLASH_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box;font-family:'Segoe UI','Noto Sans Bengali','Hind Siliguri',sans-serif}
body{height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f2417,#1b5e20);color:#fff;overflow:hidden;-webkit-user-select:none}
.box{text-align:center;padding:26px 30px}.logo{font-size:42px;margin-bottom:6px}
h1{font-size:18px;font-weight:700}.sub{font-size:13px;color:#c8e6c9;min-height:18px;margin-top:10px}
.bw{width:300px;height:8px;background:rgba(255,255,255,.18);border-radius:6px;margin:14px auto 0;overflow:hidden;display:none}
.bar{height:100%;width:0;background:#A5D6A7;transition:width .25s}.pct{font-size:12px;color:#e8f5e9;margin-top:6px;min-height:16px}
.spin{width:34px;height:34px;border:3px solid rgba(255,255,255,.25);border-top-color:#A5D6A7;border-radius:50%;margin:16px auto 0;animation:s .8s linear infinite}
@keyframes s{to{transform:rotate(360deg)}}</style></head><body><div class="box">
<div class="logo">🕌</div><h1>মাদরাসা ম্যানেজমেন্ট</h1><div class="spin" id="sp"></div>
<div class="sub" id="sub">শুরু হচ্ছে…</div><div class="bw" id="bw"><div class="bar" id="bar"></div></div><div class="pct" id="pct"></div>
</div><script>window.__upd=function(s){var g=function(i){return document.getElementById(i)};var st=s&&s.status;
if(st==='checking')g('sub').textContent='আপডেট পরীক্ষা করা হচ্ছে…';
else if(st==='available'){g('sub').textContent='নতুন সংস্করণ পাওয়া গেছে — ডাউনলোড শুরু…';g('bw').style.display='block'}
else if(st==='downloading'){g('sub').textContent='আপডেট ডাউনলোড হচ্ছে…';g('bw').style.display='block';var p=s.percent||0;g('bar').style.width=p+'%';g('pct').textContent=p+'%'}
else if(st==='installing'){g('sub').textContent='ইনস্টল হচ্ছে… অ্যাপ আবার চালু হবে';g('sp').style.display='none';g('bw').style.display='none';g('pct').textContent=''}
else g('sub').textContent='চালু হচ্ছে…';};</script></body></html>`;

function createSplashWindow() {
  const w = new BrowserWindow({
    width: 420, height: 250, frame: false, resizable: false, movable: false,
    center: true, show: false, backgroundColor: "#12351f", alwaysOnTop: true,
    webPreferences: { contextIsolation: true },
  });
  w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(SPLASH_HTML));
  w.once("ready-to-show", () => w.show());
  return w;
}

function pushSplash(splash, s) {
  if (splash && !splash.isDestroyed()) {
    splash.webContents.executeJavaScript("window.__upd&&window.__upd(" + JSON.stringify(s) + ")").catch(() => {});
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,                 // লোড শেষ হলে দেখাব (সাদা ফ্ল্যাশ এড়াতে)
    autoHideMenuBar: true,       // ডিফল্ট মেনুবার লুকানো (Alt চাপলে দেখা যাবে)
    backgroundColor: "#F0F2F5",  // অ্যাপের ব্যাকগ্রাউন্ডের সাথে মিল
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,    // renderer ও Node আলাদা রাখা (নিরাপত্তা)
      nodeIntegration: false,    // renderer-এ সরাসরি Node access বন্ধ
      sandbox: true,             // preload স্যান্ডবক্সড — শুধু contextBridge/ipc
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // window.open হ্যান্ডলিং:
  //  - বাইরের লিংক (WhatsApp wa.me, ইত্যাদি) → ডিফল্ট ব্রাউজারে খোলে (in-app নয়)
  //  - প্রিন্ট পপআপ (about:blank) → in-app native উইন্ডো অনুমোদিত (window.print চালাতে)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });

  if (isDev) {
    // dev: Vite dev সার্ভার থেকে লোড (Hot Reload সহ)
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // প্রোডাকশন: বিল্ড করা ফাইল থেকে লোড
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// একই সময়ে একটিই ইনস্ট্যান্স চলবে (double-launch আটকায়)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // উইন্ডো খোলার আগেই ডেটাবেস প্রস্তুত করা ও IPC হ্যান্ডলার রেজিস্টার
    try {
      initDatabase();
      registerIpc();
      try { backupService.autoBackupIfDue(); } catch { /* অটো-ব্যাকআপ ব্যর্থ হলেও অ্যাপ চলবে */ }
    } catch (err) {
      dialog.showErrorBox(
        "ডেটাবেস চালু করা যায়নি",
        "SQLite ডেটাবেস চালু করতে সমস্যা হয়েছে:\n\n" +
          (err && err.message ? err.message : String(err))
      );
    }

    // ── আগে আপডেট, পরে অ্যাপ ── splash-এ চেক/ডাউনলোড; আপডেট থাকলে ইনস্টল করে
    //  নতুন সংস্করণে রিলঞ্চ। অফলাইন/টাইমআউট/ত্রুটিতে অ্যাপ স্বাভাবিকভাবে খোলে।
    const splash = createSplashWindow();
    let decision = "proceed";
    try { decision = await updaterService.startupUpdateGate((s) => pushSplash(splash, s)); }
    catch { decision = "proceed"; }

    if (decision === "updating") {
      pushSplash(splash, { status: "installing" });
      return; // অ্যাপ quit হয়ে নতুন সংস্করণে চালু হবে
    }

    createWindow();
    updaterService.init(mainWindow);        // চলাকালীন in-app আপডেট নোটিফিকেশনের জন্য
    buildAppMenu();
    mainWindow.once("ready-to-show", () => { if (splash && !splash.isDestroyed()) splash.destroy(); });
    // ধীর নেটওয়ার্কে gate টাইমআউট হলে — খোলার পর ব্যাকগ্রাউন্ডে আবার চেক (safety net)
    setTimeout(() => { try { updaterService.check(false); } catch { /* ignore */ } }, 8000);

    // macOS: ডক আইকনে ক্লিকে উইন্ডো না থাকলে নতুন খুলবে
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

// সব উইন্ডো বন্ধ হলে অ্যাপ বন্ধ (macOS ছাড়া)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// অ্যাপ বন্ধ হওয়ার আগে DB সংযোগ নিরাপদে বন্ধ করা
app.on("will-quit", () => {
  closeDatabase();
});
