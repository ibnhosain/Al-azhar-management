// ────────────────────────────────────────────────────────────────
//  dish.repo.cjs — পদ (dish) CRUD + ছবি (ফাইলে, DB-তে শুধু পাথ)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const photo = require("../../services/photo.service.cjs");

function num(v) { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }

function withPhoto(row) {
  if (!row) return row;
  return { ...row, photo: row.photo_path ? photo.readPhoto(row.photo_path) : null };
}

function getById(id) {
  return withPhoto(getDb().get("SELECT * FROM dishes WHERE id = ?", [id]));
}

// data.photo: dataURL → নতুন সেভ; "" → মুছে ফেলা; নাহলে অপরিবর্তিত।
function resolvePhoto(data, existingPath) {
  let p = existingPath || null;
  if (typeof data.photo === "string" && data.photo.startsWith("data:")) {
    if (p) photo.deletePhoto(p);
    p = photo.savePhoto("dish", data.photo);
  } else if (data.photo === "") {
    if (p) photo.deletePhoto(p);
    p = null;
  }
  return p;
}

const vals = (data, photoPath) => [
  data.name, data.category || null, data.meal_type || "any",
  num(data.prep_time), num(data.cook_time), data.serving_type || null,
  data.description || null, data.active ?? "1", photoPath,
];

module.exports = {
  list() {
    return getDb().all("SELECT * FROM dishes ORDER BY id ASC").map(withPhoto);
  },
  getById,
  create(data) {
    const photoPath = resolvePhoto(data, null);
    const res = getDb().run(
      "INSERT INTO dishes (name, category, meal_type, prep_time, cook_time, serving_type, description, active, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      vals(data, photoPath)
    );
    return getById(Number(res.lastInsertRowid));
  },
  update(id, data) {
    const ex = getDb().get("SELECT photo_path FROM dishes WHERE id = ?", [id]);
    const photoPath = resolvePhoto(data, ex ? ex.photo_path : null);
    getDb().run(
      "UPDATE dishes SET name=?, category=?, meal_type=?, prep_time=?, cook_time=?, serving_type=?, description=?, active=?, photo_path=? WHERE id=?",
      [...vals(data, photoPath), id]
    );
    return getById(id);
  },
  remove(id) {
    const ex = getDb().get("SELECT photo_path FROM dishes WHERE id = ?", [id]);
    if (ex && ex.photo_path) photo.deletePhoto(ex.photo_path);
    getDb().run("DELETE FROM dishes WHERE id = ?", [id]);
    return { id };
  },
};
