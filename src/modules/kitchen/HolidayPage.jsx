import CrudPage from "../boarding/CrudPage";
import { Badge } from "../../ui";
import { holidays } from "../../data";

const offBadge = (v) => <Badge color={v === "1" ? "#E53935" : "#2E7D32"}>{v === "1" ? "বন্ধ" : "চালু"}</Badge>;

export default function HolidayPage(props) {
  return (
    <CrudPage {...props} title="ছুটির ক্যালেন্ডার" description="ছুটির দিন নির্দিষ্ট বেলার মিল স্বয়ংক্রিয় বন্ধ থাকবে" api={holidays} resourceKey="holidays"
      addLabel="নতুন ছুটি" emptyTitle="কোনো ছুটি নেই"
      columns={[
        { key: "h_date", label: "তারিখ", sortable: true },
        { key: "holiday_type", label: "ধরন", render: (r) => <Badge color="#6A1B9A">{r.holiday_type || "—"}</Badge>, exportValue: (r) => r.holiday_type },
        { key: "title", label: "বিবরণ" },
        { key: "off_breakfast", label: "সকাল", align: "center", render: (r) => offBadge(r.off_breakfast), exportValue: (r) => r.off_breakfast },
        { key: "off_lunch", label: "দুপুর", align: "center", render: (r) => offBadge(r.off_lunch), exportValue: (r) => r.off_lunch },
        { key: "off_dinner", label: "রাত", align: "center", render: (r) => offBadge(r.off_dinner), exportValue: (r) => r.off_dinner },
        { key: "note", label: "নোট" },
      ]}
      fields={[
        { key: "h_date", label: "তারিখ", type: "date", required: true },
        { key: "holiday_type", label: "ছুটির ধরন", type: "select", options: ["সাপ্তাহিক", "সরকারি", "ধর্মীয়", "প্রাতিষ্ঠানিক", "অন্যান্য"], default: "সাপ্তাহিক" },
        { key: "title", label: "বিবরণ", required: true, full: true },
        { key: "off_breakfast", label: "সকাল বন্ধ?", type: "select", options: [{ value: "1", label: "বন্ধ" }, { value: "0", label: "চালু" }], default: "1" },
        { key: "off_lunch", label: "দুপুর বন্ধ?", type: "select", options: [{ value: "1", label: "বন্ধ" }, { value: "0", label: "চালু" }], default: "1" },
        { key: "off_dinner", label: "রাত বন্ধ?", type: "select", options: [{ value: "1", label: "বন্ধ" }, { value: "0", label: "চালু" }], default: "1" },
        { key: "note", label: "নোট (Manual Override তথ্য)", type: "textarea", full: true },
      ]}
    />
  );
}
