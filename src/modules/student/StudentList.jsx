import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, Modal, useToast, SelectField, TextField } from "../../ui";
import { students as studentsApi, feeReceipts } from "../../data";
import StudentAdmission from "./StudentAdmission";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
// বাংলা/৳ সহ যেকোনো সংখ্যা → number
const num = (v) => {
  const en = String(v ?? "").replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
  const n = parseFloat(en.replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
};
const money = (n) => "৳ " + bn((Math.round(n * 100) / 100).toLocaleString("en-US"));

function Avatar({ src, name }) {
  return src
    ? <img src={src} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "1px solid #e0e6e0" }} />
    : <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E8F5E9", color: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{(name || "?").trim().slice(0, 1)}</div>;
}

const emptyFilters = { class: "", session: "", section: "", student_type: "", admission_type: "", orphan: "", gender: "" };

export default function StudentList({ onBack }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");     // list | admission
  const [flt, setFlt] = useState(emptyFilters);
  const [detail, setDetail] = useState(null);
  const [dueMap, setDueMap] = useState({});          // { [student_id]: {due, received} }
  const [summary, setSummary] = useState(null);      // detail-এর মাস-ভিত্তিক সারাংশ
  const [editFee, setEditFee] = useState(false);
  const [feeForm, setFeeForm] = useState({ monthly_fee: "", boarding_fee: "" });
  const [savingFee, setSavingFee] = useState(false);

  const reload = async () => {
    const [r, dm] = await Promise.all([studentsApi.list(), feeReceipts.duesByStudent().catch(() => ({}))]);
    setRows(r); setDueMap(dm || {}); setLoading(false);
  };
  useEffect(() => { let alive = true; (async () => {
    const [r, dm] = await Promise.all([studentsApi.list(), feeReceipts.duesByStudent().catch(() => ({}))]);
    if (alive) { setRows(r); setDueMap(dm || {}); setLoading(false); }
  })(); return () => { alive = false; }; }, []);

  // বিস্তারিত খুললে ঐ ছাত্রের মাস-ভিত্তিক বেতন সারাংশ লোড
  const openDetail = (r) => {
    setDetail(r); setSummary(null); setEditFee(false);
    setFeeForm({ monthly_fee: r.monthly_fee || "", boarding_fee: r.boarding_fee || "" });
    feeReceipts.summary(r.id).then(setSummary).catch(() => setSummary(null));
  };
  const saveFee = async () => {
    setSavingFee(true);
    try {
      await studentsApi.update(detail.id, { ...detail, monthly_fee: feeForm.monthly_fee, boarding_fee: feeForm.boarding_fee });
      toast.success("মাসিক বেতন সংরক্ষিত হয়েছে");
      setEditFee(false);
      setDetail({ ...detail, monthly_fee: feeForm.monthly_fee, boarding_fee: feeForm.boarding_fee });
      await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSavingFee(false); }
  };

  const distinct = (k) => [...new Set(rows.map((r) => r[k]).filter(Boolean))];
  const opts = (arr, all) => [{ value: "", label: all }, ...arr.map((v) => ({ value: v, label: v }))];

  const filtered = useMemo(() => rows.filter((r) =>
    (!flt.class || r.class === flt.class) &&
    (!flt.session || r.session === flt.session) &&
    (!flt.section || r.section === flt.section) &&
    (!flt.student_type || r.student_type === flt.student_type) &&
    (!flt.admission_type || r.admission_type === flt.admission_type) &&
    (!flt.orphan || r.orphan === flt.orphan) &&
    (!flt.gender || r.gender === flt.gender)
  ), [rows, flt]);

  const totalReceived = useMemo(() => filtered.reduce((s, r) => s + num(r.received ?? r.fee), 0), [filtered]);
  const totalDue = useMemo(() => filtered.reduce((s, r) => s + num(dueMap[r.id] && dueMap[r.id].due), 0), [filtered, dueMap]);

  const del = async (r) => { if (!window.confirm(`"${r.name}" মুছে ফেলবেন?`)) return; await studentsApi.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 64, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "__act", label: "কার্যক্রম", render: (r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <Button size="sm" variant="subtle" onClick={() => openDetail(r)}>👁</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
    { key: "photo", label: "ছবি", width: 56, render: (r) => <Avatar src={r.photo} name={r.name} /> },
    { key: "code", label: "রেজি নং", sortable: true, render: (r) => bn(r.code || "—") },
    { key: "roll", label: "রোল নং", sortable: true, render: (r) => bn(r.roll || "—") },
    { key: "dakhela_no", label: "দাখেলা নং", render: (r) => bn(r.dakhela_no || "—") },
    { key: "name", label: "নাম", sortable: true },
    { key: "mobile", label: "মোবাইল", render: (r) => bn(r.mobile || "—") },
    { key: "class", label: "ক্লাস", render: (r) => r.class || "—" },
    { key: "dept", label: "বিভাগ", render: () => "—" },
    { key: "session", label: "শিক্ষাবর্ষ", render: (r) => bn(r.session || "—") },
    { key: "student_type", label: "শিক্ষার্থী ধরন", render: (r) => r.student_type ? <Badge color={r.student_type === "আবাসিক" ? "#2E7D32" : "#0288D1"}>{r.student_type}</Badge> : "—", exportValue: (r) => r.student_type },
    { key: "admission_type", label: "ভর্তির ধরন", render: (r) => r.admission_type || "—" },
    { key: "received", label: "ভর্তি ফি গ্রহণ", align: "right", render: (r) => bn(num(r.received ?? r.fee).toLocaleString("en-US")), exportValue: (r) => num(r.received ?? r.fee) },
    { key: "monthly_fee", label: "মাসিক বেতন", align: "right", render: (r) => num(r.monthly_fee) ? money(num(r.monthly_fee)) : <span style={{ color: "#E53935" }}>নির্ধারিত নয়</span>, exportValue: (r) => num(r.monthly_fee) },
    { key: "due", label: "বকেয়া বেতন", align: "right", render: (r) => { const d = num(dueMap[r.id] && dueMap[r.id].due); return d > 0 ? <Badge color="#E53935">{money(d)}</Badge> : <span style={{ color: "#2E7D32" }}>—</span>; }, exportValue: (r) => num(dueMap[r.id] && dueMap[r.id].due) },
    { key: "father", label: "পিতা", render: (r) => r.father || "—" },
    { key: "status", label: "অবস্থা", render: (r) => <Badge color={r.status === "সক্রিয়" ? "#2E7D32" : "#E53935"}>{r.status || "সক্রিয়"}</Badge>, exportValue: (r) => r.status },
  ];

  if (mode === "admission") {
    return <StudentAdmission onBack={() => setMode("list")} onSaved={reload} />;
  }

  return (
    <div>
      <PageHeader icon="📋" title="শিক্ষার্থীর তালিকা" description="শ্রেণি · শিক্ষাবর্ষ · সেকশন" onBack={onBack}
        breadcrumb={[{ label: "শিক্ষার্থী ব্যবস্থাপনা", onClick: onBack }, { label: "শিক্ষার্থীর তালিকা" }]}
        actions={<Button onClick={() => setMode("admission")} icon="＋">তৈরি করুন</Button>} />

      <StatRow>
        <StatCard icon="👥" label="মোট শিক্ষার্থী" value={bn(filtered.length)} color="#2E7D32" />
        <StatCard icon="💵" label="মোট ভর্তি ফি গ্রহণ" value={money(totalReceived)} color="#00838F" />
        <StatCard icon="⚠️" label="মোট বকেয়া বেতন" value={money(totalDue)} color="#E53935" />
      </StatRow>

      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 12 }}>🔎 ফিল্টার করুন</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "0 16px" }}>
          <SelectField label="শ্রেণি" value={flt.class} onChange={(v) => setFlt({ ...flt, class: v })} options={opts(distinct("class"), "সকল শ্রেণি")} />
          <SelectField label="শিক্ষাবর্ষ" value={flt.session} onChange={(v) => setFlt({ ...flt, session: v })} options={opts(distinct("session"), "সকল শিক্ষাবর্ষ")} />
          <SelectField label="সেকশন" value={flt.section} onChange={(v) => setFlt({ ...flt, section: v })} options={opts(distinct("section"), "সকল সেকশন")} />
          <SelectField label="শিক্ষার্থী ধরন" value={flt.student_type} onChange={(v) => setFlt({ ...flt, student_type: v })} options={opts(["আবাসিক", "অনাবাসিক"], "সকল শিক্ষার্থী")} />
          <SelectField label="ভর্তির ধরন" value={flt.admission_type} onChange={(v) => setFlt({ ...flt, admission_type: v })} options={opts(["নতুন ভর্তি", "পুরাতন ভর্তি"], "সকল")} />
          <SelectField label="এতিম ধরন" value={flt.orphan} onChange={(v) => setFlt({ ...flt, orphan: v })} options={opts(["হ্যাঁ", "না"], "সকল")} />
          <SelectField label="লিঙ্গ" value={flt.gender} onChange={(v) => setFlt({ ...flt, gender: v })} options={opts(["ছাত্র", "ছাত্রী"], "সকল শিক্ষার্থী")} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Button variant="secondary" onClick={() => setFlt(emptyFilters)} icon="✕">ফিল্টার মুছে ফেলুন</Button>
        </div>
      </Card>

      <DataTable columns={columns} rows={filtered} loading={loading} exportName="student-list"
        empty={{ icon: "👥", title: "কোনো শিক্ষার্থী নেই", description: "‘তৈরি করুন’ দিয়ে নতুন ভর্তি করুন" }} />

      {detail && (
        <Modal title={detail.name} icon="🧑‍🎓" width={620} onClose={() => setDetail(null)}
          footer={<Button variant="secondary" onClick={() => setDetail(null)}>বন্ধ</Button>}>
          <div style={{ display: "flex", gap: 16, marginBottom: 14, alignItems: "center" }}>
            <Avatar src={detail.photo} name={detail.name} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#243B40" }}>{detail.name}</div>
              <div style={{ fontSize: 13, color: "#607D8B" }}>রেজি: {bn(detail.code || "—")} · রোল: {bn(detail.roll || "—")} · {detail.class || "—"}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13 }}>
            {[["পিতা", detail.father], ["মাতা", detail.mother], ["মোবাইল", bn(detail.mobile || "—")], ["জন্ম তারিখ", detail.dob],
              ["শিক্ষাবর্ষ", bn(detail.session || "—")], ["সেকশন", detail.section], ["শিক্ষার্থী ধরন", detail.student_type], ["ভর্তির ধরন", detail.admission_type],
              ["এতিম", detail.orphan], ["রক্তের গ্রুপ", detail.blood_group], ["দাখেলা নং", bn(detail.dakhela_no || "—")], ["ভর্তি ফি গ্রহণ", bn(num(detail.received ?? detail.fee).toLocaleString("en-US"))],
              ["সম্পর্ক", detail.relation], ["পেশা", detail.occupation],
              ["ঠিকানা", [detail.village, detail.post_office, detail.police_station, detail.district].filter(Boolean).join(", ")]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "#90A4AE", minWidth: 90 }}>{k}:</span>
                <span style={{ color: "#37474F", fontWeight: 600 }}>{v || "—"}</span>
              </div>
            ))}
          </div>

          {/* মাসিক বেতন নির্ধারণ (সম্পাদনাযোগ্য) */}
          <Card style={{ marginTop: 14, padding: 14, background: "#f7faf7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editFee ? 12 : 0 }}>
              <div style={{ fontWeight: 700, color: "#1b4d3e" }}>📅 মাসিক বেতন নির্ধারণ</div>
              {!editFee && <Button size="sm" variant="secondary" onClick={() => setEditFee(true)} icon="✏">সম্পাদনা</Button>}
            </div>
            {editFee ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                  <TextField label="মাসিক বেতন" value={feeForm.monthly_fee} onChange={(v) => setFeeForm((f) => ({ ...f, monthly_fee: v.replace(/[^\d.]/g, "") }))} />
                  <TextField label="মাসিক বোর্ডিং ফি" value={feeForm.boarding_fee} onChange={(v) => setFeeForm((f) => ({ ...f, boarding_fee: v.replace(/[^\d.]/g, "") }))} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
                  <Button size="sm" variant="secondary" onClick={() => setEditFee(false)}>বাতিল</Button>
                  <Button size="sm" onClick={saveFee} loading={savingFee} icon="💾">সংরক্ষণ</Button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", gap: 24, fontSize: 13, marginTop: 8 }}>
                <span>মাসিক বেতন: <b style={{ color: num(detail.monthly_fee) ? "#2E7D32" : "#E53935" }}>{num(detail.monthly_fee) ? money(num(detail.monthly_fee)) : "নির্ধারিত নয়"}</b></span>
                {detail.student_type === "আবাসিক" && <span>বোর্ডিং ফি: <b style={{ color: "#2E7D32" }}>{money(num(detail.boarding_fee))}</b></span>}
              </div>
            )}
          </Card>

          {/* মাস-ভিত্তিক বেতন ও বকেয়া breakdown */}
          <Card style={{ marginTop: 12, padding: 14 }}>
            <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 10 }}>💳 বেতন ও বকেয়া হিসাব
              {summary && <> <Badge color={summary.totalDue > 0 ? "#E53935" : "#2E7D32"}>মোট বকেয়া: {money(summary.totalDue)}</Badge></>}</div>
            {!summary ? <div style={{ color: "#90A4AE", fontSize: 13 }}>লোড হচ্ছে…</div>
              : summary.months.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13 }}>এখনো কোনো বেতন আদায় হয়নি।</div>
              : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 460 }}>
                    <thead><tr style={{ background: "#E8F5E9" }}>
                      {["মাস", "নির্ধারিত", "পরিশোধিত", "বকেয়া", "অবস্থা"].map((h) => <th key={h} style={{ padding: "7px 10px", textAlign: "left", border: "1px solid #cfe0cf" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {summary.months.map((m) => (
                        <tr key={m.month}>
                          <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{m.month}</td>
                          <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right" }}>{money(m.amount)}</td>
                          <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", color: "#2E7D32" }}>{money(m.received)}</td>
                          <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", color: m.due > 0 ? "#E53935" : "#2E7D32", fontWeight: 700 }}>{money(m.due)}</td>
                          <td style={{ padding: "6px 10px", border: "1px solid #eef" }}><Badge color={m.due > 0 ? "#E53935" : "#2E7D32"}>{m.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>
        </Modal>
      )}
    </div>
  );
}
