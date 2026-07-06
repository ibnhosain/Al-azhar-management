// ────────────────────────────────────────────────────────────────
//  mealProfile.repo.cjs — ছাত্রের মিল প্রোফাইল (students ১:১)।
//  ছবি ফাইলে; রুম/বেড bed_allocations থেকে নাম মিলিয়ে (best-effort)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const photo = require("../../services/photo.service.cjs");

function indexAllocations(db) {
  const map = {};
  db.all("SELECT student, room_no, bed_no FROM bed_allocations").forEach((a) => {
    if (a.student) map[a.student] = a;
  });
  return map;
}

function listWithStudents() {
  const db = getDb();
  const students = db.all("SELECT id, code, name, class, roll, gender, status FROM students ORDER BY id ASC");
  const profiles = {};
  db.all("SELECT * FROM student_meal_profiles").forEach((p) => { profiles[p.student_id] = p; });
  const allocs = indexAllocations(db);

  return students.map((s) => {
    const p = profiles[s.id] || {};
    const a = allocs[s.name] || {};
    return {
      ...s,
      room_no: a.room_no || "",
      bed_no: a.bed_no || "",
      take_breakfast: p.take_breakfast ?? "1",
      take_lunch: p.take_lunch ?? "1",
      take_dinner: p.take_dinner ?? "1",
      home_food: p.home_food ?? "0",
      diet_type: p.diet_type || "normal",
      allergy: p.allergy || "",
      note: p.note || "",
      meal_status: p.meal_status || "active",
      photo_path: p.photo_path || null,
      photo: p.photo_path ? photo.readPhoto(p.photo_path) : null,
      has_profile: !!profiles[s.id],
    };
  });
}

function getByStudent(studentId) {
  const p = getDb().get("SELECT * FROM student_meal_profiles WHERE student_id = ?", [studentId]);
  if (!p) return null;
  return { ...p, photo: p.photo_path ? photo.readPhoto(p.photo_path) : null };
}

function upsert(studentId, data = {}) {
  const db = getDb();
  const existing = db.get("SELECT id, photo_path FROM student_meal_profiles WHERE student_id = ?", [studentId]);

  let photoPath = existing ? existing.photo_path : null;
  if (typeof data.photo === "string" && data.photo.startsWith("data:")) {
    if (photoPath) photo.deletePhoto(photoPath);
    photoPath = photo.savePhoto(studentId, data.photo);
  } else if (data.photo === "") {
    if (photoPath) photo.deletePhoto(photoPath);
    photoPath = null;
  }

  const vals = [
    data.take_breakfast ?? "1",
    data.take_lunch ?? "1",
    data.take_dinner ?? "1",
    data.home_food ?? "0",
    data.meal_status ?? "active",
    data.diet_type ?? "normal",
    data.allergy ?? null,
    data.note ?? null,
    photoPath,
  ];

  if (existing) {
    db.run(
      "UPDATE student_meal_profiles SET take_breakfast=?, take_lunch=?, take_dinner=?, home_food=?, meal_status=?, diet_type=?, allergy=?, note=?, photo_path=? WHERE student_id=?",
      [...vals, studentId]
    );
  } else {
    db.run(
      "INSERT INTO student_meal_profiles (take_breakfast, take_lunch, take_dinner, home_food, meal_status, diet_type, allergy, note, photo_path, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [...vals, studentId]
    );
  }
  return getByStudent(studentId);
}

module.exports = { listWithStudents, getByStudent, upsert };
