import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, useToast } from "../../ui";
import { kitchenReports } from "../../data";
import { bn, todayISO, taka, mealLabel, menuTypeLabel } from "./constants";
import { printDoc, tableHtml } from "./print";

const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const TABS = [
  { key: "recipe", label: "রেসিপি রিপোর্ট", icon: "📖", ranged: false },
  { key: "menu", label: "মেনু রিপোর্ট", icon: "📅", ranged: true },
  { key: "usage", label: "উপকরণ ব্যবহার", icon: "🧂", ranged: true },
  { key: "history", label: "মেনু ইতিহাস", icon: "🕒", ranged: true },
  { key: "stock", label: "স্টক মূল্য", icon: "💰", ranged: false },
  { key: "purchase", label: "ক্রয় রিপোর্ট", icon: "🧾", ranged: true },
  { key: "cost", label: "কস্ট অ্যানালাইসিস", icon: "📊", ranged: true },
];

async function fetchReport(tab, from, to) {
  if (tab === "recipe") return kitchenReports.recipe();
  if (tab === "menu") return kitchenReports.menu(from, to);
  if (tab === "usage") return kitchenReports.usage(from, to);
  if (tab === "history") return kitchenReports.history(from, to);
  if (tab === "stock") return kitchenReports.stock();
  if (tab === "purchase") return kitchenReports.purchaseReport(from, to);
  return [];
}

