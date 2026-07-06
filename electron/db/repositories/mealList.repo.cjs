// ────────────────────────────────────────────────────────────────
//  mealList.repo.cjs — Smart Meal List (READ-only, dynamic)।
//  প্রোফাইল − home-food − active pause − holiday(per-meal off) থেকে auto।
//  কোনো রো সংরক্ষণ হয় না; প্রতিবার গণনা করে ফেরত দেয়।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const photo = require("../../services/photo.service.cjs");

const MEAL_COL = { breakfast: "take_breakfast", lunch: "take_lunch", dinner: "take_dinner" };
const OFF_COL = { breakfast: "off_breakfast", lunch: "off_lunch", dinner: "off_dinner" };

function generate(date, mealType) {
  const db = getDb();
  const col = MEAL_COL[mealType] || "take_lunch";
  const offCol = OFF_COL[mealType] || "off_lunch";

  const holiday = db.get("SELECT title, off_breakfast, off_lunch, off_dinner FROM holidays WHERE h_date = ?", [date]);
  const mealOff = !!(holiday && holiday[offCol] === "1");

  const students = db.all("SELECT id, code, name, class, roll FROM students WHERE status <> 'নিষ্ক্রিয়' ORDER BY id ASC");
  const profiles = {};
  db.all("SELECT * FROM student_meal_profiles").forEach((p) => { profiles[p.student_id] = p; });
  const allocs = {};
  db.all("SELECT student, room_no, bed_no FROM bed_allocations").forEach((a) => { if (a.student) allocs[a.student] = a; });
  const paused = {};
  db.all("SELECT student_code FROM meal_pauses WHERE from_date <= ? AND to_date >= ?", [date, date]).forEach((r) => { paused[r.student_code] = true; });

  const rows = [];
  const summary = { total: 0, home: 0, paused: 0, guest: 0, special: 0, sick: 0 };

  for (const s of students) {
    const p = profiles[s.id] || {};
    if ((p[col] ?? "1") !== "1") continue;                 // এই বেলা নেয় না
    if ((p.meal_status || "active") !== "active") continue; // প্রোফাইল paused
    if ((p.home_food ?? "0") === "1") { summary.home++; continue; }
    if (paused[s.code]) { summary.paused++; continue; }
    if (mealOff) continue;                                  // ছুটির দিন এই বেলা বন্ধ

    const a = allocs[s.name] || {};
    const diet = p.diet_type || "normal";
    if (diet !== "normal") summary.special++;
    if (diet === "sick") summary.sick++;

    rows.push({
      id: s.id, code: s.code, name: s.name, class: s.class, section: "", roll: s.roll,
      room_no: a.room_no || "", bed_no: a.bed_no || "",
      meal_type: mealType, diet_type: diet, allergy: p.allergy || "", note: p.note || "",
      attendance: "pending", // Phase 5-এ প্রকৃত হাজিরা যুক্ত হবে
      photo: p.photo_path ? photo.readPhoto(p.photo_path) : null,
    });
    summary.total++;
  }

  return { rows, summary, holiday: mealOff ? { title: holiday.title } : null };
}

module.exports = { generate };
