// রান্নাঘর মডিউলের সাধারণ ধ্রুবক ও হেল্পার
export const bn = (s) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const MEALS = [
  { key: "breakfast", label: "সকালের নাস্তা", short: "সকাল", icon: "🌅" },
  { key: "lunch", label: "দুপুর", short: "দুপুর", icon: "🍚" },
  { key: "dinner", label: "রাত", short: "রাত", icon: "🌙" },
];

export const DIET_TYPES = [
  { value: "normal", label: "সাধারণ" },
  { value: "special", label: "বিশেষ ডায়েট" },
  { value: "sick", label: "অসুস্থ ডায়েট" },
  { value: "vip", label: "VIP" },
];

export const PAUSE_REASONS = ["ছুটি", "অসুস্থ", "বাড়ি", "অন্যান্য"];

// ৳ ফরম্যাট (বাংলা সংখ্যা, ২ দশমিক পর্যন্ত, অপ্রয়োজনে .00 বাদ)
export const taka = (n) => {
  const v = Number(n || 0);
  const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
  return "৳" + bn(s);
};

// ── Phase 2: রান্নাঘর পরিকল্পনা ধ্রুবক ──
export const INGREDIENT_CATEGORIES = ["চাল", "ডাল", "মাছ", "মাংস", "সবজি", "মসলা", "তেল", "দুধ", "ডিম", "ফল", "পানীয়", "ফ্রোজেন", "অন্যান্য"];
export const DISH_CATEGORIES = ["ভাত", "তরকারি", "ভর্তা", "ডাল", "মাছ", "মাংস", "নাস্তা", "মিষ্টি", "পানীয়", "অন্যান্য"];
export const UNITS = ["কেজি", "গ্রাম", "লিটার", "মিলি", "পিস", "ডজন", "বস্তা", "প্যাকেট"];
export const SERVING_TYPES = ["জনপ্রতি", "বাটি", "প্লেট", "গ্লাস", "পিস"];

// পদের বেলা: নির্দিষ্ট বেলা বা "সব বেলা"
export const DISH_MEAL_OPTIONS = [
  { value: "any", label: "সব বেলা" },
  ...MEALS.map((m) => ({ value: m.key, label: m.label })),
];

// মেনুর ধরন — Daily/Ramadan/Eid/Special + Template
export const MENU_TYPES = [
  { value: "normal", label: "সাধারণ" },
  { value: "ramadan", label: "রমজান" },
  { value: "eid", label: "ঈদ" },
  { value: "special", label: "বিশেষ ইভেন্ট" },
  { value: "template", label: "টেমপ্লেট" },
];
export const menuTypeLabel = (v) => (MENU_TYPES.find((t) => t.value === v) || MENU_TYPES[0]).label;
export const mealLabel = (v) => { const m = MEALS.find((x) => x.key === v); return m ? m.label : (v === "any" ? "সব বেলা" : v); };

// ── Phase 3: কিচেন স্টোর / ক্রয় ধ্রুবক ──
export const TXN_TYPES = [
  { value: "in", label: "স্টক ইন", color: "#2E7D32", sign: 1 },
  { value: "out", label: "স্টক আউট", color: "#E53935", sign: -1 },
  { value: "adjust", label: "সমন্বয়", color: "#0288D1", sign: 1 },
];
export const TXN_SOURCES = [
  { value: "purchase", label: "ক্রয়" },
  { value: "consumption", label: "খরচ / রান্না" },
  { value: "waste", label: "অপচয়" },
  { value: "manual", label: "ম্যানুয়াল" },
];
export const txnTypeLabel = (v) => (TXN_TYPES.find((t) => t.value === v) || {}).label || v;
export const txnTypeColor = (v) => (TXN_TYPES.find((t) => t.value === v) || {}).color || "#607D8B";
export const txnSourceLabel = (v) => (TXN_SOURCES.find((t) => t.value === v) || {}).label || v;

// ছবি ছোট thumbnail-এ resize করে dataURL (renderer-এ, native lib ছাড়া)
export function resizeImage(file, max = 220) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
