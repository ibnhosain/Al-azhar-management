// ────────────────────────────────────────────────────────────────
//  boardingExpense.repo.cjs — বোর্ডিং খরচ (সাধারণ CRUD, factory দিয়ে)।
// ────────────────────────────────────────────────────────────────
const { createRepository } = require("../repository.factory.cjs");

// institution_id ইচ্ছাকৃতভাবে বাদ — টেবিলে DEFAULT 1 বসবে (multi-institution future-ready)।
module.exports = createRepository("boarding_expense", [
  "expense_no", "date", "category", "description", "amount", "paid_by", "approved_by", "remarks",
]);
