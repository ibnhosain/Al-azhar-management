// ────────────────────────────────────────────────────────────────
//  seed.cjs — প্রথম রানে (নতুন DB) ডেমো ডেটা বসানো।
//  প্রতিটি টেবিল খালি থাকলেই কেবল insert করে (idempotent)।
//  ব্যবহারকারী পরে নিজের ডেটা যোগ করলে এটি আর কিছু করে না।
//  নোট: notices বিপরীত ক্রমে seed করা — UI নতুন নোটিশ উপরে দেখায় (id DESC)।
// ────────────────────────────────────────────────────────────────

const seedData = {
  students: [
    { code: "STD-001", name: "মোঃ আরিফ হোসেন", class: "নার্সারি গ্রুপ", roll: "০১", gender: "ছাত্র", fee: "৳৫০০", status: "সক্রিয়" },
    { code: "STD-002", name: "ফাতেমা বেগম", class: "১ম শ্রেণি", roll: "০২", gender: "ছাত্রী", fee: "৳৬০০", status: "সক্রিয়" },
    { code: "STD-003", name: "মোঃ রাফি আহমেদ", class: "২য় শ্রেণি", roll: "০৩", gender: "ছাত্র", fee: "৳৭০০", status: "সক্রিয়" },
    { code: "STD-004", name: "সুমাইয়া আক্তার", class: "নার্সারি গ্রুপ", roll: "০৪", gender: "ছাত্রী", fee: "৳৫০০", status: "নিষ্ক্রিয়" },
    { code: "STD-005", name: "মোঃ ইমরান খান", class: "১ম বর্ষ", roll: "০৫", gender: "ছাত্র", fee: "৳৮০০", status: "সক্রিয়" },
  ],
  teachers: [
    { code: "TCH-001", name: "মোঃ আবদুল করিম", subject: "আরবি", phone: "01711-000001", salary: "৳১৫,০০০", status: "সক্রিয়" },
    { code: "TCH-002", name: "মোছা. রহিমা খাতুন", subject: "বাংলা", phone: "01711-000002", salary: "৳১২,০০০", status: "সক্রিয়" },
    { code: "TCH-003", name: "মোঃ সালাহউদ্দিন", subject: "গণিত", phone: "01711-000003", salary: "৳১৩,০০০", status: "সক্রিয়" },
    { code: "TCH-004", name: "মোছা. নাজমা বেগম", subject: "ইংরেজি", phone: "01711-000004", salary: "৳১২,৫০০", status: "ছুটিতে" },
    { code: "TCH-005", name: "মোঃ হাফিজুর রহমান", subject: "হাদিস", phone: "01711-000005", salary: "৳১৪,০০০", status: "সক্রিয়" },
  ],
  receipts: [
    { code: "RCP-001", student: "মোঃ আরিফ হোসেন", type: "বেতন", amount: "৳৫০০", date: "০১/০৬/২০২৬", status: "পরিশোধিত" },
    { code: "RCP-002", student: "ফাতেমা বেগম", type: "ভর্তি", amount: "৳৯৫", date: "০২/০৬/২০২৬", status: "পরিশোধিত" },
    { code: "RCP-003", student: "মোঃ রাফি আহমেদ", type: "বেতন", amount: "৳৭০০", date: "০৩/০৬/২০২৬", status: "বকেয়া" },
    { code: "RCP-004", student: "মোঃ ইমরান খান", type: "বোর্ডিং", amount: "৳৮০০", date: "০৪/০৬/২০২৬", status: "পরিশোধিত" },
  ],
  expenses: [
    { code: "EXP-001", title: "শিক্ষক বেতন", amount: "৳১৫,০০০", date: "০১/০৬/২০২৬", category: "বেতন" },
    { code: "EXP-002", title: "বিদ্যুৎ বিল", amount: "৳৯০", date: "০২/০৬/২০২৬", category: "ইউটিলিটি" },
    { code: "EXP-003", title: "পরিষ্কার সামগ্রী", amount: "৳৩০০", date: "০৩/০৬/২০২৬", category: "রক্ষণাবেক্ষণ" },
  ],
  // বিপরীত ক্রমে (UI id DESC-এ দেখায় → মূল ক্রম ফিরে আসে)
  notices: [
    { title: "মাসিক বেতন পরিশোধের নোটিশ", priority: "গুরুত্বপূর্ণ", body: "জুন মাসের বেতন ১০ তারিখের মধ্যে পরিশোধ করতে হবে।", date: "০১/০৬/২০২৬" },
    { title: "ঈদুল আযহার ছুটি", priority: "সাধারণ", body: "ঈদুল আযহা উপলক্ষে ৫ দিন ছুটি থাকবে।", date: "০৩/০৬/২০২৬" },
    { title: "বার্ষিক পরীক্ষার সময়সূচি", priority: "জরুরি", body: "আগামী ১৫ জুন থেকে বার্ষিক পরীক্ষা শুরু হবে।", date: "০৫/০৬/২০২৬" },
  ],
  boarding: [
    { code: "BRD-001", name: "মোঃ আরিফ হোসেন", room: "A-১০১", floor: "১ম তলা", fee: "৳৮০০", status: "সক্রিয়" },
    { code: "BRD-002", name: "মোঃ ইমরান খান", room: "A-১০২", floor: "১ম তলা", fee: "৳৮০০", status: "সক্রিয়" },
    { code: "BRD-003", name: "মোঃ রাফি আহমেদ", room: "B-২০১", floor: "২য় তলা", fee: "৳৯০০", status: "বকেয়া" },
  ],
  sponsors: [
    { code: "SPN-001", name: "হাজী মোঃ করিম", phone: "01800-000001", amount: "৳৫,০০০", type: "মাসিক", date: "০১/০৬/২০২৬" },
    { code: "SPN-002", name: "মোছা. আমেনা বেগম", phone: "01800-000002", amount: "৳২,০০০", type: "এককালীন", date: "০২/০৬/২০২৬" },
    { code: "SPN-003", name: "মোঃ রহিম উদ্দিন", phone: "01800-000003", amount: "৳৩,০০০", type: "মাসিক", date: "০৩/০৬/২০২৬" },
  ],
  loans: [
    { code: "LN-001", name: "মোঃ আরিফ হোসেন", amount: "৳২,০০০", due: "৳৫০০", date: "০১/০৬/২০২৬", status: "বকেয়া" },
    { code: "LN-002", name: "ফাতেমা বেগম", amount: "৳১,৫০০", due: "৳০", date: "০২/০৬/২০২৬", status: "পরিশোধিত" },
  ],
  orphans: [
    { code: "ORP-001", orphan: "মোঃ সাইফুল ইসলাম", sponsor: "হাজী মোঃ করিম", amount: "৳১,০০০", month: "জুন ২০২৬", status: "পরিশোধিত" },
    { code: "ORP-002", orphan: "মোছা. হালিমা বেগম", sponsor: "মোঃ রহিম উদ্দিন", amount: "৳৮০০", month: "জুন ২০২৬", status: "বকেয়া" },
  ],
  rooms: [
    { room_no: "A-১০১", floor: "১ম তলা", capacity: "৪", type: "আবাসিক", status: "সক্রিয়" },
    { room_no: "A-১০২", floor: "১ম তলা", capacity: "৪", type: "আবাসিক", status: "সক্রিয়" },
    { room_no: "B-২০১", floor: "২য় তলা", capacity: "৬", type: "আবাসিক", status: "সক্রিয়" },
  ],
  meals: [
    { date: "2026-07-06", meal_type: "দুপুর", menu: "ভাত, মাছ, ডাল, সবজি", cost: "3500", notes: "" },
    { date: "2026-07-06", meal_type: "রাত", menu: "ভাত, ডিম, ভর্তা", cost: "2500", notes: "" },
  ],
  academic_results: [
    { student: "মোঃ আরিফ হোসেন", class: "নার্সারি গ্রুপ", roll: "০১", bangla: "85", arabic: "90", math: "78", total: "253", grade: "A+" },
    { student: "ফাতেমা বেগম", class: "১ম শ্রেণি", roll: "০২", bangla: "72", arabic: "80", math: "68", total: "220", grade: "A" },
    { student: "মোঃ রাফি আহমেদ", class: "২য় শ্রেণি", roll: "০৩", bangla: "60", arabic: "70", math: "55", total: "185", grade: "B" },
  ],
  exam_routine: [
    { exam_date: "১৫/০৬/২০২৬", day: "রবিবার", subject: "বাংলা", time_slot: "সকাল ৯টা–১১টা", class: "সকল শ্রেণি" },
    { exam_date: "১৭/০৬/২০২৬", day: "মঙ্গলবার", subject: "আরবি", time_slot: "সকাল ৯টা–১১টা", class: "সকল শ্রেণি" },
    { exam_date: "১৯/০৬/২০২৬", day: "বৃহস্পতিবার", subject: "গণিত", time_slot: "সকাল ৯টা–১১টা", class: "সকল শ্রেণি" },
    { exam_date: "২২/০৬/২০২৬", day: "রবিবার", subject: "ইসলাম", time_slot: "সকাল ৯টা–১১টা", class: "সকল শ্রেণি" },
    { exam_date: "২৪/০৬/২০২৬", day: "মঙ্গলবার", subject: "ইংরেজি", time_slot: "সকাল ৯টা–১১টা", class: "সকল শ্রেণি" },
  ],
  promotions: [
    { student: "মোঃ আরিফ হোসেন", from_class: "নার্সারি গ্রুপ", to_class: "১ম শ্রেণি", year: "২০২৬", status: "প্রমোশনপ্রাপ্ত" },
    { student: "ফাতেমা বেগম", from_class: "১ম শ্রেণি", to_class: "২য় শ্রেণি", year: "২০২৬", status: "অপেক্ষমান" },
  ],
  staff: [
    { name: "মোঃ আবদুল মতিন", role: "অফিস সহায়ক", phone: "01711-111111", status: "সক্রিয়" },
    { name: "মোছা. রাহেলা বেগম", role: "হিসাবরক্ষক", phone: "01711-222222", status: "সক্রিয়" },
  ],
};

