import { useState, useEffect } from "react";
import { PageHeader, StatCard, StatRow, Card, Button } from "../../ui";
import { boardingBazar, boardingExpense } from "../../data";
import { taka, bn, todayISO } from "./constants";

export default function BoardingDashboard({ nav, icon, onOpen }) {
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

  const month = todayISO().slice(0, 7);
  const val = (v) => (loading ? "…" : taka(v));
  const bazarTotal = bazar.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const expTotal = exp.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const bazarMonth = bazar.filter((r) => String(r.date || "").slice(0, 7) === month).reduce((s, r) => s + (Number(r.total) || 0), 0);
  const expMonth = exp.filter((r) => String(r.date || "").slice(0, 7) === month).reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <div>
      <PageHeader icon={icon} title="বোর্ডিং ড্যাশবোর্ড" description="বোর্ডিং কার্যক্রমের সারসংক্ষেপ" onBack={nav.onBack} breadcrumb={nav.crumbs} />
      <StatRow>
        <StatCard icon="🛒" label="মোট বাজার (ক্রয়)" value={val(bazarTotal)} color="#00838F" hint={`${bn(bazar.length)} এন্ট্রি`} />
        <StatCard icon="🧾" label="মোট খরচ" value={val(expTotal)} color="#EF6C00" hint={`${bn(exp.length)} এন্ট্রি`} />
        <StatCard icon="📅" label="এই মাসের বাজার" value={val(bazarMonth)} color="#2E7D32" />
        <StatCard icon="💸" label="এই মাসের খরচ" value={val(expMonth)} color="#C62828" />
        <StatCard icon="💰" label="সর্বমোট ব্যয়" value={val(bazarTotal + expTotal)} color="#6A1B9A" />
      </StatRow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#243B40" }}>⚡ দ্রুত অ্যাকশন</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="subtle" onClick={() => onOpen("bazar")} icon="🛒">বাজার তালিকা</Button>
            <Button variant="subtle" onClick={() => onOpen("expense")} icon="🧾">খরচ তালিকা</Button>
            <Button variant="subtle" onClick={() => onOpen("residents")} icon="🏠">আবাসিক তালিকা</Button>
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#243B40" }}>🕒 সাম্প্রতিক বাজার</div>
          {loading ? (
            <div style={{ color: "#90A4AE", fontSize: 13 }}>লোড হচ্ছে...</div>
          ) : bazar.length === 0 ? (
            <div style={{ color: "#90A4AE", fontSize: 13 }}>কোনো তথ্য নেই</div>
          ) : (
            bazar.slice(0, 5).map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid #F0F2F3", fontSize: 13 }}>
                <span style={{ color: "#546E7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.date} · {r.summary || "—"}</span>
                <span style={{ fontWeight: 600, color: "#2E7D32", whiteSpace: "nowrap" }}>{taka(r.total)}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
