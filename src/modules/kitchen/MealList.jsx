import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader, DataTable, StatCard, StatRow, Badge, Button, useToast } from "../../ui";
import { mealList } from "../../data";
import { bn, todayISO, MEALS, DIET_TYPES } from "./constants";

const DIET_COLOR = { normal: "#2E7D32", special: "#EF6C00", sick: "#E53935", vip: "#6A1B9A" };
const dietLabel = (v) => (DIET_TYPES.find((d) => d.value === v) || DIET_TYPES[0]).label;

function Avatar({ src, name }) {
  return src
    ? <img src={src} alt={name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
    : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E8F5E9", color: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{(name || "?").slice(0, 1)}</div>;
}

export default function MealList({ nav, icon }) {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState("lunch");
  const [data, setData] = useState({ rows: [], summary: { total: 0, home: 0, paused: 0, guest: 0, special: 0, sick: 0 }, holiday: null });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await mealList.generate(date, meal)); }
    catch (e) { toast.error("তালিকা তৈরি ব্যর্থ: " + (e.message || e)); }
    finally { setLoading(false); }
  }, [date, meal, toast]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try { const d = await mealList.generate(date, meal); if (alive) setData(d); }
      catch { /* toast handled on manual */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [date, meal]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (diet && r.diet_type !== diet) return false;
      if (!t) return true;
      return [r.name, r.code, r.room_no, r.class].some((v) => String(v || "").toLowerCase().includes(t));
    });
  }, [data.rows, q, diet]);

  const mealMeta = MEALS.find((m) => m.key === meal);

  const columns = [
    { key: "sl", label: "ক্র.", width: 54, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "photo", label: "ছবি", width: 56, render: (r) => <Avatar src={r.photo} name={r.name} /> },
    { key: "name", label: "নাম", sortable: true },
    { key: "code", label: "আইডি", sortable: true },
    { key: "class", label: "শ্রেণি", sortable: true },
    { key: "section", label: "শাখা", render: (r) => r.section || "—" },
    { key: "room_no", label: "রুম", render: (r) => r.room_no || "—" },
    { key: "bed_no", label: "বেড", render: (r) => r.bed_no || "—" },
    { key: "meal_type", label: "বেলা", render: () => <Badge color="#2E7D32">{mealMeta ? mealMeta.short : meal}</Badge>, exportValue: () => mealMeta ? mealMeta.short : meal },
    { key: "diet_type", label: "ডায়েট", render: (r) => <Badge color={DIET_COLOR[r.diet_type]}>{dietLabel(r.diet_type)}</Badge>, exportValue: (r) => dietLabel(r.diet_type) },
    { key: "remarks", label: "মন্তব্য", render: (r) => {
      const parts = [];
      if (r.allergy) parts.push("⚠ " + r.allergy);
      if (r.note) parts.push(r.note);
      return parts.length ? <span style={{ color: r.allergy ? "#E53935" : "#556" }}>{parts.join(" · ")}</span> : <span style={{ color: "#9aa" }}>—</span>;
    }, exportValue: (r) => [r.allergy, r.note].filter(Boolean).join(" · ") },
    { key: "attendance", label: "হাজিরা", align: "center", render: () => <Badge color="#90A4AE">অপেক্ষমাণ</Badge>, exportValue: () => "অপেক্ষমাণ" },
  ];

  const printList = () => {
    const rowsHtml = filtered.map((r, i) => `<tr>
      <td>${bn(i + 1)}</td><td>${r.name || ""}</td><td>${r.code || ""}</td>
      <td>${r.class || ""}</td><td>${r.room_no || ""}</td><td>${r.bed_no || ""}</td>
      <td>${dietLabel(r.diet_type)}</td><td>${[r.allergy, r.note].filter(Boolean).join(" / ")}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>মিল তালিকা</title>
      <style>body{font-family:'Noto Sans Bengali',sans-serif;padding:24px;color:#222}
      h2{margin:0 0 4px} .sub{color:#666;margin-bottom:14px;font-size:14px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{border:1px solid #bbb;padding:6px 8px;text-align:left}
      th{background:#E8F5E9}</style></head><body>
      <h2>🍽️ মিল তালিকা — ${mealMeta ? mealMeta.label : meal}</h2>
      <div class="sub">তারিখ: ${date} • মোট: ${bn(filtered.length)} জন${data.holiday ? " • (ছুটি: " + data.holiday.title + ")" : ""}</div>
      <table><thead><tr><th>ক্র.</th><th>নাম</th><th>আইডি</th><th>শ্রেণি</th><th>রুম</th><th>বেড</th><th>ডায়েট</th><th>মন্তব্য</th></tr></thead>
      <tbody>${rowsHtml}</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return toast.error("প্রিন্ট উইন্ডো খোলা যায়নি");
    w.document.write(html); w.document.close(); w.focus(); w.print();
  };

  const s = data.summary;
  const stats = [
    { label: "মোট মিল", value: bn(s.total), icon: "🍽️", color: "#2E7D32" },
    { label: "বাড়ির খাবার", value: bn(s.home), icon: "🏠", color: "#0288D1" },
    { label: "মিল বিরত", value: bn(s.paused), icon: "⏸", color: "#EF6C00" },
    { label: "গেস্ট মিল", value: bn(s.guest || 0), icon: "👥", color: "#6A1B9A" },
    { label: "বিশেষ ডায়েট", value: bn(s.special), icon: "🥗", color: "#E53935" },
  ];

  const tabBtn = (m) => (
    <button key={m.key} type="button" onClick={() => setMeal(m.key)} style={{
      padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700,
      border: `1.5px solid ${meal === m.key ? "#2E7D32" : "#cfd8cf"}`,
      background: meal === m.key ? "#2E7D32" : "#fff", color: meal === m.key ? "#fff" : "#4a5a4a",
    }}>{m.icon} {m.label}</button>
  );

  return (
    <div>
      <PageHeader icon={icon} title="স্মার্ট মিল তালিকা" description="প্রোফাইল, বিরতি, বাড়ির খাবার ও ছুটি থেকে স্বয়ংক্রিয়ভাবে তৈরি (কোথাও সংরক্ষণ হয় না)" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<>
          <Button variant="secondary" onClick={load} icon="↻">রিফ্রেশ</Button>
          <Button onClick={printList} icon="🖨">প্রিন্ট</Button>
        </>} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
        {MEALS.map(tabBtn)}
      </div>

      {data.holiday && (
        <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", color: "#E65100", padding: "10px 16px", borderRadius: 10, marginBottom: 14, fontWeight: 600 }}>
          🏖️ আজ এই বেলার মিল ছুটির কারণে বন্ধ — {data.holiday.title}
        </div>
      )}

      <StatRow>{stats.map((st) => <StatCard key={st.label} icon={st.icon} label={st.label} value={st.value} color={st.color} />)}</StatRow>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "14px 0" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 নাম / আইডি / রুম / শ্রেণি" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cfd8cf", minWidth: 240, fontSize: 14 }} />
        <select value={diet} onChange={(e) => setDiet(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }}>
          <option value="">সব ডায়েট</option>
          {DIET_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} exportName={`meal-list-${date}-${meal}`}
        empty={{ icon: "🍽️", title: "এই বেলায় কোনো মিল নেই", description: data.holiday ? "ছুটির কারণে বন্ধ" : "প্রোফাইল/তারিখ পরীক্ষা করুন" }} />
    </div>
  );
}