export default function KitchenReports({ nav, icon }) {
  const toast = useToast();
  const [tab, setTab] = useState("recipe");
  const [from, setFrom] = useState(addDays(todayISO(), -30));
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [cost, setCost] = useState({ purchaseValue: 0, consumptionValue: 0, wasteValue: 0, currentStockValue: 0 });
  const [loading, setLoading] = useState(true);

  const active = TABS.find((t) => t.key === tab);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "cost") setCost(await kitchenReports.cost(from, to));
      else setRows(await fetchReport(tab, from, to));
    } catch (e) { toast.error("রিপোর্ট লোড ব্যর্থ: " + (e.message || e)); }
    finally { setLoading(false); }
  }, [tab, from, to, toast]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (tab === "cost") { const c = await kitchenReports.cost(from, to); if (alive) setCost(c); }
        else { const r = await fetchReport(tab, from, to); if (alive) setRows(r); }
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [tab, from, to]);

  const COLS = {
    recipe: [
      { key: "name", label: "পদ", sortable: true },
      { key: "category", label: "ক্যাটাগরি", render: (r) => r.category ? <Badge color="#EF6C00">{r.category}</Badge> : "—", exportValue: (r) => r.category },
      { key: "meal_type", label: "বেলা", render: (r) => mealLabel(r.meal_type), exportValue: (r) => mealLabel(r.meal_type) },
      { key: "item_count", label: "উপকরণ সংখ্যা", align: "center", render: (r) => bn(r.item_count), sortable: true },
      { key: "cost_per_person", label: "জনপ্রতি খরচ", align: "right", render: (r) => taka(r.cost_per_person), exportValue: (r) => r.cost_per_person, sortable: true },
    ],
    menu: [
      { key: "m_date", label: "তারিখ", sortable: true },
      { key: "meal_type", label: "বেলা", render: (r) => <Badge color="#2E7D32">{mealLabel(r.meal_type)}</Badge>, exportValue: (r) => mealLabel(r.meal_type) },
      { key: "menu_type", label: "ধরন", render: (r) => menuTypeLabel(r.menu_type), exportValue: (r) => menuTypeLabel(r.menu_type) },
      { key: "title", label: "শিরোনাম", render: (r) => r.title || "—" },
      { key: "dish_count", label: "পদ সংখ্যা", align: "center", render: (r) => bn(r.dish_count), sortable: true },
      { key: "dish_names", label: "পদসমূহ", render: (r) => <span style={{ fontSize: 12, color: "#546E7A" }}>{r.dish_names || "—"}</span> },
    ],
    usage: [
      { key: "sl", label: "#", width: 50, align: "center", render: (_r, i) => bn(i + 1) },
      { key: "ingredient", label: "উপকরণ", sortable: true },
      { key: "required", label: "মোট ব্যবহার", align: "right", render: (r) => bn(r.required), sortable: true },
      { key: "unit", label: "একক", align: "center" },
      { key: "cost", label: "মোট খরচ", align: "right", render: (r) => taka(r.cost), exportValue: (r) => r.cost, sortable: true },
    ],
    history: [
      { key: "m_date", label: "তারিখ", sortable: true },
      { key: "meal_type", label: "বেলা", render: (r) => <Badge color="#2E7D32">{mealLabel(r.meal_type)}</Badge>, exportValue: (r) => mealLabel(r.meal_type) },
      { key: "menu_type", label: "ধরন", render: (r) => menuTypeLabel(r.menu_type), exportValue: (r) => menuTypeLabel(r.menu_type) },
      { key: "title", label: "শিরোনাম", render: (r) => r.title || "—" },
      { key: "dish_names", label: "পদসমূহ", render: (r) => <span style={{ fontSize: 12, color: "#546E7A" }}>{r.dish_names || "—"}</span> },
    ],
    stock: [
      { key: "name_bn", label: "উপকরণ", sortable: true },
      { key: "category", label: "ক্যাটাগরি", render: (r) => r.category ? <Badge color="#00838F">{r.category}</Badge> : "—", exportValue: (r) => r.category },
      { key: "current_qty", label: "বর্তমান স্টক", align: "right", render: (r) => bn(r.current_qty), sortable: true },
      { key: "unit", label: "একক", align: "center" },
      { key: "stock_value", label: "মূল্য", align: "right", render: (r) => taka(r.stock_value), exportValue: (r) => r.stock_value, sortable: true },
    ],
    purchase: [
      { key: "p_date", label: "তারিখ", sortable: true },
      { key: "supplier_name", label: "সরবরাহকারী", render: (r) => r.supplier_name || "—" },
      { key: "item_count", label: "আইটেম", align: "center", render: (r) => bn(r.item_count) },
      { key: "total", label: "মোট", align: "right", render: (r) => taka(r.total), exportValue: (r) => r.total, sortable: true },
    ],
    cost: [],
  };

  const doPrint = () => {
    const sub = active.ranged ? `${from} — ${to}` : `মোট ${rows.length}`;
    if (tab === "cost") {
      const body = tableHtml(["খাত", "মূল্য"], [
        ["ক্রয় মূল্য", taka(cost.purchaseValue)],
        ["খরচ/রান্না মূল্য", taka(cost.consumptionValue)],
        ["অপচয় মূল্য", taka(cost.wasteValue)],
        ["বর্তমান স্টক মূল্য", taka(cost.currentStockValue)],
      ], ["left", "right"]);
      return printDoc("কস্ট অ্যানালাইসিস", body, { subtitle: `${from} — ${to}` });
    }
    if (!rows.length) return toast.error("প্রিন্ট করার মতো কিছু নেই");
    let headers, body, align;
    if (tab === "recipe") { headers = ["পদ", "ক্যাটাগরি", "বেলা", "উপকরণ", "জনপ্রতি খরচ"]; align = ["left", "left", "center", "center", "right"]; body = rows.map((r) => [r.name, r.category || "", mealLabel(r.meal_type), bn(r.item_count), taka(r.cost_per_person)]); }
    else if (tab === "usage") { headers = ["#", "উপকরণ", "মোট ব্যবহার", "একক", "মোট খরচ"]; align = ["center", "left", "right", "center", "right"]; body = rows.map((r, i) => [i + 1, r.ingredient, bn(r.required), r.unit, taka(r.cost)]); }
    else if (tab === "stock") { headers = ["উপকরণ", "ক্যাটাগরি", "স্টক", "একক", "মূল্য"]; align = ["left", "left", "right", "center", "right"]; body = rows.map((r) => [r.name_bn, r.category || "", bn(r.current_qty), r.unit, taka(r.stock_value)]); }
    else if (tab === "purchase") { headers = ["তারিখ", "সরবরাহকারী", "আইটেম", "মোট"]; align = ["left", "left", "center", "right"]; body = rows.map((r) => [r.p_date, r.supplier_name || "", bn(r.item_count), taka(r.total)]); }
    else { headers = ["তারিখ", "বেলা", "ধরন", "শিরোনাম", "পদসমূহ"]; align = ["left", "center", "center", "left", "left"]; body = rows.map((r) => [r.m_date || "", mealLabel(r.meal_type), menuTypeLabel(r.menu_type), r.title || "", r.dish_names || ""]); }
    printDoc(active.label, tableHtml(headers, body, align), { subtitle: sub });
  };

  return (
    <div>
      <PageHeader icon={icon} title="রান্নাঘর রিপোর্ট" description="রেসিপি, মেনু, উপকরণ ব্যবহার ও মেনু ইতিহাস" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<><Button variant="secondary" onClick={load} icon="↻">রিফ্রেশ</Button><Button onClick={doPrint} icon="🖨">প্রিন্ট</Button></>} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: `1.5px solid ${tab === t.key ? "#2E7D32" : "#cfd8cf"}`, background: tab === t.key ? "#2E7D32" : "#fff", color: tab === t.key ? "#fff" : "#4a5a4a" }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {active.ranged && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#607D8B" }}>তারিখ:</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
          <span style={{ color: "#90A4AE" }}>—</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
        </div>
      )}

      {tab === "cost" ? (
        <StatRow>
          <StatCard icon="🧾" label="ক্রয় মূল্য" value={taka(cost.purchaseValue)} color="#2E7D32" />
          <StatCard icon="🍳" label="খরচ / রান্না মূল্য" value={taka(cost.consumptionValue)} color="#EF6C00" />
          <StatCard icon="🗑️" label="অপচয় মূল্য" value={taka(cost.wasteValue)} color="#E53935" />
          <StatCard icon="💰" label="বর্তমান স্টক মূল্য" value={taka(cost.currentStockValue)} color="#6A1B9A" />
        </StatRow>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <DataTable columns={COLS[tab]} rows={rows} loading={loading} exportName={`kitchen-report-${tab}`}
            empty={{ icon: active.icon, title: "কোনো তথ্য নেই", description: "তারিখ পরিসর বা ডেটা যোগ করুন" }} />
        </Card>
      )}
    </div>
  );
}
