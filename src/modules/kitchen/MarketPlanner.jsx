import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader, DataTable, StatCard, StatRow, Button, useToast } from "../../ui";
import { market } from "../../data";
import { bn, todayISO, taka, MEALS } from "./constants";
import { printDoc, tableHtml } from "./print";

const MEAL_OPTS = [...MEALS, { key: "all", label: "সারাদিন", icon: "🍱" }];

export default function MarketPlanner({ nav, icon }) {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState("all");
  const [data, setData] = useState({ rows: [], totalCost: 0, buyCount: 0 });
  const [loading, setLoading] = useState(true);
  const [buyOnly, setBuyOnly] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await market.plan(date, meal)); }
    catch (e) { toast.error("প্ল্যান ব্যর্থ: " + (e.message || e)); }
    finally { setLoading(false); }
  }, [date, meal, toast]);

  useEffect(() => {
    let alive = true;
    (async () => { setLoading(true); try { const d = await market.plan(date, meal); if (alive) setData(d); } finally { if (alive) setLoading(false); } })();
    return () => { alive = false; };
  }, [date, meal]);

  const rows = useMemo(() => (buyOnly ? data.rows.filter((r) => r.shortage > 0) : data.rows), [data.rows, buyOnly]);
  const mealLabel = (MEAL_OPTS.find((m) => m.key === meal) || {}).label || meal;

  const columns = [
    { key: "sl", label: "#", width: 50, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "ingredient", label: "উপকরণ", sortable: true },
    { key: "required", label: "প্রয়োজন", align: "right", render: (r) => bn(r.required), sortable: true },
    { key: "stock", label: "বর্তমান স্টক", align: "right", render: (r) => bn(r.stock) },
    { key: "shortage", label: "কিনতে হবে", align: "right", sortable: true, render: (r) => r.shortage > 0 ? <b style={{ color: "#E53935" }}>{bn(r.shortage)}</b> : <span style={{ color: "#2E7D32" }}>০</span> },
    { key: "unit", label: "একক", align: "center" },
    { key: "est_cost", label: "আনুমানিক খরচ", align: "right", render: (r) => taka(r.est_cost), exportValue: (r) => r.est_cost, sortable: true },
  ];

  const doPrint = (compact) => {
    if (!rows.length) return toast.error("প্রিন্ট করার মতো কিছু নেই");
    const body = rows.map((r, i) => [i + 1, r.ingredient, bn(r.shortage), r.unit, taka(r.est_cost)]);
    body.push(["", "সর্বমোট", "", "", taka(data.totalCost)]);
    printDoc("বাজার তালিকা", tableHtml(["#", "উপকরণ", "কিনতে হবে", "একক", "আনুমানিক খরচ"], body, ["center", "left", "right", "center", "right"]),
      { compact, subtitle: `${date} • ${mealLabel} • ${bn(data.buyCount)} উপকরণ` });
  };

  const mealBtn = (m) => (
    <button key={m.key} type="button" onClick={() => setMeal(m.key)} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: `1.5px solid ${meal === m.key ? "#2E7D32" : "#cfd8cf"}`, background: meal === m.key ? "#2E7D32" : "#fff", color: meal === m.key ? "#fff" : "#4a5a4a" }}>{m.icon} {m.label}</button>
  );

  return (
    <div>
      <PageHeader icon={icon} title="স্মার্ট মার্কেট প্ল্যানার" description="প্রয়োজন (রেসিপি × মিল সংখ্যা) − বর্তমান স্টক = কেনার তালিকা (সংরক্ষণ হয় না)" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<><Button variant="secondary" onClick={load} icon="↻">রিফ্রেশ</Button><Button onClick={() => doPrint(false)} icon="🖨">প্রিন্ট</Button></>} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
        {MEAL_OPTS.map(mealBtn)}
      </div>

      <StatRow>
        <StatCard icon="🛒" label="কিনতে হবে (উপকরণ)" value={bn(data.buyCount)} color="#E53935" />
        <StatCard icon="💰" label="আনুমানিক বাজার খরচ" value={taka(data.totalCost)} color="#6A1B9A" />
        <StatCard icon="📋" label="বিবেচিত উপকরণ" value={bn(data.rows.length)} color="#00838F" />
      </StatRow>

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0" }}>
        <button type="button" onClick={() => setBuyOnly((v) => !v)} style={{ padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `1.5px solid ${buyOnly ? "#2E7D32" : "#cfd8cf"}`, background: buyOnly ? "#2E7D32" : "#fff", color: buyOnly ? "#fff" : "#607D8B" }}>{buyOnly ? "✓ শুধু কিনতে হবে" : "সব উপকরণ"}</button>
        <Button size="sm" variant="secondary" onClick={() => doPrint(true)} icon="🍳">কিচেন কপি</Button>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} exportName={`market-${date}-${meal}`}
        empty={{ icon: "🛒", title: "কেনার কিছু নেই", description: "মেনু আছে ও স্টক পর্যাপ্ত — অথবা এই বেলার মেনু তৈরি করুন" }} />
    </div>
  );
}
