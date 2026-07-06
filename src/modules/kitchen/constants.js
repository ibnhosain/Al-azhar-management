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
