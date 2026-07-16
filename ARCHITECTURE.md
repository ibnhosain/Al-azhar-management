# 🕌 মাদরাসা ম্যানেজমেন্ট — আর্কিটেকচার ও বিল্ড ব্লুপ্রিন্ট

> এই ডকুমেন্টটি অ্যাপটি **কী দিয়ে, কীভাবে বানানো** এবং **কীভাবে কাজ করে** তার সম্পূর্ণ সংক্ষিপ্ত নকশা।
> লক্ষ্য: পরে যেকোনো সময় একই প্যাটার্নে আরেকটি অফলাইন ডেস্কটপ ম্যানেজমেন্ট অ্যাপ বানানো।

---

## 🔌 মূল দর্শন — অফলাইন-ফার্স্ট

- **ইন্টারনেট ছাড়াই সম্পূর্ণ চলে।** সব ফিচার (ভর্তি, বেতন, রশিদ, হিসাব, রিপোর্ট, প্রিন্ট) নেট ছাড়া কাজ করে। একবার ইনস্টল করলেই যথেষ্ট।
- **সব ডেটা ইউজারের নিজের ডিভাইসেই।** SQLite ডেটাবেস, ছবি, ব্যাকআপ — সবই লোকাল ফাইলে। কোনো ক্লাউড সার্ভারে বা তৃতীয় পক্ষের কাছে যায় না → পূর্ণ গোপনীয়তা ও মালিকানা ইউজারের।
- **ইন্টারনেট শুধু একটাই কাজে (ঐচ্ছিক):** সফটওয়্যার আপডেট নামানো। নেট না থাকলে অ্যাপ আগের ভার্সনেই স্বাভাবিকভাবে চলে; ডেটা ব্যবহারে নেট কখনো লাগে না।
- এই কারণেই ডেটা ইনস্টল ফোল্ডারের **বাইরে** রাখা — আপডেট/রিইনস্টল/আনইনস্টলেও সব তথ্য অক্ষত থাকে।

---

## ১. প্রযুক্তি (Tech Stack)

| স্তর | ব্যবহৃত | কেন |
|---|---|---|
| ডেস্কটপ শেল | **Electron 43** | অফলাইন Windows `.exe` |
| UI | **React 19 + Vite 8** | দ্রুত, আধুনিক কম্পোনেন্ট UI |
| চার্ট | **Recharts** | ড্যাশবোর্ড গ্রাফ |
| ডেটাবেস | **SQLite (`node-sqlite3-wasm`)** | WASM — native compile লাগে না, প্যাকেজিং পরিষ্কার |
| ইনস্টলার | **electron-builder (NSIS)** | কাস্টম ইনস্টলার |
| অটো-আপডেট | **electron-updater + GitHub Releases** | নিজস্ব সার্ভার ছাড়াই আপডেট |
| ভাষা/থিম | সম্পূর্ণ **বাংলা UI, সবুজ থিম** | |

---

## ২. আর্কিটেকচার — ৩টি প্রক্রিয়া

```
electron/main.cjs     → Main process: উইন্ডো তৈরি, DB init, IPC রেজিস্টার, auto-update
electron/preload.cjs  → নিরাপদ সেতু (contextIsolation) → renderer পায় শুধু window.api
src/ (React)          → Renderer: শুধু UI; সরাসরি DB/ফাইল ছোঁয় না
```

**সোনালি নিয়ম:** Renderer কখনো SQL বা ফাইল সিস্টেম সরাসরি চালায় না। সব কিছু **IPC** দিয়ে main process-এ যায়। ফলে ভবিষ্যতে অনলাইন/অ্যান্ড্রয়েডে পোর্ট করা সহজ — শুধু transport স্তর (`client.js`) বদলাতে হয়, UI অপরিবর্তিত থাকে।

```
UI (React)  →  data/client.js  →  IPC  →  ipc/*.cjs  →  repositories/*.cjs  →  SQLite
   (web fallback হলে webAdapter → localStorage seed)
```

---

## ৩. ডেটা-লেয়ার — Repository Pattern (মূল ইঞ্জিন)

নতুন একটা টেবিল/ফিচার যোগ করতে মূলত **এক লাইন**:

```js
// electron/db/entities.cjs — single source of truth
module.exports = {
  receipts: ["code", "student", "class", "roll", "type", "amount", "date", "status"],
  expenses: ["code", "title", "amount", "date", "category"],
  // ... নতুন এন্টিটি এখানে যোগ করলেই:
};
```

এই এক লাইন থেকে **স্বয়ংক্রিয়ভাবে** তৈরি হয় → টেবিল (schema) + repository (CRUD) + IPC চ্যানেল।

React-এ ব্যবহার:
```js
import { receipts } from "../data";
await receipts.list();            // সব
await receipts.create({ ... });   // নতুন
await receipts.update(id, { ... });
await receipts.remove(id);
```

**মূল কৌশল দুটি:**
- **Schema migration** — `PRAGMA user_version` দিয়ে ভার্সন ট্র্যাক। নতুন কলাম শুধু **যোগ** (additive), কখনো মুছে না → পুরোনো ইউজারের ডেটা নিরাপদ।
- **নমনীয় ফিল্ড (`extra`)** — একটা JSON কলাম (`extra TEXT`)-এ যেকোনো অতিরিক্ত ফিল্ড (ছবি, ঠিকানা, ইত্যাদি) স্কিমা না বদলেই রাখা যায়। repo `decorate()`/`buildExtra()` দিয়ে spread করে।

---

## ৪. UI কিট (`src/ui/`) — একবার বানাও, সব জায়গায়

