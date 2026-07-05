// ────────────────────────────────────────────────────────────────
//  repository.factory.cjs — যেকোনো টেবিলের জন্য স্ট্যান্ডার্ড CRUD তৈরি করে।
//  একই প্যাটার্ন সব এন্টিটিতে পুনঃব্যবহৃত হয় (modular, DRY)।
// ────────────────────────────────────────────────────────────────
const { getDb } = require("./connection.cjs");

function createRepository(table, columns) {
  const allCols = `id, ${columns.join(", ")}, created_at`;
  const placeholders = columns.map(() => "?").join(", ");
  const setClause = columns.map((c) => `${c} = ?`).join(", ");
  const valuesOf = (data) => columns.map((c) => (data[c] === undefined ? null : data[c]));

  function getById(id) {
    return getDb().get(`SELECT ${allCols} FROM ${table} WHERE id = ?`, [id]);
  }

  return {
    list() {
      return getDb().all(`SELECT ${allCols} FROM ${table} ORDER BY id ASC`);
    },
    getById,
    create(data) {
      const res = getDb().run(
        `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
        valuesOf(data)
      );
      return getById(Number(res.lastInsertRowid));
    },
    update(id, data) {
      getDb().run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...valuesOf(data), id]);
      return getById(id);
    },
    remove(id) {
      getDb().run(`DELETE FROM ${table} WHERE id = ?`, [id]);
      return { id };
    },
  };
}

module.exports = { createRepository };
