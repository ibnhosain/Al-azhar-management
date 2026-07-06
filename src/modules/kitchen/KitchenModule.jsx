import { useState } from "react";
import { PageHeader, Card, Badge, useToast } from "../../ui";
import MealList from "./MealList";
import MealProfiles from "./MealProfiles";
import MealPause from "./MealPause";
import HolidayPage from "./HolidayPage";

const TILES = [
  { key: "meal_list", icon: "📋", label: "মিল লিস্ট", color: "#2E7D32", desc: "দৈনিক অটো মিল তালিকা", C: MealList },
  { key: "profiles", icon: "👤", label: "মিল প্রোফাইল", color: "#00838F", desc: "ছাত্রের preference + ছবি", C: MealProfiles },
  { key: "pause", icon: "⏸️", label: "মিল বিরতি", color: "#EF6C00", desc: "ছুটি / অসুস্থ / বাড়ি", C: MealPause },
  { key: "holiday", icon: "📅", label: "ছুটির ক্যালেন্ডার", color: "#6A1B9A", desc: "ছুটির দিন মিল বন্ধ", C: HolidayPage },
  { key: "s1", icon: "📊", label: "কিচেন ড্যাশবোর্ড", color: "#607D8B", desc: "পরবর্তী Phase", soon: true },
  { key: "s2", icon: "🍽️", label: "মেনু প্ল্যানার", color: "#607D8B", desc: "পরবর্তী Phase", soon: true },
  { key: "s3", icon: "🧮", label: "উপকরণ ও মার্কেট", color: "#607D8B", desc: "পরবর্তী Phase", soon: true },
  { key: "s4", icon: "📦", label: "কিচেন স্টোর", color: "#607D8B", desc: "পরবর্তী Phase", soon: true },
  { key: "s5", icon: "✅", label: "মিল হাজিরা", color: "#607D8B", desc: "পরবর্তী Phase", soon: true },
  { key: "s6", icon: "📈", label: "রিপোর্ট ও খরচ", color: "#607D8B", desc: "পরবর্তী Phase", soon: true },
];

export default function KitchenModule() {
  const toast = useToast();
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
          <Card key={t.key} hover={!t.soon} pad={0}
            style={{ cursor: t.soon ? "default" : "pointer", overflow: "hidden", opacity: t.soon ? 0.6 : 1 }}
            onClick={() => (t.soon ? toast.info("এই অংশটি পরবর্তী Phase-এ যুক্ত হবে") : setView(t.key))}>
            <div style={{ height: 4, background: t.color }} />
            <div style={{ padding: "22px 18px", textAlign: "center", position: "relative" }}>
              {t.soon && <span style={{ position: "absolute", top: 8, right: 8 }}><Badge color="#78909C">শীঘ্রই</Badge></span>}
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
