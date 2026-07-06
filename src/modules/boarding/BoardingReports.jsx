import { useState, useEffect } from "react";
import { PageHeader, StatCard, StatRow, DataTable } from "../../ui";
import { boardingBazar, boardingExpense } from "../../data";
import { taka } from "./constants";

export default function BoardingReports({ nav, icon }) {
  const [bazar, setBazar] = useState([]);
  const [exp, setExp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [b, e] = await Promise.all([boardingBazar.list(), boardingExpense.list()]);
      if (alive) { setBazar(b); setExp(e); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const bazarTotal = bazar.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const expTotal = exp.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  // ক্যাটাগরি অনুযায়ী খরচ
  const byCat = {};
  exp.forEach((e) => { const k = e.category || "অন্যান্য"; byCat[k] = (byCat[k] || 0) + (Number(e.amount) || 0); });
  const catRows = Object.entries(byCat).map(([category, amount], i) => ({ id: i, category, amount })).sort((a, b) => b.amount - a.amount);

  // মাসিক সারসংক্ষেপ
  const byMonth = {};
  const add = (m, field, v) => { byMonth[m] = byMonth[m] || { month: m, bazar: 0, expense: 0 }; byMonth[m][field] += v; };
  bazar.forEach((r) => add(String(r.date || "").slice(0, 7) || "—", "bazar", Number(r.total) || 0));
  exp.forEach((e) => add(String(e.date || "").slice(0, 7) || "—", "expense", Number(e.amount) || 0));
  const monthRows = Object.values(byMonth).map((m, i) => ({ id: i, ...m, total: m.bazar + m.expense })).sort((a, b) => (a.month < b.month ? 1 : -1));

  return (
    <div>
      <PageHeader icon={icon} title="বোর্ডিং রিপোর্ট" description="বাজার ও খরচের বিশ্লেষণ" onBack={nav.onBack} breadcrumb={nav.crumbs} />
      <StatRow>
        <StatCard icon="🛒" label="মোট বাজার" value={loading ? "…" : taka(bazarTotal)} color="#00838F" />
        <StatCard icon="🧾" label="মোট খরচ" value={loading ? "…" : taka(expTotal)} color="#EF6C00" />
        <StatCard icon="💰" label="সর্বমোট ব্যয়" value={loading ? "…" : taka(bazarTotal + expTotal)} color="#6A1B9A" />
      </StatRow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, margin: "4px 2px 10px", color: "#243B40" }}>📊 ক্যাটাগরি অনুযায়ী খরচ</div>
          <DataTable rows={catRows} loading={loading} pagination={false} columnToggle={false} exportName="expense-by-category"
            columns={[
              { key: "category", label: "ক্যাটাগরি", sortable: true },
              { key: "amount", label: "পরিমাণ", align: "right", sortable: true, render: (r) => taka(r.amount), exportValue: (r) => r.amount },
            ]}
            empty={{ icon: "🧾", title: "কোনো খরচ নেই" }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, margin: "4px 2px 10px", color: "#243B40" }}>📅 মাসিক সারসংক্ষেপ</div>
          <DataTable rows={monthRows} loading={loading} pagination={false} columnToggle={false} exportName="monthly-summary"
            columns={[
              { key: "month", label: "মাস", sortable: true },
              { key: "bazar", label: "বাজার", align: "right", render: (r) => taka(r.bazar) },
              { key: "expense", label: "খরচ", align: "right", render: (r) => taka(r.expense) },
              { key: "total", label: "মোট", align: "right", render: (r) => <b>{taka(r.total)}</b> },
            ]}
            empty={{ icon: "📅", title: "কোনো তথ্য নেই" }} />
        </div>
      </div>
    </div>
  );
}
