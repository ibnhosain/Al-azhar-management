import { useState, useEffect, useMemo } from "react";
import { PageHeader, DataTable, StatCard, StatRow, Button, useToast } from "../../ui";
import { mealList, mealAttendance } from "../../data";
import { bn, todayISO, MEALS, ATTEND_STATUS, mealLabel } from "./constants";
import { printDoc, tableHtml } from "./print";
import ShareModal from "./ShareModal";

export default function MealAttendance({ nav, icon }) {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState("lunch");
  const [rows, setRows] = useState([]);
  const [statuses, setStatuses] = useState({});   // student_id → status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [share, setShare] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [ml, saved] = await Promise.all([mealList.generate(date, meal), mealAttendance.get(date, meal)]);
      if (!alive) return;
      const map = {};
      saved.forEach((r) => { map[r.student_id] = r.status; });
      const init = {};
      ml.rows.forEach((r) => { init[r.id] = map[r.id] || "present"; });
      setRows(ml.rows); setStatuses(init); setLoading(false);
    })();
    return () => { alive = false; };
  }, [date, meal]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, leave: 0 };
    rows.forEach((r) => { const s = statuses[r.id] || "present"; c[s] = (c[s] || 0) + 1; });
    return c;
  }, [rows, statuses]);

  const setAll = (status) => { const m = {}; rows.forEach((r) => { m[r.id] = status; }); setStatuses(m); };

  const save = async () => {
    setSaving(true);
    try {
      const records = rows.map((r) => ({ student_id: r.id, student_code: r.code, student_name: r.name, status: statuses[r.id] || "present" }));
      await mealAttendance.save(date, meal, records);
      toast.success("হাজিরা সংরক্ষণ হয়েছে");
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const StatusBtns = ({ id }) => (
    <div style={{ display: "flex", gap: 5 }}>
      {ATTEND_STATUS.map((s) => {
        const on = (statuses[id] || "present") === s.value;
        return <button key={s.value} type="button" onClick={() => setStatuses((m) => ({ ...m, [id]: s.value }))}
          style={{ padding: "5px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, border: `1.5px solid ${on ? s.color : "#cfd8cf"}`, background: on ? s.color : "#fff", color: on ? "#fff" : "#607D8B" }}>{s.label}</button>;
      })}
    </div>
  );

  const columns = [
    { key: "sl", label: "#", width: 46, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "name", label: "নাম", sortable: true },
    { key: "code", label: "আইডি", sortable: true },
    { key: "class", label: "শ্রেণি" },
    { key: "room_no", label: "রুম", render: (r) => r.room_no || "—" },
    { key: "__s", label: "হাজিরা", render: (r) => <StatusBtns id={r.id} /> },
  ];

  const doPrint = () => {
    if (!rows.length) return toast.error("কিছু নেই");
    const body = rows.map((r, i) => [i + 1, r.name, r.code, (ATTEND_STATUS.find((s) => s.value === (statuses[r.id] || "present")) || {}).label]);
    printDoc("মিল হাজিরা", tableHtml(["#", "নাম", "আইডি", "অবস্থা"], body, ["center", "left", "left", "center"]),
      { subtitle: `${date} • ${mealLabel(meal)} • হাজির ${bn(counts.present)}` });
  };

  const shareText = () => `🍽️ মিল হাজিরা\n📅 ${date} • ${mealLabel(meal)}\n\n✅ হাজির: ${bn(counts.present)}\n❌ অনুপস্থিত: ${bn(counts.absent)}\n🏖️ ছুটি: ${bn(counts.leave)}\n\n— মোট ছাত্র: ${bn(rows.length)}`;

  const mealBtn = (m) => (
    <button key={m.key} type="button" onClick={() => setMeal(m.key)} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: `1.5px solid ${meal === m.key ? "#2E7D32" : "#cfd8cf"}`, background: meal === m.key ? "#2E7D32" : "#fff", color: meal === m.key ? "#fff" : "#4a5a4a" }}>{m.icon} {m.label}</button>
  );

  return (
    <div>
      <PageHeader icon={icon} title="মিল হাজিরা" description="ঐ বেলার মিল লিস্ট থেকে প্রকৃত হাজিরা নিন (মিল লিস্ট ও অনুমোদনে ব্যবহৃত হয়)" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<><Button variant="secondary" onClick={() => setShare(shareText())} icon="📤">পাঠান</Button><Button variant="secondary" onClick={doPrint} icon="🖨">প্রিন্ট</Button><Button onClick={save} loading={saving} icon="💾">সংরক্ষণ</Button></>} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
        {MEALS.map(mealBtn)}
        <div style={{ flex: 1 }} />
        <Button size="sm" variant="secondary" onClick={() => setAll("present")}>সবাই হাজির</Button>
        <Button size="sm" variant="secondary" onClick={() => setAll("absent")}>সবাই অনুপস্থিত</Button>
      </div>

      <StatRow>
        <StatCard icon="✅" label="হাজির" value={bn(counts.present)} color="#2E7D32" />
        <StatCard icon="❌" label="অনুপস্থিত" value={bn(counts.absent)} color="#E53935" />
        <StatCard icon="🏖️" label="ছুটি" value={bn(counts.leave)} color="#EF6C00" />
        <StatCard icon="👥" label="মোট ছাত্র" value={bn(rows.length)} color="#00838F" />
      </StatRow>

      <div style={{ marginTop: 14 }}>
        <DataTable columns={columns} rows={rows} loading={loading} exportName={`meal-attendance-${date}-${meal}`}
          empty={{ icon: "🍽️", title: "এই বেলায় কেউ নেই", description: "মিল প্রোফাইল/তারিখ যাচাই করুন" }} />
      </div>

      {share && <ShareModal title="মিল হাজিরা পাঠান" text={share} onClose={() => setShare(null)} />}
    </div>
  );
}
