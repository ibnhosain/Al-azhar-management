import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, StatCard, StatRow, Badge } from "../../ui";
import { teachers as teachersApi, salaryLedger } from "../../data";
import TeacherComm from "./TeacherComm";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const money = (n) => "৳" + bn((Math.round(Number(n) || 0)).toLocaleString("en-US"));
const DAY = 86400000;
const parseDate = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const startOfToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const daysUntil = (d) => Math.round((d - startOfToday()) / DAY);
function nextBirthday(dob) {
  const b = parseDate(dob); if (!b) return null;
  const t = startOfToday(); let n = new Date(t.getFullYear(), b.getMonth(), b.getDate());
  if (n < t) n = new Date(t.getFullYear() + 1, b.getMonth(), b.getDate());
  return n;
}
const inDays = (n) => n === 0 ? "আজ" : n < 0 ? `${bn(-n)} দিন আগে` : `${bn(n)} দিন পরে`;

const CATS = {
  birthday: { icon: "🎂", label: "জন্মদিন", color: "#AD1457" },
  contract: { icon: "📄", label: "চুক্তির মেয়াদ", color: "#EF6C00" },
  increment: { icon: "📈", label: "ইনক্রিমেন্ট", color: "#00838F" },
  salary: { icon: "💰", label: "বকেয়া বেতন", color: "#E53935" },
};

export default function TeacherReminders({ onBack }) {
  const [rows, setRows] = useState([]);
  const [dues, setDues] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [r, d] = await Promise.all([teachersApi.list(), salaryLedger.duesByTeacher().catch(() => ({}))]);
      if (alive) { setRows(r || []); setDues(d || {}); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const groups = useMemo(() => {
    const g = { birthday: [], contract: [], increment: [], salary: [] };
    for (const t of rows) {
      const nb = nextBirthday(t.dob);
      if (nb) { const dU = daysUntil(nb); if (dU <= 30) g.birthday.push({ t, days: dU, info: inDays(dU), date: t.dob }); }
      const ce = parseDate(t.contract_end);
      if (ce) { const dU = daysUntil(ce); if (dU <= 45) g.contract.push({ t, days: dU, info: inDays(dU), date: t.contract_end, expired: dU < 0 }); }
      const inc = parseDate(t.increment_due);
      if (inc) { const dU = daysUntil(inc); if (dU <= 30) g.increment.push({ t, days: dU, info: inDays(dU), date: t.increment_due }); }
      const due = Number(dues[t.id] && dues[t.id].due) || 0;
      if (due > 0) g.salary.push({ t, due, info: money(due) + " বকেয়া" });
    }
    g.birthday.sort((a, b) => a.days - b.days);
    g.contract.sort((a, b) => a.days - b.days);
    g.increment.sort((a, b) => a.days - b.days);
    g.salary.sort((a, b) => b.due - a.due);
    return g;
  }, [rows, dues]);

  const total = groups.birthday.length + groups.contract.length + groups.increment.length + groups.salary.length;

  const msgFor = (key, item) => {
    if (key === "birthday") return `শুভ জন্মদিন, ${item.t.name}! 🎉 — মাদরাসাতুল আযহার আল-আরাবিয়া`;
    if (key === "salary") return `আসসালামু আলাইকুম ${item.t.name}। আপনার ${money(item.due)} বেতন বকেয়া রয়েছে।`;
    if (key === "contract") return `আসসালামু আলাইকুম ${item.t.name}। আপনার চাকরির চুক্তির মেয়াদ ${bn(item.date)} তারিখে শেষ হচ্ছে।`;
    return `আসসালামু আলাইকুম ${item.t.name}।`;
  };

  const renderGroup = (key) => {
    const c = CATS[key]; const items = groups[key];
    return (
      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, color: c.color, marginBottom: 10 }}>{c.icon} {c.label} <Badge color={c.color}>{bn(items.length)}</Badge></div>
        {items.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13 }}>কিছু নেই ✓</div>
          : items.map((item) => (
            <div key={item.t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#37474F" }}>{item.t.name} <span style={{ color: "#90A4AE", fontWeight: 400, fontSize: 12 }}>· {item.t.code || "—"}</span></div>
                <div style={{ fontSize: 12.5, color: item.expired ? "#E53935" : c.color }}>{item.info}{item.date && key !== "salary" ? ` · ${bn(item.date)}` : ""}</div>
              </div>
              <TeacherComm teacher={item.t} defaultMessage={msgFor(key, item)} compact />
            </div>
          ))}
      </Card>
    );
  };

  return (
    <div>
      <PageHeader icon="🔔" title="রিমাইন্ডার" description="জন্মদিন, চুক্তির মেয়াদ, ইনক্রিমেন্ট ও বকেয়া বেতন — এক জায়গায়" onBack={onBack} />
      <StatRow>
        <StatCard icon="🔔" label="মোট রিমাইন্ডার" value={bn(loading ? 0 : total)} color="#5C6BC0" />
        <StatCard icon="🎂" label="জন্মদিন (৩০ দিন)" value={bn(groups.birthday.length)} color="#AD1457" />
        <StatCard icon="📄" label="চুক্তি (৪৫ দিন)" value={bn(groups.contract.length)} color="#EF6C00" />
        <StatCard icon="💰" label="বকেয়া বেতন" value={bn(groups.salary.length)} color="#E53935" />
      </StatRow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {renderGroup("salary")}
        {renderGroup("birthday")}
        {renderGroup("contract")}
        {renderGroup("increment")}
      </div>
    </div>
  );
}
