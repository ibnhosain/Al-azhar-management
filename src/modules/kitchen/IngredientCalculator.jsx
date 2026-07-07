import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Button, useToast } from "../../ui";
import { ingredientCalc } from "../../data";
import { bn, todayISO, MEALS, taka, mealLabel } from "./constants";
import { printDoc, tableHtml } from "./print";

export default function IngredientCalculator({ nav, icon }) {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState("lunch");
  const [data, setData] = useState({ servings: 0, hasMenu: false, menu: null, rows: [], totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await ingredientCalc.generate(date, meal)); }
    catch (e) { toast.error("গণনা ব্যর্থ: " + (e.message || e)); }
    finally { setLoading(false); }
  }, [date, meal, toast]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try { const d = await ingredientCalc.generate(date, meal); if (alive) setData(d); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [date, meal]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data.rows;
    return data.rows.filter((r) => String(r.ingredient).toLowerCase().includes(t));
  }, [data.rows, q]);

  const columns = [
    { key: "sl", label: "#", width: 50, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "ingredient", label: "উপকরণ", sortable: true },
    { key: "required", label: "প্রয়োজনীয় পরিমাণ", align: "right", render: (r) => bn(r.required), sortable: true },
    { key: "unit", label: "একক", align: "center" },
    { key: "cost", label: "আনুমানিক খরচ", align: "right", render: (r) => taka(r.cost), exportValue: (r) => r.cost, sortable: true },
    { key: "remarks", label: "মন্তব্য", render: (r) => r.remarks ? <span style={{ color: "#EF6C00" }}>{r.remarks}</span> : <span style={{ color: "#9aa" }}>—</span> },
  ];

  const doPrint = (compact) => {
    if (!filtered.length) return toast.error("প্রিন্ট করার মতো কিছু নেই");
    const rows = filtered.map((r, i) => [i + 1, r.ingredient, bn(r.required), r.unit, taka(r.cost), r.remarks || ""]);
    rows.push(["", "সর্বমোট", "", "", taka(data.totalCost), ""]);
    const body = tableHtml(["#", "উপকরণ", "প্রয়োজন", "একক", "খরচ", "মন্তব্য"], rows, ["center", "left", "right", "center", "right", "left"]);
    printDoc("উপকরণ চাহিদা তালিকা", body, { compact, subtitle: `${date} • ${mealLabel(meal)} • ${bn(data.servings)} জন${data.menu?.title ? " • " + data.menu.title : ""}` });
  };

  const mealBtn = (m) => (
    <button key={m.key} type="button" onClick={() => setMeal(m.key)} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: `1.5px solid ${meal === m.key ? "#2E7D32" : "#cfd8cf"}`, background: meal === m.key ? "#2E7D32" : "#fff", color: meal === m.key ? "#fff" : "#4a5a4a" }}>{m.icon} {m.label}</button>
  );

  return (
    <div>
      <PageHeader icon={icon} title="স্মার্ট উপকরণ ক্যালকুলেটর" description="রেসিপি × ঐ বেলার মিল সংখ্যা → প্রয়োজনীয় উপকরণ ও আনুমানিক খরচ (কিছুই সংরক্ষণ হয় না)" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<><Button variant="secondary" onClick={load} icon="↻">রিফ্রেশ</Button><Button onClick={() => doPrint(false)} icon="🖨">প্রিন্ট</Button></>} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
        {MEALS.map(mealBtn)}
      </div>

      {!loading && !data.hasMenu && (
        <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", color: "#8D6E00", padding: "12px 16px", borderRadius: 10, marginBottom: 14, fontWeight: 600 }}>
          ⚠️ এই তারিখ ও বেলার জন্য কোনো মেনু নেই — মেনু প্ল্যানারে পদ নির্বাচন করে মেনু সংরক্ষণ করুন, তারপর হিসাব দেখা যাবে।
        </div>
      )}

      <StatRow>
        <StatCard icon="👥" label="মিল সংখ্যা (জন)" value={bn(data.servings)} color="#2E7D32" />
        <StatCard icon="🍽️" label="মেনু" value={data.menu?.title || (data.hasMenu ? mealLabel(meal) : "—")} color="#00838F" />
        <StatCard icon="🧂" label="উপকরণ" value={bn(filtered.length)} color="#EF6C00" />
        <StatCard icon="💰" label="মোট আনুমানিক খরচ" value={taka(data.totalCost)} color="#6A1B9A" />
      </StatRow>

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 উপকরণ খুঁজুন" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cfd8cf", minWidth: 240, fontSize: 14 }} />
        <Button size="sm" variant="secondary" onClick={() => doPrint(true)} icon="🍳">কিচেন কপি</Button>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <DataTable columns={columns} rows={filtered} loading={loading} exportName={`ingredient-calc-${date}-${meal}`}
          empty={{ icon: "🧮", title: "কোনো হিসাব নেই", description: data.hasMenu ? "রেসিপিতে উপকরণ যোগ করুন" : "আগে মেনু তৈরি করুন" }} />
        {filtered.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, padding: "12px 16px", background: "#F1F8F1", borderTop: "1px solid #dcece0", fontWeight: 700, color: "#1b5e20" }}>
            <span>সর্বমোট আনুমানিক খরচ: {taka(data.totalCost)}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