function insertRow(db, table, row) {
  const keys = Object.keys(row);
  const placeholders = keys.map(() => "?").join(", ");
  db.run(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
    keys.map((k) => row[k])
  );
}

// Boarding module ডেমো ডেটা (header+items সহ বাজার — তাই আলাদা)
function seedBoarding(db) {
  if (db.get("SELECT COUNT(*) AS c FROM boarding_bazar").c === 0) {
    const purchases = [
      { date: "2026-07-03", fund: "বোর্ডিং", by: "পরিচালক", items: [{ n: "কাচা বাজার (ডিম, তেল, আলু, পেঁয়াজ)", u: "মিশ্র", q: 1, p: 1710 }] },
      { date: "2026-06-30", fund: "বোর্ডিং", by: "পরিচালক", items: [{ n: "চাল", u: "৫০ কেজি", q: 1, p: 2000 }] },
      { date: "2026-06-30", fund: "বোর্ডিং", by: "পরিচালক", items: [{ n: "বিরিয়ানির বাজার", u: "মিশ্র", q: 1, p: 1100 }] },
      { date: "2026-06-27", fund: "বোর্ডিং", by: "পরিচালক", items: [{ n: "মাছ", u: "কেজি", q: 10, p: 55 }] },
    ];
    let no = 0;
    for (const pur of purchases) {
      const total = pur.items.reduce((s, i) => s + i.q * i.p, 0);
      const res = db.run(
        "INSERT INTO boarding_bazar (purchase_no, date, fund, purchased_by, total) VALUES (?, ?, ?, ?, ?)",
        [String(++no), pur.date, pur.fund, pur.by, total]
      );
      const id = Number(res.lastInsertRowid);
      for (const it of pur.items) {
        db.run(
          "INSERT INTO boarding_bazar_items (bazar_id, item_name, unit, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
          [id, it.n, it.u, it.q, it.p, it.q * it.p]
        );
      }
    }
  }

  if (db.get("SELECT COUNT(*) AS c FROM boarding_expense").c === 0) {
    const exps = [
      { expense_no: "1", date: "2026-07-01", category: "গ্যাস", description: "রান্নার গ্যাস", amount: 1200, paid_by: "পরিচালক", approved_by: "প্রধান শিক্ষক" },
      { expense_no: "2", date: "2026-07-02", category: "বিদ্যুৎ", description: "বিদ্যুৎ বিল", amount: 900, paid_by: "পরিচালক", approved_by: "প্রধান শিক্ষক" },
      { expense_no: "3", date: "2026-07-03", category: "পরিষ্কার", description: "পরিষ্কার সামগ্রী", amount: 300, paid_by: "পরিচালক", approved_by: "" },
    ];
    for (const e of exps) {
      db.run(
        "INSERT INTO boarding_expense (expense_no, date, category, description, amount, paid_by, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [e.expense_no, e.date, e.category, e.description, e.amount, e.paid_by, e.approved_by]
      );
    }
  }
}

function seedIfEmpty(db) {
  for (const [table, rows] of Object.entries(seedData)) {
    const count = db.get(`SELECT COUNT(*) AS c FROM ${table}`).c;
    if (count === 0) {
      for (const row of rows) insertRow(db, table, row);
    }
  }
  seedBoarding(db);
}

module.exports = { seedIfEmpty, seedData };
