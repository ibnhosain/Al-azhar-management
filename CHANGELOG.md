# Changelog

এই ফাইলে প্রতিটি প্রকাশিত সংস্করণের পরিবর্তন লিপিবদ্ধ থাকে।
সংস্করণ নীতি: [Semantic Versioning](https://semver.org/lang/bn/) — `MAJOR.MINOR.PATCH`।
প্রতিটি রিলিজে `latest.yml`, `MadrasaManagement-Setup-x.x.x.exe`, ও `.blockmap` GitHub Release-এ থাকা বাধ্যতামূলক (electron-updater সামঞ্জস্য)।

---

## [1.3.0] — 2026-07-08

### 🚀 Improvements — বোর্ডিং ও রান্নাঘর পরিপূর্ণ কার্যকর
- **বেড বরাদ্দ (Boarding)**: এখন আসল **শিক্ষার্থী / রুম / বেড তালিকা** থেকে নির্বাচন করা যায়
  (আগে হাতে টাইপ করতে হতো); বেড বাছলে **রুম স্বয়ংক্রিয়ভাবে বসে**; বরাদ্দ সংরক্ষণ করলে
  ঐ **বেড "বরাদ্দকৃত"** হয়ে যায়।
- **বেড ব্যবস্থাপনা**: রুম নম্বর আসল রুম তালিকা থেকে ড্রপডাউন।
- **ছুটি রেজিস্টার**: শিক্ষার্থী আসল তালিকা থেকে নির্বাচন।
- **আবাসিক তালিকা**: শিক্ষার্থী থেকে নাম অটো-ফিল।
- `CrudPage`-এ পুনঃব্যবহারযোগ্য dynamic dropdown (`optionsFrom`) + save-পরবর্তী side-effect hook।

### 🐛 Fixes — রান্নাঘর
- **WhatsApp/Send** ও বাইরের লিংক এখন **ডিফল্ট ব্রাউজারে** খোলে (আগে ইন-অ্যাপ ফাঁকা উইন্ডোতে
  আটকে যেত/কাজ করত না); প্রিন্ট পপআপ ঠিকভাবে খোলে (`setWindowOpenHandler`)।
- রান্নাঘর টাইলের অব্যবহৃত "শীঘ্রই" placeholder কোড সরানো (সব টাইল এখন সম্পূর্ণ কার্যকর)।

### 🔄 Includes (v1.2.1)
- সম্পূর্ণ স্বয়ংক্রিয় background auto-update (`autoDownload=true`) + রিপো casing ঠিক।

### 🔒 Data Safety / 🗄️ Database / ⚠️ Breaking
- ডেটা অপরিবর্তিত; schema পরিবর্তন নেই; breaking নেই।

---

## [1.2.1] — 2026-07-08

### 🚀 Improvements
- **সম্পূর্ণ স্বয়ংক্রিয় আপডেট**: `autoDownload=true` — অ্যাপ চালু হলে নতুন সংস্করণ পেলে
  ব্যাকগ্রাউন্ডে নিজে ডাউনলোড হয়; অ্যাপ বন্ধ করলে নিজে ইনস্টল হয় (কোনো ক্লিক ছাড়াই)।
  ব্যবহারকারী চাইলে ডাউনলোড শেষে সাথে সাথে "রিস্টার্ট ও ইনস্টল"-ও পারে।

### 🐛 Fixes
- GitHub রিপো নামের casing ঠিক (`Al-azhar-management`) — redirect ছাড়া সরাসরি আপডেট ফিড।

### 🔒 Data Safety / 🗄️ Database / ⚠️ Breaking
- আগের মতোই — ডেটা অপরিবর্তিত থাকে; schema পরিবর্তন নেই; breaking নেই।

---

## [1.2.0] — 2026-07-08

### 🚀 New Features
- **Professional Auto Update System** (electron-updater + GitHub Releases):
  - অ্যাপ চালুর সময় স্বয়ংক্রিয় আপডেট চেক + **Help → আপডেট চেক করুন** মেনু।
  - Update UI: Checking / Downloading / Paused / Downloaded / Installing / No Update / Failed।
  - বর্তমান সংস্করণ, সর্বশেষ সংস্করণ, **Release Notes (GitHub থেকে)**, ডাউনলোড সাইজ।
  - **Background download** — শতাংশ, গতি, বাকি সময়, **Pause/Resume**।
  - Update Now / Later / Restart to Install বাটন; অ্যাপজুড়ে ভাসমান Update Notifier।
  - Configurable update provider (GitHub এখন → পরে custom server, শুধু `update.config.cjs`)।

### 🔒 Data Safety
- আপডেট শুধু অ্যাপ ফাইল প্রতিস্থাপন করে; **Database (D:\BustanulIslam\Data), Photos, Backup, Config, Documents কখনো পরিবর্তন/মুছে ফেলা হয় না** (ইনস্টল ফোল্ডারের বাইরে থাকায়)।

### 🛡️ Security & Error Handling
- ডাউনলোড sha512 যাচাই (electron-updater), শুধু official GitHub Release থেকে আপডেট।
- বন্ধুত্বপূর্ণ ত্রুটি বার্তা: No Internet / GitHub Offline / Release Not Found / Download Interrupted / Permission Denied / Installation Failed; pause = নিরাপদ বাতিল (rollback-safe)।

### 🗄️ Database Changes
- নেই (schema সংস্করণ অপরিবর্তিত)।

### ⚠️ Breaking Changes
- নেই।

---

## [1.1.0] — 2026-07-07

### 🚀 New Features
- **সম্পূর্ণ রান্নাঘর ও মিল ব্যবস্থাপনা মডিউল** (🍳, ১৮টি সক্রিয় স্ক্রিন):
  - Phase 1 — মিল প্রোফাইল, স্মার্ট মিল লিস্ট, মিল বিরতি, ছুটির ক্যালেন্ডার।
  - Phase 2 — উপকরণ মাস্টার, পদ, রেসিপি, মেনু প্ল্যানার, স্মার্ট উপকরণ ক্যালকুলেটর, রিপোর্ট।
  - Phase 3 — কিচেন স্টোর (লেজার), ক্রয় (অটো স্টক-ইন + গড় মূল্য), সরবরাহকারী, মার্কেট প্ল্যানার, কস্ট অ্যানালাইসিস, কিচেন ড্যাশবোর্ড।
  - Phase 4 — মিল হাজিরা, গেস্ট মিল, মিল অনুমোদন (→ অটো স্টক খরচ), WhatsApp/Send।

### 🗄️ Database Changes
- Schema v6 → v9 (additive migration): student_meal_profiles, holidays, meal_pauses, ingredients, dishes, recipes, recipe_items, menus, menu_items, suppliers, purchases, purchase_items, store_transactions, meal_attendance, guest_meals, meal_approvals।
- ছবি SQLite-এর বাইরে ফাইলে; ব্যাকআপ এক ZIP-এ (DB + photos + config)।

### ⚠️ Breaking Changes
- নেই (বিদ্যমান কোনো টেবিল/ফিচার পরিবর্তিত হয়নি)।

---

## [1.0.0] — 2026-06

### 🚀 Initial Release
- অফলাইন Windows ডেস্কটপ ERP (Electron + React + Vite + SQLite + Repository Pattern + IPC)।
- মূল মডিউল: ড্যাশবোর্ড, শিক্ষার্থী, শিক্ষক, একাডেমিক, প্রমোশন, প্রশাসন, হিসাব, রশিদ, স্পনসর, ঋণ, এতিম, বোর্ডিং, নোটিশ।
- ব্যাকআপ/রিস্টোর, প্রথম-রান DB-লোকেশন সেটআপ, NSIS ইনস্টলার।
