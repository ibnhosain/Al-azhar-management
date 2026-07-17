import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, useToast, SelectField, TextareaField } from "../../ui";
import { students as studentsApi, feeReceipts, receipts as receiptsApi } from "../../data";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const money = (n) => bn((Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 }));
const nz = (v) => Number(v) || 0;

const FUNDS = ["বোর্ডিং", "বেতন ফান্ড", "ভর্তি ফান্ড", "পরীক্ষা ফান্ড", "অন্যান্য"];
const YEARS = ["২০২৫", "২০২৬", "২০২৭"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthOpts = (year) => MONTHS.map((m, i) => ({ value: `${year}-${String(i + 1).padStart(2, "0")}`, label: `${m} ${year.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d))}` }));

const COLLECT_MODES = [
  { value: "full", label: "সম্পূর্ণ বেতন (চলতি মাস)" },
  { value: "due", label: "বকেয়া পরিশোধ (পূর্বের মাস)" },
];

// শিক্ষার্থীর নিজস্ব নির্ধারিত ফি + ঐ মাসের ইতিমধ্যে পরিশোধিত অনুযায়ী আইটেম তৈরি।
// amount = নির্ধারিত ফি (target); alreadyReceived/Discount = ঐ মাসে আগে যা পরিশোধ;
// received (input) = এবারের প্রস্তাবিত পরিশোধ (ডিফল্ট = বাকি)।
function buildItems(s, mnth, mode, summary) {
  if (!s) return [];
  const rec = (summary && summary.months || []).find((m) => m.month === mnth);
  const mk = (fee, fund, target, defChecked) => {
    const already = rec && (rec.items || []).find((x) => x.fee === fee);
    const aRecv = nz(already && already.received), aDisc = nz(already && already.discount);
    const tgt = already ? nz(already.amount) : nz(target);
    const remaining = Math.max(0, tgt - aRecv - aDisc);
    return { fee, fund, amount: tgt, alreadyReceived: aRecv, alreadyDiscount: aDisc,
      checked: mode === "due" ? remaining > 0 : defChecked, received: remaining, discount: 0 };
  };
  const items = [
    mk("বেতন", "বেতন ফান্ড", s.monthly_fee, true),
    mk("বোর্ডিং", "বোর্ডিং", s.boarding_fee, s.student_type === "আবাসিক"),
  ];
  // বকেয়া মোডে শুধু যেসব ফিতে বাকি আছে
  return mode === "due" ? items.filter((it) => (it.amount - it.alreadyReceived - it.alreadyDiscount) > 0) : items;
}

// অভিভাবকের রশিদ — এবারের আদায় + চলতি মাসের অবস্থা + সকল মাসের বকেয়া।
function printMoneyReceipt(d) {
  const paidRows = (d.paidItems || []).map((p) => `<tr><td style="padding:5px 0">${p.fee}</td><td style="padding:5px 0;text-align:right;font-weight:600">${money(p.paid)}</td></tr>`).join("");
  const dueRows = (d.dueMonths || []).length
    ? (d.dueMonths).map((m) => `<tr><td style="padding:4px 0;color:#546E7A">${m.month}</td><td style="padding:4px 0;text-align:right;color:#E53935;font-weight:700">${money(m.due)}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:6px 0;color:#2E7D32;text-align:center">কোনো বকেয়া নেই ✓</td></tr>`;
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Hind Siliguri',sans-serif;padding:20px;color:#263238;font-size:13px}
    @media print{body{padding:0}.no-print{display:none}}
  </style></head><body>
  <div style="border:2px solid #2E7D32;border-radius:10px;max-width:430px;margin:auto;overflow:hidden">
    <div style="background:#2E7D32;color:#fff;padding:14px 20px;text-align:center">
      <div style="font-size:18px;font-weight:700">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
      <div style="font-size:12px;opacity:.85;margin-top:3px">সদর, ময়মনসিংহ | +880 1747-658744</div>
    </div>
    <div style="background:#E8F5E9;padding:9px 20px;text-align:center;font-size:15px;font-weight:700;color:#1B5E20">💳 বেতন আদায়ের রশিদ</div>
    <div style="padding:16px 20px">
      <table style="width:100%;font-size:12.5px;margin-bottom:8px">
        <tr><td style="padding:3px 0;color:#546E7A;width:42%">রশিদ নং</td><td style="padding:3px 0;font-weight:600">: ${d.receiptNo || "—"}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">শিক্ষার্থী</td><td style="padding:3px 0;font-weight:600">: ${d.student || "—"}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">শ্রেণি / রোল</td><td style="padding:3px 0;font-weight:600">: ${d.class || "—"} / ${bn(d.roll) || "—"}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">মাস</td><td style="padding:3px 0;font-weight:600">: ${d.month || "—"}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">তারিখ</td><td style="padding:3px 0;font-weight:600">: ${bn(d.date) || "—"}</td></tr>
      </table>
      <div style="font-weight:700;color:#1b4d3e;border-top:1px dashed #cfd8cf;padding-top:8px;margin-bottom:2px">এবার আদায়</div>
      <table style="width:100%;font-size:13px">${paidRows}
        <tr style="border-top:1px solid #E0E0E0"><td style="padding:6px 0;font-weight:700">মোট আদায়</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:16px;color:#2E7D32">${money(d.paidNow)}</td></tr>
      </table>
      <div style="background:${d.monthDue > 0 ? "#FFF3E0" : "#E8F5E9"};border-radius:8px;padding:8px 12px;margin-top:10px;font-size:12.5px">
        <b>${d.month}</b> — নির্ধারিত ${money(d.monthAmount)} · পরিশোধিত ${money(d.monthReceived)} ·
        ${d.monthDue > 0 ? `বাকি <b style="color:#E53935">${money(d.monthDue)}</b>` : `<b style="color:#2E7D32">সম্পূর্ণ পরিশোধিত ✓</b>`}
      </div>
      <div style="font-weight:700;color:#1b4d3e;margin-top:12px;margin-bottom:2px">সকল মাসের বকেয়া</div>
      <table style="width:100%;font-size:12.5px">${dueRows}
        <tr style="border-top:1px solid #E0E0E0"><td style="padding:5px 0;font-weight:700">মোট বকেয়া</td><td style="padding:5px 0;text-align:right;font-weight:700;color:${d.totalDue > 0 ? "#E53935" : "#2E7D32"}">${money(d.totalDue)}</td></tr>
      </table>
    </div>
    <div style="border-top:1px dashed #E0E0E0;padding:12px 20px;display:flex;justify-content:space-between;font-size:11px;color:#90A4AE">
      <span>সংগ্রাহক: ${d.collector || "—"}</span><span>Easy Coding Space</span>
    </div>
  </div>
  <div class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="background:#2E7D32;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">🖨️ প্রিন্ট করুন</button>
    <button onclick="window.close()" style="background:#9E9E9E;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px;font-family:inherit">বন্ধ করুন</button>
  </div>
  </body></html>`);
  w.document.close();
}

// ── পেমেন্ট রিসিভ তৈরী (3-step) ──
function FeeCreate({ students, onBack, onSaved }) {
  const toast = useToast();
  const [cls, setCls] = useState("");
  const [studentId, setStudentId] = useState("");
  const [year, setYear] = useState("২০২৬");
  const [month, setMonth] = useState("");
  const [mode, setMode] = useState("full");
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");
  const [dues, setDues] = useState([]);
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);

  const classes = useMemo(() => [...new Set(students.map((s) => s.class).filter(Boolean))], [students]);
  const studentOpts = useMemo(() => [{ value: "", label: "— শিক্ষার্থী বাছুন —" },
    ...students.filter((s) => !cls || s.class === cls).map((s) => ({ value: String(s.id), label: `${s.name} | ${bn(s.code || s.roll || "")}` }))], [students, cls]);
  const student = students.find((s) => String(s.id) === String(studentId));
  const feeSet = student && (nz(student.monthly_fee) > 0 || nz(student.boarding_fee) > 0);

  // বকেয়া মোডে শুধু বকেয়াযুক্ত মাস; সম্পূর্ণ মোডে সব মাস
  const monthChoices = useMemo(() => {
    if (mode === "due") return [{ value: "", label: "— বকেয়া মাস বাছুন —" },
      ...((summary && summary.dueMonths) || []).map((m) => ({ value: m.month, label: `${m.month} · বাকি ${money(m.due)}` }))];
    return [{ value: "", label: "— মাস বাছুন —" }, ...monthOpts(year)];
  }, [mode, summary, year]);

  const rebuild = (s, mnth, md, summ) => setItems(buildItems(s, mnth, md, summ));

  // শিক্ষার্থী বাছলে সারাংশ লোড + টেমপ্লেট
  const pickStudent = (v) => {
    setStudentId(v); setMonth("");
    const s = students.find((x) => String(x.id) === String(v));
    setItems(s ? buildItems(s, "", mode, null) : []);
    if (v) feeReceipts.summary(Number(v)).then((sm) => { setSummary(sm); rebuild(s, "", mode, sm); }).catch(() => setSummary(null));
    else setSummary(null);
  };
  const pickMonth = (v) => { setMonth(v); rebuild(student, v, mode, summary); };
  const pickMode = (v) => { setMode(v); setMonth(""); rebuild(student, "", v, summary); };

  // শিক্ষার্থী+মাস বদলালে আগের বকেয়া (setState শুধু async .then-এ)
  useEffect(() => {
    let alive = true;
    const p = studentId ? feeReceipts.dues(Number(studentId), month || null) : Promise.resolve([]);
    p.then((d) => { if (alive) setDues(d || []); });
    return () => { alive = false; };
  }, [studentId, month]);

  const setItem = (i, patch) => setItems((a) => a.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  // এবারের পরিশোধের পর ঐ ফিতে অবশিষ্ট বকেয়া
  const dueOf = (it) => Math.max(0, nz(it.amount) - nz(it.alreadyReceived) - nz(it.alreadyDiscount) - nz(it.received) - nz(it.discount));
  const active = items.filter((it) => it.checked);
  const tot = active.reduce((t, it) => ({ amount: t.amount + nz(it.amount), received: t.received + nz(it.received), discount: t.discount + nz(it.discount), due: t.due + dueOf(it) }), { amount: 0, received: 0, discount: 0, due: 0 });
  const monthRec = (summary && summary.months || []).find((m) => m.month === month);

  const save = async (doPrint) => {
    if (!student) return toast.error("শিক্ষার্থী নির্বাচন করুন");
    if (!feeSet) return toast.error("এই শিক্ষার্থীর মাসিক বেতন নির্ধারিত নেই — ভর্তি তথ্য সম্পাদনা করে বেতন বসান");
    if (!month) return toast.error("মাস নির্বাচন করুন");
    if (!active.length) return toast.error("অন্তত একটি ফি নির্বাচন করুন");
    if (active.every((it) => nz(it.received) <= 0)) return toast.error("পরিশোধের পরিমাণ দিন");
    setSaving(true);
    try {
      const paidItems = active.filter((it) => nz(it.received) > 0).map((it) => ({ fee: it.fee, paid: nz(it.received) }));
      const saved = await feeReceipts.collect({
        student_id: student.id, student_code: student.code, student_name: student.name,
        class: student.class, section: student.section, student_type: student.student_type,
        month, year, collector: "সুপার অ্যাডমিন", note,
        // amount = নির্ধারিত ফি; received/discount = এবারের নতুন পরিশোধ (repo যোগ করবে)
        items: active.map((it) => ({ fee: it.fee, fund: it.fund, amount: nz(it.amount), received: nz(it.received), discount: nz(it.discount) })),
      });
      // প্রতিটি এবারের পরিশোধ আয় হিসেবে রশিদে (হিসাব ও অর্থ বিভাগ) যুক্ত হয়;
      // "বোর্ডিং" type হওয়ায় বোর্ডিং আয়েও গণ্য হয়।
      try {
        const existing = await receiptsApi.list();
        let n = Math.max(0, ...existing.map((r) => parseInt(String(r.code || "").replace(/\D/g, ""), 10)).filter((x) => !isNaN(x)));
        const today = new Date().toISOString().slice(0, 10);
        for (const it of active.filter((x) => nz(x.received) > 0)) {
          n += 1;
          await receiptsApi.create({
            code: "RCP-" + String(n).padStart(3, "0"),
            student: student.name, class: student.class, roll: student.roll,
            type: it.fee, amount: nz(it.received), date: today,
            status: dueOf(it) > 0 ? "বকেয়া" : "পরিশোধিত",
          });
        }
      } catch { /* রশিদ যুক্ত না হলেও মূল রিসিট সংরক্ষিত */ }
      const paidNow = tot.received;
      if (doPrint) {
        const fresh = await feeReceipts.summary(Number(student.id)).catch(() => null);
        printMoneyReceipt({
          receiptNo: saved && saved.receipt_no, student: student.name, class: student.class, roll: student.roll,
          month, date: (saved && saved.r_date) || new Date().toISOString().slice(0, 10), collector: "সুপার অ্যাডমিন",
          paidItems, paidNow,
          monthAmount: saved ? saved.total_amount : tot.amount,
          monthReceived: saved ? saved.total_received : tot.received,
          monthDue: saved ? saved.total_due : tot.due,
          dueMonths: (fresh && fresh.dueMonths) || [],
          totalDue: (fresh && fresh.totalDue) || 0,
        });
      }
      toast.success(`${money(paidNow)} টাকা আদায় হয়েছে · ${month} — ${saved && saved.total_due > 0 ? "বাকি " + money(saved.total_due) : "সম্পূর্ণ পরিশোধিত"}`);
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
          <SelectField label="আদায়ের ধরন *" value={mode} onChange={pickMode} options={COLLECT_MODES} />
          <SelectField label="বছর" value={year} onChange={(v) => { setYear(v); setMonth(""); rebuild(student, "", mode, summary); }} options={YEARS} />
          <SelectField label="মাস *" value={month} onChange={pickMonth} options={monthChoices} />
        </div>
        {student && !feeSet && (
          <div style={{ marginTop: 12, background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: 10, padding: "10px 14px", color: "#C62828", fontSize: 13, fontWeight: 600 }}>
            ⚠️ এই শিক্ষার্থীর মাসিক বেতন এখনো নির্ধারিত নেই। শিক্ষার্থী তালিকা → বিস্তারিত → “বেতন নির্ধারণ” থেকে মাসিক বেতন/বোর্ডিং বসান, নয়তো নিচের ঘরে পরিমাণ লিখে দিন।
          </div>
        )}
        {monthRec && (
          <div style={{ marginTop: 12, background: monthRec.due > 0 ? "#FFF3E0" : "#E8F5E9", border: `1px solid ${monthRec.due > 0 ? "#FFCC80" : "#A5D6A7"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
            <b>{month}</b> — নির্ধারিত {money(monthRec.amount)} · ইতিমধ্যে পরিশোধিত <b style={{ color: "#2E7D32" }}>{money(monthRec.received)}</b>
            {monthRec.due > 0
              ? <> · বাকি <b style={{ color: "#E53935" }}>{money(monthRec.due)}</b> <Badge color="#EF6C00">অসম্পূর্ণ</Badge></>
              : <> <Badge color="#2E7D32">✓ সম্পূর্ণ পরিশোধিত</Badge></>}
          </div>
        )}
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
                {["", "ফি", "ফান্ড", "নির্ধারিত", "আগে পরিশোধিত", "এবার পরিশোধ", "ছাড়", "বকেয়া"].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #cfe0cf" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef" }}><input type="checkbox" checked={it.checked} onChange={(e) => setItem(i, { checked: e.target.checked })} /></td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", fontWeight: 600 }}>{it.fee}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>
                      <select value={it.fund} onChange={(e) => setItem(i, { fund: e.target.value })} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #cfd8cf" }}>{FUNDS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
                    </td>
                    <td style={{ padding: "6px 6px", border: "1px solid #eef" }}><input value={it.amount} onChange={(e) => setItem(i, { amount: e.target.value.replace(/[^\d.]/g, "") })} style={{ width: 90, padding: "5px 6px", borderRadius: 6, border: "1px solid #cfd8cf", textAlign: "right" }} /></td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", color: "#607D8B" }}>{money(nz(it.alreadyReceived) + nz(it.alreadyDiscount))}</td>
                    <td style={{ padding: "6px 6px", border: "1px solid #eef" }}><input value={it.received} onChange={(e) => setItem(i, { received: e.target.value.replace(/[^\d.]/g, "") })} style={{ width: 80, padding: "5px 6px", borderRadius: 6, border: "1px solid #cfd8cf", textAlign: "right" }} /></td>
                    <td style={{ padding: "6px 6px", border: "1px solid #eef" }}><input value={it.discount} onChange={(e) => setItem(i, { discount: e.target.value.replace(/[^\d.]/g, "") })} style={{ width: 70, padding: "5px 6px", borderRadius: 6, border: "1px solid #cfd8cf", textAlign: "right" }} /></td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", fontWeight: 700, color: dueOf(it) > 0 ? "#E53935" : "#2E7D32" }}>{money(dueOf(it))}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f1f8f1", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right" }}>Total:</td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right" }}>{money(tot.amount)}</td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cfe0cf", textAlign: "right", color: "#607D8B" }}>{money(active.reduce((s, it) => s + nz(it.alreadyReceived) + nz(it.alreadyDiscount), 0))}</td>
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

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="secondary" onClick={() => save(false)} loading={saving} icon="💾">সংরক্ষণ করুন</Button>
        <Button onClick={() => save(true)} loading={saving} icon="🖨️">সংরক্ষণ ও রশিদ প্রিন্ট</Button>
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
