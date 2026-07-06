// ────────────────────────────────────────────────────────────────
//  kitchen.ipc.cjs — Kitchen module (Phase 1) IPC চ্যানেল।
// ────────────────────────────────────────────────────────────────
const { ipcMain } = require("electron");
const mealProfile = require("../db/repositories/mealProfile.repo.cjs");
const mealList = require("../db/repositories/mealList.repo.cjs");

function register() {
  ipcMain.handle("meal_profile:list", () => mealProfile.listWithStudents());
  ipcMain.handle("meal_profile:get", (_e, studentId) => mealProfile.getByStudent(studentId));
  ipcMain.handle("meal_profile:upsert", (_e, { studentId, data }) => mealProfile.upsert(studentId, data));
  ipcMain.handle("meal_list:generate", (_e, { date, mealType }) => mealList.generate(date, mealType));
}

module.exports = { register };
