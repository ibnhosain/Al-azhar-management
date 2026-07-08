import { useState } from "react";
import { PageHeader, Card } from "../../ui";
import MealList from "./MealList";
import MealProfiles from "./MealProfiles";
import MealPause from "./MealPause";
import HolidayPage from "./HolidayPage";
import Ingredients from "./Ingredients";
import Dishes from "./Dishes";
import Recipes from "./Recipes";
import MenuPlanner from "./MenuPlanner";
import IngredientCalculator from "./IngredientCalculator";
import KitchenReports from "./KitchenReports";
import KitchenDashboard from "./KitchenDashboard";
import KitchenStore from "./KitchenStore";
import Purchases from "./Purchases";
import Suppliers from "./Suppliers";
import MarketPlanner from "./MarketPlanner";
import MealAttendance from "./MealAttendance";
import GuestMeals from "./GuestMeals";
import MealApproval from "./MealApproval";

const TILES = [
  { key: "dashboard", icon: "📊", label: "কিচেন ড্যাশবোর্ড", color: "#2E7D32", desc: "সারসংক্ষেপ + সতর্কতা", C: KitchenDashboard },
  { key: "meal_list", icon: "📋", label: "মিল লিস্ট", color: "#2E7D32", desc: "দৈনিক অটো মিল তালিকা", C: MealList },
  { key: "profiles", icon: "👤", label: "মিল প্রোফাইল", color: "#00838F", desc: "ছাত্রের preference + ছবি", C: MealProfiles },
  { key: "attendance", icon: "✅", label: "মিল হাজিরা", color: "#2E7D32", desc: "প্রকৃত হাজিরা নিন", C: MealAttendance },
  { key: "approval", icon: "📝", label: "মিল অনুমোদন", color: "#E53935", desc: "চূড়ান্ত → অটো স্টক খরচ", C: MealApproval },
  { key: "guest", icon: "🧑‍🤝‍🧑", label: "গেস্ট মিল", color: "#6A1B9A", desc: "অতিথি মিল সংখ্যা", C: GuestMeals },
  { key: "menu", icon: "🍽️", label: "মেনু প্ল্যানার", color: "#2E7D32", desc: "দৈনিক/সাপ্তাহিক/টেমপ্লেট মেনু", C: MenuPlanner },
  { key: "calc", icon: "🧮", label: "উপকরণ ক্যালকুলেটর", color: "#6A1B9A", desc: "রেসিপি × মিল সংখ্যা", C: IngredientCalculator },
  { key: "market", icon: "🛒", label: "মার্কেট প্ল্যানার", color: "#E53935", desc: "প্রয়োজন − স্টক = বাজার", C: MarketPlanner },
  { key: "dishes", icon: "🍲", label: "পদ ব্যবস্থাপনা", color: "#EF6C00", desc: "রান্নার পদ + ছবি", C: Dishes },
  { key: "recipes", icon: "📖", label: "রেসিপি", color: "#00838F", desc: "পদের উপকরণ ও নোট", C: Recipes },
  { key: "ingredients", icon: "🧂", label: "উপকরণ মাস্টার", color: "#558B2F", desc: "উপকরণ, একক ও মূল্য", C: Ingredients },
  { key: "store", icon: "📦", label: "কিচেন স্টোর", color: "#00838F", desc: "স্টক + কম-স্টক সতর্কতা", C: KitchenStore },
  { key: "purchase", icon: "🧾", label: "কিচেন ক্রয়", color: "#EF6C00", desc: "ক্রয় → অটো স্টক ইন", C: Purchases },
  { key: "supplier", icon: "🏪", label: "সরবরাহকারী", color: "#558B2F", desc: "বাজার/দোকান তালিকা", C: Suppliers },
  { key: "pause", icon: "⏸️", label: "মিল বিরতি", color: "#EF6C00", desc: "ছুটি / অসুস্থ / বাড়ি", C: MealPause },
  { key: "holiday", icon: "📅", label: "ছুটির ক্যালেন্ডার", color: "#6A1B9A", desc: "ছুটির দিন মিল বন্ধ", C: HolidayPage },
  { key: "reports", icon: "📈", label: "রিপোর্ট", color: "#00838F", desc: "রেসিপি/মেনু/স্টক/কস্ট", C: KitchenReports },
];

export default function KitchenModule() {
  const [view, setView] = useState("landing");
  const goLanding = () => setView("landing");
  const active = TILES.find((t) => t.key === view && t.C);

  if (active) {
    const nav = { onBack: goLanding, crumbs: [{ label: "ড্যাশবোর্ড" }, { label: "রান্নাঘর ও মিল", onClick: goLanding }, { label: active.label }] };
    const Sub = active.C;
    return <Sub nav={nav} icon={active.icon} />;
  }

  return (
    <div>
      <PageHeader icon="🍳" title="রান্নাঘর ও মিল ব্যবস্থাপনা"
        description="মিল প্রোফাইল, স্বয়ংক্রিয় মিল লিস্ট, বিরতি ও ছুটি এক জায়গায়"
        breadcrumb={[{ label: "ড্যাশবোর্ড" }, { label: "রান্নাঘর ও মিল" }]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 16 }}>
        {TILES.map((t) => (
          <Card key={t.key} hover pad={0}
            style={{ cursor: "pointer", overflow: "hidden" }}
            onClick={() => setView(t.key)}>
            <div style={{ height: 4, background: t.color }} />
            <div style={{ padding: "22px 18px", textAlign: "center" }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, margin: "0 auto 12px", background: t.color + "14", color: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{t.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#243B40" }}>{t.label}</div>
              <div style={{ fontSize: 12, color: "#78909C", marginTop: 4 }}>{t.desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
