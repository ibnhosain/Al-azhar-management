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
};

function insertRow(db, table, row) {
  const keys = Object.keys(row);
  const placeholders = keys.map(() => "?").join(", ");
  db.run(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
    keys.map((k) => row[k])
  );
}

function seedIfEmpty(db) {
  for (const [table, rows] of Object.entries(seedData)) {
    const count = db.get(`SELECT COUNT(*) AS c FROM ${table}`).c;
    if (count === 0) {
      for (const row of rows) insertRow(db, table, row);
    }
  }
}

module.exports = { seedIfEmpty, seedData };
