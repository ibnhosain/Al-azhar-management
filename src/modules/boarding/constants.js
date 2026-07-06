// বোর্ডিং মডিউলের সাধারণ ধ্রুবক ও হেল্পার
export const EXPENSE_CATEGORIES = [
  "খাবার", "চাল", "সবজি", "মাছ", "মাংস", "গ্যাস", "বিদ্যুৎ",
  "পানি", "পরিষ্কার", "রক্ষণাবেক্ষণ", "ঔষধ", "পরিবহন", "অন্যান্য",
];
export const UNITS = ["কেজি", "গ্রাম", "লিটার", "পিস", "হালি", "ডজন", "বস্তা", "মিশ্র"];
export const FUNDS = ["বোর্ডিং", "সাধারণ", "যাকাত", "সদকা"];

const bnDigit = (s) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
export const bn = bnDigit;
export const taka = (n) => "৳" + bnDigit(Number(n || 0).toLocaleString("en-IN"));
export const todayISO = () => new Date().toISOString().slice(0, 10);
