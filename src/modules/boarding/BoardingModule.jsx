import { useState } from "react";
import { PageHeader, Card } from "../../ui";
import BoardingDashboard from "./BoardingDashboard";
import BoardingBazar from "./BoardingBazar";
import BoardingExpense from "./BoardingExpense";
import BoardingResidents from "./BoardingResidents";
import BoardingMeal from "./BoardingMeal";
import BoardingRooms from "./BoardingRooms";
import BoardingBeds from "./BoardingBeds";
import BoardingBedAllocation from "./BoardingBedAllocation";
import BoardingLeave from "./BoardingLeave";
import BoardingVisitor from "./BoardingVisitor";
import BoardingReports from "./BoardingReports";

const TILES = [
  { key: "dashboard", icon: "📊", label: "বোর্ডিং ড্যাশবোর্ড", color: "#2E7D32", desc: "সারসংক্ষেপ ও পরিসংখ্যান", C: BoardingDashboard },
  { key: "bazar", icon: "🛒", label: "বোর্ডিং বাজার", color: "#00838F", desc: "বাজার / ক্রয় এন্ট্রি", C: BoardingBazar },
  { key: "expense", icon: "🧾", label: "বোর্ডিং খরচ", color: "#EF6C00", desc: "খরচের হিসাব", C: BoardingExpense },
  { key: "meal", icon: "🍽️", label: "মিল ব্যবস্থাপনা", color: "#00897B", desc: "দৈনিক খাবার", C: BoardingMeal },
  { key: "rooms", icon: "🚪", label: "রুম ব্যবস্থাপনা", color: "#5E35B1", desc: "রুম তালিকা", C: BoardingRooms },
  { key: "beds", icon: "🛏️", label: "বেড ব্যবস্থাপনা", color: "#3949AB", desc: "বেড তালিকা", C: BoardingBeds },
  { key: "allocation", icon: "🧷", label: "বেড বরাদ্দ", color: "#1E88E5", desc: "শিক্ষার্থী-বেড বরাদ্দ", C: BoardingBedAllocation },
  { key: "residents", icon: "🏠", label: "আবাসিক তালিকা", color: "#6A1B9A", desc: "বোর্ডিং শিক্ষার্থী", C: BoardingResidents },
  { key: "leave", icon: "📝", label: "ছুটি রেজিস্টার", color: "#FB8C00", desc: "ছুটির হিসাব", C: BoardingLeave },
  { key: "visitor", icon: "👋", label: "ভিজিটর রেজিস্টার", color: "#8E24AA", desc: "দর্শনার্থী", C: BoardingVisitor },
  { key: "reports", icon: "📈", label: "রিপোর্ট", color: "#43A047", desc: "বিশ্লেষণ ও সারসংক্ষেপ", C: BoardingReports },
];

// বোর্ডিং মডিউল — গ্লোবাল nav না ছুঁয়ে নিজস্ব ভেতরের sub-navigation (স্ক্রিনশটের মতো)
export default function BoardingModule() {
  const [view, setView] = useState("landing");
  const goLanding = () => setView("landing");
  const active = TILES.find((t) => t.key === view);

  if (active) {
    const nav = {
      onBack: goLanding,
      crumbs: [{ label: "ড্যাশবোর্ড" }, { label: "বোর্ডিং ব্যবস্থাপনা", onClick: goLanding }, { label: active.label }],
    };
    const Sub = active.C;
    return <Sub nav={nav} icon={active.icon} onOpen={setView} />;
  }

  return (
    <div>
      <PageHeader
        icon="🏠"
        title="বোর্ডিং ব্যবস্থাপনা"
        description="বাজার, খরচ, মিল, রুম, বেড, ছুটি, ভিজিটর ও রিপোর্ট এক জায়গায়"
        breadcrumb={[{ label: "ড্যাশবোর্ড" }, { label: "বোর্ডিং ব্যবস্থাপনা" }]}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 16 }}>
        {TILES.map((t) => (
          <Card key={t.key} hover pad={0} style={{ cursor: "pointer", overflow: "hidden" }} onClick={() => setView(t.key)}>
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
