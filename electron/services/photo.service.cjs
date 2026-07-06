// ────────────────────────────────────────────────────────────────
//  photo.service.cjs — ছাত্র/মিল ছবি ফাইল হিসেবে ডেটা ফোল্ডারে সংরক্ষণ।
//  renderer ছবিকে ছোট thumbnail-এ resize করে base64 পাঠায় → এখানে ফাইলে লেখা হয়।
//  প্রদর্শনের জন্য ফাইল → data URL ফেরত দেওয়া হয়।
// ────────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const paths = require("../config/paths.cjs");
const settings = require("./settings.service.cjs");

function photosDir() {
  const dir = paths.getPhotosDir(settings.getDbDirectory());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// base64/dataURL → ফাইল; filename ফেরত
function savePhoto(key, dataUrl) {
  if (!dataUrl) return null;
  const m = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl);
  const b64 = m ? m[1] : dataUrl;
  const name = `photo-${key}-${Date.now()}.jpg`;
  fs.writeFileSync(path.join(photosDir(), name), Buffer.from(b64, "base64"));
  return name;
}

// filename → data URL (প্রদর্শনের জন্য)
function readPhoto(filename) {
  if (!filename) return null;
  try {
    const buf = fs.readFileSync(path.join(photosDir(), filename));
    return "data:image/jpeg;base64," + buf.toString("base64");
  } catch {
    return null;
  }
}

function deletePhoto(filename) {
  if (!filename) return;
  try { fs.unlinkSync(path.join(photosDir(), filename)); } catch { /* ignore */ }
}

module.exports = { photosDir, savePhoto, readPhoto, deletePhoto };
