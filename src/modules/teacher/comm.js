// ────────────────────────────────────────────────────────────────
//  comm.js — WhatsApp / Email / SMS লিংক তৈরির বিশুদ্ধ ফাংশন।
// ────────────────────────────────────────────────────────────────
const toEn = (s) => String(s ?? "").replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));

// বাংলাদেশি নম্বর → আন্তর্জাতিক (880…) ফরম্যাট
export function bdPhone(raw) {
  const d = toEn(raw).replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("880")) return d;
  if (d.startsWith("0")) return "88" + d;      // 01712… → 8801712…
  if (d.length === 10) return "880" + d;        // 1712345678 → 8801712345678
  return d;
}

export const waUrl = (num, msg) => `https://wa.me/${bdPhone(num)}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
export const mailUrl = (email, subject, body) => `mailto:${email}?subject=${encodeURIComponent(subject || "")}&body=${encodeURIComponent(body || "")}`;
export const smsUrl = (num, msg) => `sms:${bdPhone(num)}${msg ? `?body=${encodeURIComponent(msg)}` : ""}`;
