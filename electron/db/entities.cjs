// ────────────────────────────────────────────────────────────────
//  entities.cjs — সাধারণ CRUD এন্টিটির টেবিল ও কলাম (single source of truth)।
//  এখানে একটি এন্ট্রি যোগ করলেই: টেবিল (schema v2), repository, ও IPC চ্যানেল
//  স্বয়ংক্রিয়ভাবে তৈরি হয়। (students/teachers আলাদা রাখা হয়েছে — schema v1।)
//  সব কলাম TEXT (nullable); বাধ্যবাধকতা UI-তে যাচাই হয়।
// ────────────────────────────────────────────────────────────────
module.exports = {
  receipts: ["code", "student", "class", "roll", "type", "amount", "date", "status"],
  expenses: ["code", "title", "amount", "date", "category"],
  notices:  ["title", "priority", "body", "date"],
  boarding: ["code", "name", "room", "floor", "fee", "status"],
  sponsors: ["code", "name", "phone", "amount", "type", "date"],
  loans:    ["code", "name", "amount", "due", "date", "status"],
  orphans:  ["code", "orphan", "sponsor", "amount", "month", "status"],
};
