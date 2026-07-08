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

  // Auto Update: উইন্ডোকে ইভেন্ট-লক্ষ্য হিসেবে সংযুক্ত করা + চালুর পর নীরব চেক।
  updaterService.init(mainWindow);
  setTimeout(() => { try { updaterService.check(); } catch { /* আপডেট চেক ব্যর্থ হলেও অ্যাপ চলবে */ } }, 4000);

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

  app.whenReady().then(() => {
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

    createWindow();
    buildAppMenu();

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
