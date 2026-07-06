import CrudPage from "./CrudPage";
import { meals } from "../../data";
import { taka } from "./constants";

export default function BoardingMeal(props) {
  return (
    <CrudPage {...props} title="মিল ব্যবস্থাপনা" description="দৈনিক খাবারের তালিকা ও খরচ" api={meals} resourceKey="meals"
      addLabel="নতুন মিল" emptyTitle="কোনো মিল নেই"
      columns={[
        { key: "date", label: "তারিখ", sortable: true },
        { key: "meal_type", label: "বেলা", sortable: true },
        { key: "menu", label: "মেনু" },
        { key: "cost", label: "খরচ", align: "right", render: (r) => taka(r.cost), exportValue: (r) => r.cost },
      ]}
      fields={[
        { key: "date", label: "তারিখ", type: "date", required: true },
        { key: "meal_type", label: "বেলা", type: "select", options: ["সকাল", "দুপুর", "রাত"], default: "দুপুর" },
        { key: "menu", label: "মেনু", full: true },
        { key: "cost", label: "খরচ", type: "money" },
        { key: "notes", label: "নোট", type: "textarea", full: true },
      ]}
    />
  );
}
