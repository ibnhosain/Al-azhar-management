import CrudPage from "../boarding/CrudPage";
import { Badge, Button } from "../../ui";
import { ingredients } from "../../data";
import { INGREDIENT_CATEGORIES, UNITS, taka } from "./constants";
import { printDoc, tableHtml } from "./print";

const ACTIVE_OPTS = [{ value: "1", label: "সক্রিয়" }, { value: "0", label: "নিষ্ক্রিয়" }];

async function printList() {
  const rows = await ingredients.list();
  const body = tableHtml(
    ["#", "নাম (বাংলা)", "English", "ক্যাটাগরি", "একক", "গড় মূল্য", "ন্যূনতম স্টক", "অবস্থা"],
    rows.map((r, i) => [i + 1, r.name_bn, r.name_en || "", r.category || "", r.unit || "", taka(r.avg_cost), r.min_stock ?? 0, r.active === "1" ? "সক্রিয়" : "নিষ্ক্রিয়"]),
    ["center", "left", "left", "left", "center", "right", "right", "center"]
  );
  printDoc("উপকরণ তালিকা", body, { subtitle: `মোট ${rows.length} উপকরণ` });
}

export default function Ingredients(props) {
  return (
    <CrudPage {...props} title="উপকরণ মাস্টার" description="রান্নার উপকরণ, একক, গড় মূল্য ও ন্যূনতম স্টক (Kitchen Store-এর জন্য future-ready)"
      api={ingredients} resourceKey="ingredient" addLabel="নতুন উপকরণ" emptyTitle="কোনো উপকরণ নেই"
      headerExtra={<Button variant="secondary" onClick={printList} icon="🖨">তালিকা প্রিন্ট</Button>}
      columns={[
        { key: "name_bn", label: "নাম", sortable: true },
        { key: "name_en", label: "English", render: (r) => r.name_en || "—" },
        { key: "category", label: "ক্যাটাগরি", render: (r) => r.category ? <Badge color="#00838F">{r.category}</Badge> : "—", exportValue: (r) => r.category },
        { key: "unit", label: "একক", align: "center" },
        { key: "avg_cost", label: "গড় মূল্য", align: "right", render: (r) => taka(r.avg_cost), exportValue: (r) => r.avg_cost },
        { key: "min_stock", label: "ন্যূনতম স্টক", align: "right", render: (r) => r.min_stock ?? 0 },
        { key: "active", label: "অবস্থা", align: "center", render: (r) => r.active === "1" ? <Badge color="#2E7D32">সক্রিয়</Badge> : <Badge color="#90A4AE">নিষ্ক্রিয়</Badge>, exportValue: (r) => r.active === "1" ? "সক্রিয়" : "নিষ্ক্রিয়" },
      ]}
      fields={[
        { key: "name_bn", label: "নাম (বাংলা)", required: true },
        { key: "name_en", label: "নাম (English)" },
        { key: "category", label: "ক্যাটাগরি", type: "select", options: INGREDIENT_CATEGORIES, default: INGREDIENT_CATEGORIES[0] },
        { key: "unit", label: "একক", type: "select", options: UNITS, default: "কেজি" },
        { key: "avg_cost", label: "গড় মূল্য (৳ / একক)", type: "money", default: "0" },
        { key: "purchase_unit", label: "ক্রয় একক (ঐচ্ছিক)", type: "select", options: ["", ...UNITS] },
        { key: "conversion_factor", label: "রূপান্তর গুণক", default: "1" },
        { key: "min_stock", label: "ন্যূনতম স্টক", default: "0" },
        { key: "active", label: "অবস্থা", type: "select", options: ACTIVE_OPTS, default: "1" },
        { key: "note", label: "নোট", type: "textarea", full: true },
      ]}
    />
  );
}
