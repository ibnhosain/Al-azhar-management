// ────────────────────────────────────────────────────────────────
//  teacherDocument.repo.cjs — শিক্ষক ডকুমেন্ট (metadata + ফাইল)।
//  ফাইল ডিস্কে document.service দিয়ে; এই repo শুধু DB সারি রাখে।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("../connection.cjs");
const docSvc = require("../../services/document.service.cjs");

function list(teacherId) {
  return getDb().all("SELECT * FROM teacher_documents WHERE teacher_id = ? ORDER BY id DESC", [teacherId]);
}

function getById(id) {
  return getDb().get("SELECT * FROM teacher_documents WHERE id = ?", [id]);
}

// data: { teacher_id, doc_type, title, file_name, mime, size, data(dataURL) }
function add(data = {}) {
  const stored = data.data ? docSvc.saveDocument(data.data, data.file_name) : null;
  const db = getDb();
  const res = db.run(
    `INSERT INTO teacher_documents (teacher_id, doc_type, title, original_name, stored_name, mime, size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.teacher_id || null, data.doc_type || "other", data.title || null,
      data.file_name || null, stored, data.mime || null, Number(data.size) || 0]
  );
  return getById(Number(res.lastInsertRowid));
}

function remove(id) {
  const row = getById(id);
  if (row && row.stored_name) docSvc.deleteDocument(row.stored_name);
  getDb().run("DELETE FROM teacher_documents WHERE id = ?", [id]);
  return { id };
}

// OS ডিফল্ট অ্যাপে ফাইল খোলার জন্য পূর্ণ পাথ
function fullPath(id) {
  const row = getById(id);
  return row ? docSvc.docFullPath(row.stored_name) : null;
}

module.exports = { list, getById, add, remove, fullPath };