উপাদান: `PageHeader, DataTable, StatCard/StatRow, Modal, Button, Badge, Card, useToast`
ফর্ম ফিল্ড: `TextField, SelectField, ComboField (এডিটযোগ্য ড্রপডাউন), DateField, MoneyField, TextareaField`

- **DataTable** — সার্চ + সাজানো + পেজিনেশন + **Copy/Excel/Print export** সব বিল্ট-ইন।
- **বাংলা IME-নিরাপদ ইনপুট (`useImeInput`)** — অভ্র/বিজয় দিয়ে লিখলে যুক্তাক্ষর/composition ভাঙে না। *(এটি আলাদাভাবে সমাধান করতে হয়েছিল — নতুন অ্যাপে শুরুতেই ধরে রাখবে।)*
- লেবেল সবসময় ইনপুটের **উপরে** (floating নয়) — বাংলা লেখার সাথে সংঘর্ষ এড়াতে।

**প্রতিটি মডিউলের একই প্যাটার্ন:**
```
PageHeader → StatCards (সারাংশ) → ফিল্টার/সার্চ → DataTable → add/edit/view Modal
```
এই সঞ্চিত প্যাটার্নে শিক্ষার্থী, শিক্ষক, রশিদ — সব মডিউল বানানো।

---

## ৫. নেভিগেশন

- `App.jsx`-এ সাইডবার `menuItems[]` + `PageContent` সুইচ (index অনুযায়ী পেজ রেন্ডার)।
- প্রতি মেনু-ক্লিকে পেজ fresh রিমাউন্ট (`navSeq` key)।
- মেনুর ভেতরের নির্দিষ্ট স্ক্রিনে সরাসরি যেতে **`goTo(menuIndex, sub)`** — যেমন রশিদ পেজ থেকে সরাসরি বেতন পোর্টাল খোলা (`sub` → মডিউলের `initialView`)।

---

## ৬. ডেটা নিরাপত্তা

সব ডেটা ইনস্টল ফোল্ডারের **বাইরে**:
```
DB, ছবি, ব্যাকআপ, config.json  →  userData / D:\...\Data
```
- প্রথম-রানে ইউজার লোকেশন বেছে নেয়।
- আপডেট (NSIS) শুধু অ্যাপ ফাইল প্রতিস্থাপন করে — ব্যবহারকারীর ডেটা কখনো স্পর্শ করে না।
- ছবি ফাইল হিসেবে সংরক্ষিত (`photos/`), প্রদর্শনে dataURL।

---

## ৭. অটো-আপডেট + প্রকাশ

- অ্যাপ খুললেই আপডেট চেক → থাকলে **আগে আপডেট, পরে খোলে** (forced-update splash gate)।
- নেট না থাকলে চেক নীরবে ব্যর্থ হয়, অ্যাপ স্বাভাবিক চলে।
- **প্রকাশে ৩টি ফাইল বাধ্যতামূলক** GitHub Release-এ:
  `MadrasaManagement-Setup-x.x.x.exe`, `.exe.blockmap`, `latest.yml`
- `latest.yml` = আপডেট সার্ভারের "সূচি"; electron-updater এটা পড়ে নতুন ভার্সন বোঝে।
- ভার্সন নীতি: **SemVer** (`MAJOR.MINOR.PATCH`) + প্রতি রিলিজে `CHANGELOG.md` আপডেট।

**বিল্ড কমান্ড:**
```
npm run electron:build      # dist (vite) + installer (electron-builder)
```

---

## ৮. যাচাই পদ্ধতি (headless verification)

শুধু কোড পড়ে নয় — প্রতিটি ফিচার **আসল অ্যাপ + অস্থায়ী DB**-তে লঞ্চ করে, UI ক্লিক/সেভ করে যাচাই:
> ০ কনসোল এরর **এবং** ডেটা সত্যিই সংরক্ষণ হয়ে তালিকায় ফিরে আসছে — দুটোই নিশ্চিত করা হয়।

---

## 🔁 নতুন অ্যাপ বানানোর ধাপ (সংক্ষেপে)

1. **Vite + React** স্ক্যাফোল্ড → **Electron shell** (main + preload) যোগ।
2. **`entities.cjs` + `makeCrud` + IPC জেনারেটর** বসাও — *এই ইঞ্জিনটাই আসল ভিত্তি*।
3. **`src/ui/` কিট** বানাও (একবার) — বাংলা IME + DataTable সহ।
4. প্রতিটি মেনু = একই মডিউল-প্যাটার্নে একটা কম্পোনেন্ট।
5. ডেটা **userData**-তে রাখো + ব্যাকআপ যোগ করো।
6. **electron-builder + electron-updater + GitHub Releases** → অটো-আপডেট।
7. প্রতিটি ফিচার headless লঞ্চ করে যাচাই করো।

---

## 📁 ফোল্ডার মানচিত্র

```
electron/
  main.cjs                 # main process
  preload.cjs              # নিরাপদ সেতু
  db/
    connection.cjs         # DB খোলা/বন্ধ
    schema.cjs             # PRAGMA user_version migration
    entities.cjs           # ← এন্টিটি সংজ্ঞা (এক জায়গা)
    repositories/*.cjs      # CRUD (auto + custom)
  ipc/*.cjs                # IPC হ্যান্ডলার
src/
  data/                    # React-এর ডেটা API (client.js transport + webAdapter fallback)
  ui/                      # UI কিট (একবার বানানো)
  modules/                 # প্রতিটি ফিচার-মডিউল (student, teacher, receipt, boarding, kitchen...)
  App.jsx                  # সাইডবার + রাউটার
electron-builder.yml       # ইনস্টলার + publish কনফিগ
CHANGELOG.md               # প্রতি রিলিজের পরিবর্তন
```

---

*Developed & Designed by Easy Coding Space · easycoding.space*
