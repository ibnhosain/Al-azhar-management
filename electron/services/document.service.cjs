// ────────────────────────────────────────────────────────────────
//  document.service.cjs — শিক্ষক ডকুমেন্ট (PDF/ছবি/ফাইল) ডেটা ফোল্ডারে সংরক্ষণ।
//  renderer ফাইলকে dataURL (base64) হিসেবে পাঠায় → এখানে ডিস্কে লেখা হয়।
//  খোলার সময় OS ডিফল্ট অ্যাপে খোলা হয় (shell.openPath)।
// ────────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const paths = require("../config/paths.cjs");
const settings = require("./settings.service.cjs");

function docsDir() {
  const dir = paths.getDocsDir(settings.getDbDirectory());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function extOf(originalName, mime) {
  const e = path.extname(String(originalName || "")).replace(/[^.\w]/g, "");
  if (e) return e;
  const map = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx" };
  return map[mime] || ".bin";
}

// dataURL → ফাইল; সংরক্ষিত ফাইলের নাম ফেরত
function saveDocument(dataUrl, originalName) {
  if (!dataUrl) return null;
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl);
  const mime = m ? m[1] : "application/octet-stream";
  const b64 = m ? m[2] : dataUrl;
  const stored = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extOf(originalName, mime)}`;
  fs.writeFileSync(path.join(docsDir(), stored), Buffer.from(b64, "base64"));
  return stored;
}

function docFullPath(storedName) {
  return storedName ? path.join(docsDir(), storedName) : null;
}

function deleteDocument(storedName) {
  if (!storedName) return;
  try { fs.unlinkSync(path.join(docsDir(), storedName)); } catch { /* ignore */ }
}

module.exports = { docsDir, saveDocument, docFullPath, deleteDocument };
