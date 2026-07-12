// ────────────────────────────────────────────────────────────────
//  teachers.repo.cjs — teachers টেবিলের CRUD (Repository)।
//  core কলাম: code/name/subject/phone/salary/status
//  বাড়তি তথ্য (পদবি/যোগ্যতা/ইমেইল/যোগদান/ঠিকানা/ছবি) → `extra` JSON কলামে।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const photo = require("../../services/photo.service.cjs");

const SEL = "id, code, name, subject, phone, salary, status, extra, created_at";
const CORE = ["id", "code", "name", "subject", "phone", "salary", "status", "created_at", "extra", "photo"];

function parseExtra(s) { try { return s ? JSON.parse(s) : {}; } catch { return {}; } }

function decorate(row) {
  if (!row) return row;
  const extra = parseExtra(row.extra);
  const { extra: _drop, ...core } = row;
  const merged = { ...extra, ...core };
  merged.photo = extra.photo_path ? photo.readPhoto(extra.photo_path) : null;
  delete merged.extra;
  return merged;
}

function buildExtra(data, prevExtra) {
  const extra = { ...(prevExtra || {}) };
  for (const k of Object.keys(data)) {
    if (CORE.includes(k)) continue;
    extra[k] = data[k];
  }
  if (typeof data.photo === "string" && data.photo.startsWith("data:")) {
    if (extra.photo_path) photo.deletePhoto(extra.photo_path);
    extra.photo_path = photo.savePhoto("teacher", data.photo);
  } else if (data.photo === "") {
    if (extra.photo_path) photo.deletePhoto(extra.photo_path);
    extra.photo_path = null;
  }
  return extra;
}

function list() {
  return getDb().all(`SELECT ${SEL} FROM teachers ORDER BY id ASC`).map(decorate);
}

function getById(id) {
  return decorate(getDb().get(`SELECT ${SEL} FROM teachers WHERE id = ?`, [id]));
}

function create(data) {
  const db = getDb();
  const extra = buildExtra(data, {});
  const res = db.run(
    "INSERT INTO teachers (code, name, subject, phone, salary, status, extra) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [data.code ?? null, data.name, data.subject ?? null, data.phone ?? null, data.salary ?? null, data.status ?? "সক্রিয়", JSON.stringify(extra)]
  );
  return getById(Number(res.lastInsertRowid));
}

function update(id, data) {
  const db = getDb();
  const cur = db.get("SELECT extra FROM teachers WHERE id = ?", [id]);
  const extra = buildExtra(data, parseExtra(cur && cur.extra));
  db.run(
    "UPDATE teachers SET code = ?, name = ?, subject = ?, phone = ?, salary = ?, status = ?, extra = ? WHERE id = ?",
    [data.code ?? null, data.name, data.subject ?? null, data.phone ?? null, data.salary ?? null, data.status ?? "সক্রিয়", JSON.stringify(extra), id]
  );
  return getById(id);
}

function remove(id) {
  const cur = getDb().get("SELECT extra FROM teachers WHERE id = ?", [id]);
  const ex = parseExtra(cur && cur.extra);
  if (ex.photo_path) { try { photo.deletePhoto(ex.photo_path); } catch { /* ignore */ } }
  getDb().run("DELETE FROM teachers WHERE id = ?", [id]);
  return { id };
}

module.exports = { list, getById, create, update, remove };
