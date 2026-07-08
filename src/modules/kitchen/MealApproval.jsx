import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, useToast } from "../../ui";
import { mealApproval } from "../../data";
import { bn, todayISO, MEALS, mealLabel, approvalLabel, approvalColor } from "./constants";
import { printDoc, tableHtml } from "./print";
import ShareModal from "./ShareModal";

export default function MealApproval({ nav, icon }) {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState("lunch");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState(null);

  const load = useCallback(async () => setData(await mealApproval.status(date, meal)), [date, meal]);
  useEffect(() => {
    let alive = true;
    (async () => { const s = await mealApproval.status(date, meal); if (alive) setData(s); })();
    return () => { alive = false; };
  }, [date, meal]);

  const approve = async () => {
    setBusy(true);
    try { await mealApproval.approve(date, meal, {}); toast.success("অনুমোদিত — রেসিপি অনুযায়ী স্টক থেকে খরচ পোস্ট হয়েছে"); await load(); }
    catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setBusy(false); }
  };
  const revert = async () => {
    if (!window.confirm("অনুমোদন প্রত্যাহার করবেন? খরচ হওয়া স্টক ফেরত আসবে।")) return;
    setBusy(true);
    try { await mealApproval.revert(date, meal); toast.success("প্রত্যাহার হয়েছে — স্টক ফেরত এসেছে"); await load(); }
    catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const approved = data && data.status === "approved";

  const columns = [
    { key: "sl", label: "#", width: 46, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "ingredient", label: "উপকরণ", sortable: true },
    { key: "qty", label: "খরচ পরিমাণ", align: "right", render: (r) => bn(r.qty), sortable: true },
    { key: "unit", label: "একক", align: "center" },
  ];

  const doPrint = () => {
    if (!data) return;
    const body = (data.consumption || []).map((r, i) => [i + 1, r.ingredient, bn(r.qty), r.unit]);
    printDoc("মিল অনুমোদন", tableHtml(["#", "উপকরণ", "খরচ", "একক"], body, ["center", "left", "right", "center"]),
      { subtitle: `${date} • ${mealLabel(meal)} • মোট ${bn(data.total)} জন (${approvalLabel(data.status)})` });
  };
  const shareText = () => data ? `🍽️ মিল অনুমোদন\n📅 ${date} • ${mealLabel(meal)}\n\n✅ হাজির: ${bn(data.present)}\n👥 গেস্ট: ${bn(data.guest)}\n🍚 মোট মিল: ${bn(data.total)}\n📋 অবস্থা: ${approvalLabel(data.status)}` : "";

  const mealBtn = (m) => (
    <button key={m.key} type="button" onClick={() => setMeal(m.key)} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: `1.5px solid ${meal === m.key ? "#2E7D32" : "#cfd8cf"}`, background: meal === m.key ? "#2E7D32" : "#fff", color: meal === m.key ? "#fff" : "#4a5a4a" }}>{m.icon} {m.label}</button>
  );

  return (
    <div>
      <PageHeader icon={icon} title="মিল অনুমোদন" description="প্রকৃত সংখ্যা (হাজির + গেস্ট) চূড়ান্ত করুন — অনুমোদনে রেসিপি অনুযায়ী স্টক খরচ হয়" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<><Button variant="secondary" onClick={() => setShare(shareText())} icon="📤">পাঠান</Button><Button variant="secondary" onClick={doPrint} icon="🖨">প্রিন্ট</Button></>} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
        {MEALS.map(mealBtn)}
        <div style={{ flex: 1 }} />
        {data && <Badge color={approvalColor(data.status)}>{approvalLabel(data.status)}</Badge>}
      </div>

      <StatRow>
        <StatCard icon="✅" label="হাজির" value={bn(data ? data.present : 0)} color="#2E7D32" />
        <StatCard icon="👥" label="গেস্ট" value={bn(data ? data.guest : 0)} color="#6A1B9A" />
        <StatCard icon="🍚" label="মোট মিল" value={bn(data ? data.total : 0)} color="#EF6C00" />
        <StatCard icon="📋" label="অবস্থা" value={data ? approvalLabel(data.status) : "—"} color={data ? approvalColor(data.status) : "#90A4AE"} />
      </StatRow>

      {data && !data.hasMenu && (
        <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", color: "#8D6E00", padding: "12px 16px", borderRadius: 10, margin: "14px 0", fontWeight: 600 }}>
          ⚠️ এই বেলার মেনু নেই — অনুমোদন করা যাবে, তবে স্টক খরচ পোস্ট হবে না (মেনু থাকলে রেসিপি অনুযায়ী স্টক কমবে)।
        </div>
      )}

      <div style={{ display: "flex", gap: 10, margin: "14px 0" }}>
        {!approved && <Button onClick={approve} loading={busy} icon="✅">অনুমোদন ও স্টক খরচ</Button>}
        {approved && <Button variant="dangerSoft" onClick={revert} loading={busy} icon="↩">অনুমোদন প্রত্যাহার</Button>}
        {approved && data.approval && data.approval.approved_at && <span style={{ alignSelf: "center", color: "#607D8B", fontSize: 13 }}>অনুমোদিত: {data.approval.approved_at}</span>}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", background: "#F1F8F1", borderBottom: "1px solid #dcece0", fontWeight: 700, color: "#1b5e20", fontSize: 14 }}>
          🧂 আনুমানিক স্টক খরচ ({bn(data ? data.total : 0)} জন × রেসিপি){approved ? " — খরচ হয়েছে ✓" : ""}
        </div>
        <DataTable columns={columns} rows={data ? data.consumption : []} loading={!data} exportName={`meal-approval-${date}-${meal}`}
          empty={{ icon: "🧂", title: "খরচের হিসাব নেই", description: data && !data.hasMenu ? "এই বেলার মেনু তৈরি করুন" : "রেসিপিতে উপকরণ যোগ করুন" }} />
      </Card>

      {share && <ShareModal title="মিল অনুমোদন পাঠান" text={share} onClose={() => setShare(null)} />}
    </div>
  );
}
