// ────────────────────────────────────────────────────────────────
//  update.config.cjs — Auto Update feed provider (configurable)।
//  এখন: GitHub Releases। পরে custom update server-এ migrate করা সহজ —
//  শুধু এই ফাইল সম্পাদনা করুন অথবা env দিন; অ্যাপের অন্য কোথাও হাত পড়বে না।
//
//  custom server:  UPDATE_PROVIDER=generic  UPDATE_URL=https://updates.example.com
// ────────────────────────────────────────────────────────────────
const GITHUB = { provider: "github", owner: "ibnhosain", repo: "Al-Azhar-management" };

function getProvider() {
  if (process.env.UPDATE_PROVIDER === "generic" && process.env.UPDATE_URL) {
    return { provider: "generic", url: process.env.UPDATE_URL };
  }
  return GITHUB;
}

module.exports = { getProvider };
