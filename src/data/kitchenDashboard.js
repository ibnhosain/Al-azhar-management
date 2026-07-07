// ────────────────────────────────────────────────────────────────
//  kitchenDashboard.js — রান্নাঘর ড্যাশবোর্ড সারাংশ Data API।
// ────────────────────────────────────────────────────────────────
import { call } from "./client";

export const kitchenDashboard = {
  overview: () => call("kitchen_dash:overview"),
};
