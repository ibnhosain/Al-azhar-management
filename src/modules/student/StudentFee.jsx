import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, useToast, SelectField, TextareaField } from "../../ui";
import { students as studentsApi, feeReceipts } from "../../data";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const money = (n) => bn((Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 }));
const nz = (v) => Number(v) || 0;

const FUNDS = ["বোর্ডিং", "বেতন ফান্ড", "ভর্তি ফান্ড", "পরীক্ষা ফান্ড", "অন্যান্য"];
const YEARS = ["২০২৫", "২০২৬", "২০২৭"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthOpts = (year) => MONTHS.map((m, i) => ({ value: `${year}-${String(i + 1).padStart(2, "0")}`, label: `${m} ${year.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d))}` }));

const FEE_TEMPLATES = {
  "আবাসিক": [
    { fee: "বোর্ডিং চার্জ", fund: "বোর্ডিং", amount: 2700 },
    { fee: "বেতন ও আবাসন ফি", fund: "বেতন ফান্ড", amount: 1500 },
  ],
  "অনাবাসিক": [
    { fee: "বেতন", fund: "বেতন ফান্ড", amount: 500 },
  ],
};
const templateFor = (type) => (FEE_TEMPLATES[type] || FEE_TEMPLATES["অনাবাসিক"]).map((t) => ({ ...t, checked: true, received: t.amount, discount: 0 }));

// ── পেমেন্ট রিসিভ তৈরী (3-step) ──
function FeeCreate({ students, onBack, onSaved }) {
  const toast = useToast();
  const [cls, setCls] = useState("");
  const [studentId, setStudentId] = useState("");
  const [year, setYear] = useState("২০২৬");
  const [month, setMonth] = useState("");
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");
  const [dues, setDues] = useState([]);
  const [saving, setSaving] = useState(false);

  const classes = useMemo(() => [...new Set(students.map((s) => s.class).filter(Boolean))], [students]);
  const studentOpts = useMemo(() => [{ value: "", label: "— শিক্ষার্থী বাছুন —" },
    ...students.filter((s) => !cls || s.class === cls).map((s) => ({ value: String(s.id), label: `${s.name} | ${bn(s.code || s.roll || "")}` }))], [students, cls]);
  const student = students.find((s) => String(s.id) === String(studentId));

  // শিক্ষার্থী বাছলে ফি টেমপ্লেট বসাও (event handler → effect নয়)
  const pickStudent = (v) => {
    setStudentId(v);
    const s = students.find((x) => String(x.id) === String(v));
    setItems(s ? templateFor(s.student_type) : []);
  };

  // শিক্ষার্থী+মাস বদলালে আগের বকেয়া (setState শুধু async .then-এ)
  useEffect(() => {
    let alive = true;
    const p = studentId ? feeReceipts.dues(Number(studentId), month || null) : Promise.resolve([]);
    p.then((d) => { if (alive) setDues(d || []); });
    return () => { alive = false; };
  }, [studentId, month]);

  const setItem = (i, patch) => setItems((a) => a.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const dueOf = (it) => Math.max(0, nz(it.amount) - nz(it.received) - nz(it.discount));
  const active = items.filter((it) => it.checked);
  const tot = active.reduce((t, it) => ({ amount: t.amount + nz(it.amount), received: t.received + nz(it.received), discount: t.discount + nz(it.discount), due: t.due + dueOf(it) }), { amount: 0, received: 0, discount: 0, due: 0 });

  const save = async () => {
    if (!student) return toast.error("শিক্ষার্থী নির্বাচন করুন");
    if (!month) return toast.error("মাস নির্বাচন করুন");
    if (!active.length) return toast.error("অন্তত একটি ফি নির্বাচন করুন");
    setSaving(true);
    try {
      await feeReceipts.create({
        student_id: student.id, student_code: student.code, student_name: student.name,
        class: student.class, section: student.section, student_type: student.student_type,
        month, year, collector: "সুপার অ্যাডমিন", note,
        items: active.map((it) => ({ fee: it.fee, fund: it.fund, amount: nz(it.amount), received: nz(it.received), discount: nz(it.discount), due: dueOf(it) })),
      });
      toast.success("পেমেন্ট রিসিট সংরক্ষণ হয়েছে");
      onSaved && onSaved(); onBack && onBack();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const stepCircle = (n, label, done) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: done ? "#2E7D32" : "#e8efe8", color: done ? "#fff" : "#90A4AE", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{done ? "✓" : bn(n)}</div>
      <span style={{ fontSize: 12.5, color: done ? "#2E7D32" : "#90A4AE", fontWeight: 600 }}>{label}</span>
    </div>
  );

  return (
    <div>
      <PageHeader icon="💵" title="পেমেন্ট রিসিভ তৈরী" description="প্রথমে শিক্ষার্থী ও মাস নির্বাচন করুন, তারপর ফি বেছে নিন" onBack={onBack} />
      <Card style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", maxWidth: 620, margin: "0 auto" }}>
          {stepCircle(1, "শিক্ষার্থী নির্বাচন", !!student)}
          <div style={{ height: 2, background: "#e0e6e0", flex: 1 }} />
          {stepCircle(2, "ফি নির্বাচন", active.length > 0)}
          <div style={{ height: 2, background: "#e0e6e0", flex: 1 }} />
          {stepCircle(3, "পেমেন্ট সারসংক্ষেপ", tot.received > 0)}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 12 }}>🧑‍🎓 শিক্ষার্থীর তথ্য</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <SelectField label="ক্লাস (ঐচ্ছিক)" value={cls} onChange={(v) => { setCls(v); setStudentId(""); }} options={[{ value: "", label: "সকল শ্রেণী" }, ...classes.map((c) => ({ value: c, label: c }))]} />
          <SelectField label="শিক্ষার্থী *" value={studentId} onChange={pickStudent} options={studentOpts} />
          <SelectField label="বছর" value={year} onChange={(v) => { setYear(v); setMonth(""); }} options={YEARS} />
          <SelectField label="মাস *" value={month} onChange={setMonth} options={[{ value: "", label: "— মাস বাছুন —" }, ...monthOpts(year)]} />
        </div>
        {dues.length > 0 && (
          <div style={{ marginTop: 12, background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontWeight: 700, color: "#E65100", marginBottom: 8 }}>⚠️ পূর্বের মাসগুলোর বেতন বাকি আছে <Badge color="#EF6C00">{bn(dues.length)} মাস</Badge></div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {dues.map((d) => <div key={d.month} style={{ background: "#fff", border: "1px solid #FFE0B2", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>{d.month} <span style={{ color: "#E53935", fontWeight: 700 }}>বাকি: {money(d.due)} টাকা</span></div>)}
            </div>
          </div>
        )}
      </Card>

      {student && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 12 }}>💳 ফি নির্বাচন <Badge color="#00838F">{student.student_type || "—"}</Badge></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
              <thead><tr style={{ background: "#E8F5E9" }}>
                {["", "ফি", "ফান্ড", "পরিমাণ", "পরিশোধিত", "ছাড়", "বকেয়া"].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #cfe0cf" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef" }}><input type="checkbox" checked={it.checked} onChange={(e) => setItem(i, { checked: e.target.checked })} /></td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", fontWeight: 600 }}>{it.fee}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>
                      <select value={it.fund} onChange={(e) => setItem(i, { fund: e.target.value })} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cfd8cf" }}>{FUNDS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
                    </td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right" }}>{money(it.amount)}</td>
                    <td style={{ padding: "6px 6px", border: "1px solid #eef" }}><input value={it.received} onChange={(e) => setItem(i, { received: e.target.value.replace(/[^\d.]/g, "") })} style={{ width: 80, padding: "5px 6px", borderRadius: 6, border: "1px solid #cfd8cf", textAlign: "right" }} /></td>
                    <td style={{ padding: "6px 6px", border: "1px solid #eef" }}><input value={it.discount} onChange={(e) => setItem(i, { discount: e.target.value.replace(/[^\d.]/g, "") })} style={{ width: 70, padding: "5px 6px", borderRadius: 6, border: "1px solid #cfd8cf", textAlign: "right" }} /></td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", fontWeight: 700, color: dueOf(it) > 0 ? "#E53935" : "#2E7D32" }}>{money(dueOf(it))}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f1f8f1", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right" }}>Total:</td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right" }}>{money(tot.amount)}</td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right" }}>{money(tot.received)}</td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right" }}>{money(tot.discount)}</td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right", color: tot.due > 0 ? "#E53935" : "#2E7D32" }}>{money(tot.due)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 12 }}>🧾 পেমেন্ট সারসংক্ষেপ</div>
        <StatRow min={160}>
          <StatCard icon="🧮" label="মোট পরিমাণ" value={money(tot.amount)} color="#2E7D32" />
          <StatCard icon="💰" label="গ্রহণের পরিমাণ" value={money(tot.received)} color="#00838F" />
          <StatCard icon="🏷️" label="মোট ছাড়" value={money(tot.discount)} color="#EF6C00" />
          <StatCard icon="⚠️" label="মোট বকেয়া" value={money(tot.due)} color="#E53935" />
        </StatRow>
        <div style={{ marginTop: 12 }}><TextareaField label="নোট" value={note} onChange={setNote} rows={3} /></div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={save} loading={saving} icon="💾">সংরক্ষণ করুন - পেমেন্ট</Button>
      </div>
    </div>
  );
}

// ── বেতন তালিকা (list) ──
export default function StudentFee({ onBack }) {
  const toast = useToast();
  const [view, setView] = useState("list");
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flt, setFlt] = useState({ month: "", class: "", section: "", collector: "" });
  const [year, setYear] = useState("২০২৬");

  const reload = async () => { setRows(await feeReceipts.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => { const [s, r] = await Promise.all([studentsApi.list(), feeReceipts.list()]); if (alive) { setStudents(s); setRows(r); setLoading(false); } })();
    return () => { alive = false; };
  }, []);

  const classes = [...new Set(students.map((s) => s.class).filter(Boolean))];
  const sections = [...new Set(students.map((s) => s.section).filter(Boolean))];
  const collectors = [...new Set(rows.map((r) => r.collector).filter(Boolean))];

  const filtered = useMemo(() => rows.filter((r) =>
    (!flt.month || r.month === flt.month) && (!flt.class || r.class === flt.class) &&
    (!flt.section || r.section === flt.section) && (!flt.collector || r.collector === flt.collector)
  ), [rows, flt]);
  const tot = filtered.reduce((t, r) => ({ amount: t.amount + nz(r.total_amount), received: t.received + nz(r.total_received), discount: t.discount + nz(r.total_discount), due: t.due + nz(r.total_due) }), { amount: 0, received: 0, discount: 0, due: 0 });

  const del = async (r) => { if (!window.confirm("এই রিসিট মুছবেন?")) return; await feeReceipts.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };

  if (view === "create") return <FeeCreate students={students} onBack={() => setView("list")} onSaved={reload} />;

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 60, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "receipt_no", label: "রিসিট নং", sortable: true },
    { key: "student_name", label: "শিক্ষার্থী", sortable: true },
    { key: "class", label: "ক্লাস", render: (r) => r.class || "—" },
    { key: "month", label: "মাস", render: (r) => r.month || "—" },
    { key: "total_amount", label: "পরিমাণ", align: "right", render: (r) => money(r.total_amount), exportValue: (r) => r.total_amount },
    { key: "total_received", label: "গ্রহণ", align: "right", render: (r) => money(r.total_received), exportValue: (r) => r.total_received },
    { key: "total_due", label: "বাকি", align: "right", render: (r) => <b style={{ color: nz(r.total_due) > 0 ? "#E53935" : "#2E7D32" }}>{money(r.total_due)}</b>, exportValue: (r) => r.total_due },
    { key: "collector", label: "সংগ্রাহক", render: (r) => r.collector || "—" },
    { key: "__a", label: "কার্যক্রম", render: (r) => <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button> },
  ];

  return (
    <div>
      <PageHeader icon="💳" title="বেতন তালিকা" description="মাস, শ্রেণি, শাখা বা সংগ্রাহক দিয়ে ফিল্টার করে বেতন রিসিট ও মোট দেখুন।" onBack={onBack}
        breadcrumb={[{ label: "শিক্ষার্থী ব্যবস্থাপনা", onClick: onBack }, { label: "বেতন তালিকা" }]}
        actions={<>
          <Button onClick={() => setView("create")} icon="＋">তৈরি করুন</Button>
          <Button variant="secondary" onClick={() => toast.info("একাধিক তৈরি — শীঘ্রই যুক্ত হবে")} icon="≣">একাধিক তৈরি করুন</Button>
          <Button variant="secondary" onClick={() => setView("create")} icon="⚡">দ্রুত বেতন আদায়</Button>
        </>} />

      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 10 }}>🔎 ফিল্টার</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "0 16px" }}>
          <SelectField label="বছর" value={year} onChange={(v) => { setYear(v); setFlt({ ...flt, month: "" }); }} options={YEARS} />
          <SelectField label="মাস নির্বাচন করুন" value={flt.month} onChange={(v) => setFlt({ ...flt, month: v })} options={[{ value: "", label: "সকল মাস" }, ...monthOpts(year)]} />
          <SelectField label="শ্রেণী নির্বাচন করুন" value={flt.class} onChange={(v) => setFlt({ ...flt, class: v })} options={[{ value: "", label: "সকল শ্রেণী" }, ...classes.map((c) => ({ value: c, label: c }))]} />
          <SelectField label="সেকশন নির্বাচন করুন" value={flt.section} onChange={(v) => setFlt({ ...flt, section: v })} options={[{ value: "", label: "সকল সেকশন" }, ...sections.map((c) => ({ value: c, label: c }))]} />
          <SelectField label="সংগ্রাহক" value={flt.collector} onChange={(v) => setFlt({ ...flt, collector: v })} options={[{ value: "", label: "সব সংগ্রাহক" }, ...collectors.map((c) => ({ value: c, label: c }))]} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <Button variant="secondary" onClick={() => setFlt({ month: "", class: "", section: "", collector: "" })} icon="✕">ফিল্টার মুছুন</Button>
        </div>
      </Card>

      <StatRow>
        <StatCard icon="🧮" label="মোট পরিমাণ" value={money(tot.amount)} color="#2E7D32" />
        <StatCard icon="💰" label="মোট গ্রহণ" value={money(tot.received)} color="#00838F" />
        <StatCard icon="🏷️" label="মোট ছাড়" value={money(tot.discount)} color="#EF6C00" />
        <StatCard icon="⚠️" label="মোট বাকি" value={money(tot.due)} color="#E53935" />
      </StatRow>

      <div style={{ marginTop: 16 }}>
        <DataTable columns={columns} rows={filtered} loading={loading} exportName="fee-receipts"
          empty={{ icon: "🧾", title: "কোনো রিসিট নেই", description: "‘তৈরি করুন’ দিয়ে বেতন রিসিট তৈরি করুন" }} />
      </div>
    </div>
  );
}
