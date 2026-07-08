import CrudPage from "../boarding/CrudPage";
import { Badge } from "../../ui";
import { guestMeals } from "../../data";
import { bn, MEALS, GUEST_REASONS, mealLabel } from "./constants";

const MEAL_OPTS = MEALS.map((m) => ({ value: m.key, label: m.label }));

export default function GuestMeals(props) {
  return (
    <CrudPage {...props} title="গেস্ট মিল" description="অতিথি/মেহমান মিল — সংখ্যা মিল লিস্ট, ক্যালকুলেটর ও মার্কেটে যোগ হয়"
      api={guestMeals} resourceKey="guest_meal" addLabel="নতুন গেস্ট মিল" emptyTitle="কোনো গেস্ট মিল নেই"
      columns={[
        { key: "g_date", label: "তারিখ", sortable: true },
        { key: "meal_type", label: "বেলা", render: (r) => <Badge color="#2E7D32">{mealLabel(r.meal_type)}</Badge>, exportValue: (r) => mealLabel(r.meal_type) },
        { key: "guest_count", label: "সংখ্যা", align: "center", render: (r) => bn(r.guest_count), sortable: true },
        { key: "guest_name", label: "নাম", render: (r) => r.guest_name || "—" },
        { key: "reason", label: "কারণ", render: (r) => r.reason ? <Badge color="#EF6C00">{r.reason}</Badge> : "—", exportValue: (r) => r.reason },
      ]}
      fields={[
        { key: "g_date", label: "তারিখ", type: "date", required: true },
        { key: "meal_type", label: "বেলা", type: "select", options: MEAL_OPTS, default: "lunch" },
        { key: "guest_count", label: "অতিথি সংখ্যা", required: true, default: "1" },
        { key: "guest_name", label: "নাম / দল" },
        { key: "reason", label: "কারণ", type: "select", options: GUEST_REASONS, default: "অতিথি" },
        { key: "note", label: "নোট", type: "textarea", full: true },
      ]}
    />
  );
}
