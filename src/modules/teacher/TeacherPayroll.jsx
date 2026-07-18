import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, Modal, useToast, TextField, SelectField, ComboField, DateField, TextareaField } from "../../ui";
import { salaryLedger, salaryReceipt } from "../../data";
import TeacherReports from "./TeacherReports";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const nz = (v) => { const e = String(v ?? "").replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d)); const n = parseFloat(e.replace(/[^\d.]/g, "")); return isNaN(n) ? 0 : n; };
const money = (n) => "৳" + bn((Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-US"));
const todayISO = () => new Date().toISOString().slice(0, 10);

const CAT_LABEL = { salary: "বেতন", allowance: "ভাতা", bonus: "বোনাস", payment: "পরিশোধ", advance: "অগ্রিম", loan: "ঋণ", deduction: "কর্তন", adjustment: "সমন্বয়" };
const METHODS = ["নগদ", "ব্যাংক", "মোবাইল ব্যাংকিং", "চেক"];
const TXN_TYPES = [
  { value: "payment", label: "বেতন পরিশোধ" },
  { value: "advance", label: "অগ্রিম বেতন" },
  { value: "loan", label: "ঋণ প্রদান" },
  { value: "deduction", label: "কর্তন / জরিমানা" },
];
const STATUS_COLOR = { "পরিশোধিত": "#2E7D32", "আংশিক": "#EF6C00", "বকেয়া": "#E53935", "—": "#90A4AE" };

// শেষ ১২ মাস (YYYY-MM) — বাংলা লেবেলসহ
const MONTHS_BN = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
function recentMonths(n = 15) {
  const out = []; const d = new Date();
  for (let i = 0; i < n; i++) { const y = d.getFullYear(), m = d.getMonth(); out.push({ value: `${y}-${String(m + 1).padStart(2, "0")}`, label: `${MONTHS_BN[m]} ${bn(y)}` }); d.setMonth(d.getMonth() - 1); }
  return out;
}
const monthLabel = (ym) => { const m = /^(\d{4})-(\d{2})$/.exec(String(ym || "")); return m ? `${MONTHS_BN[+m[2] - 1]} ${bn(m[1])}` : (ym || "—"); };

// রশিদ কার্ডের HTML (বাটন ছাড়া) — নিচে প্রদানকারী/গ্রহীতার স্বাক্ষর।
function receiptCardHTML(d) {
  const payRows = (d.payItems || []).map((p) => `<tr><td style="padding:5px 0">${p.label}</td><td style="padding:5px 0;text-align:right;font-weight:600">${money(p.amount)}</td></tr>`).join("");
  const dueRows = (d.dueMonths || []).length
    ? d.dueMonths.map((m) => `<tr><td style="padding:4px 0;color:#546E7A">${monthLabel(m.month)}</td><td style="padding:4px 0;text-align:right;color:#E53935;font-weight:700">${money(m.due)}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:6px 0;color:#2E7D32;text-align:center">কোনো বকেয়া নেই ✓</td></tr>`;
  return `<div style="border:2px solid #1565C0;border-radius:10px;max-width:430px;margin:auto;overflow:hidden">
    <div style="background:#1565C0;color:#fff;padding:14px 20px;text-align:center">
      <div style="font-size:18px;font-weight:700">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
      <div style="font-size:12px;opacity:.85;margin-top:3px">সদর, ময়মনসিংহ | +880 1747-658744</div>
    </div>
    <div style="background:#E3F2FD;padding:9px 20px;text-align:center;font-size:15px;font-weight:700;color:#0D47A1">👨‍🏫 বেতন পরিশোধের রশিদ</div>
    <div style="padding:16px 20px">
      <table style="width:100%;font-size:12.5px;margin-bottom:8px">
        <tr><td style="padding:3px 0;color:#546E7A;width:42%">শিক্ষক</td><td style="padding:3px 0;font-weight:600">: ${d.teacher || "—"}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">আইডি</td><td style="padding:3px 0;font-weight:600">: ${d.code || "—"}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">মাস</td><td style="padding:3px 0;font-weight:600">: ${monthLabel(d.month)}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">তারিখ</td><td style="padding:3px 0;font-weight:600">: ${bn(d.date)}</td></tr>
        <tr><td style="padding:3px 0;color:#546E7A">মাধ্যম</td><td style="padding:3px 0;font-weight:600">: ${d.method || "—"}${d.reference ? " (" + d.reference + ")" : ""}</td></tr>
      </table>
      <div style="font-weight:700;color:#0D47A1;border-top:1px dashed #cfd8cf;padding-top:8px;margin-bottom:2px">এবার পরিশোধ</div>
      <table style="width:100%;font-size:13px">${payRows}
        <tr style="border-top:1px solid #E0E0E0"><td style="padding:6px 0;font-weight:700">মোট পরিশোধ</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:16px;color:#1565C0">${money(d.paidNow)}</td></tr>
      </table>
      <div style="background:${d.monthDue > 0 ? "#FFF3E0" : "#E8F5E9"};border-radius:8px;padding:8px 12px;margin-top:10px;font-size:12.5px">
        <b>${monthLabel(d.month)}</b> — প্রাপ্য ${money(d.monthEarned)} · পরিশোধিত ${money(d.monthPaid)} ·
        ${d.monthDue > 0 ? `বাকি <b style="color:#E53935">${money(d.monthDue)}</b>` : `<b style="color:#2E7D32">সম্পূর্ণ পরিশোধিত ✓</b>`}
      </div>
      <div style="font-weight:700;color:#0D47A1;margin-top:12px;margin-bottom:2px">সকল মাসের বকেয়া</div>
      <table style="width:100%;font-size:12.5px">${dueRows}
        <tr style="border-top:1px solid #E0E0E0"><td style="padding:5px 0;font-weight:700">মোট বকেয়া</td><td style="padding:5px 0;text-align:right;font-weight:700;color:${d.totalDue > 0 ? "#E53935" : "#2E7D32"}">${money(d.totalDue)}</td></tr>
      </table>
    </div>
    <div style="border-top:1px dashed #E0E0E0;padding:26px 20px 14px;display:flex;justify-content:space-between;font-size:11.5px;color:#546E7A">
      <div style="text-align:center"><div style="border-top:1px solid #90A4AE;width:120px;margin-bottom:4px"></div>গ্রহীতার স্বাক্ষর</div>
      <div style="text-align:center"><div style="border-top:1px solid #90A4AE;width:120px;margin-bottom:4px"></div>প্রদানকারীর স্বাক্ষর${d.collectedBy ? `<br><span style="color:#90A4AE">(${d.collectedBy})</span>` : ""}</div>
    </div>
  </div>`;
}

// পূর্ণ HTML ডকুমেন্ট (প্রিন্ট বাটনসহ/ছাড়া)।
function receiptDocHTML(d, withButtons) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Hind Siliguri',sans-serif;padding:20px;color:#263238;font-size:13px;background:#fff}
  @media print{body{padding:0}.no-print{display:none}}</style></head><body>
  ${receiptCardHTML(d)}
  ${withButtons ? `<div class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="background:#1565C0;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">🖨️ প্রিন্ট করুন</button>
    <button onclick="window.close()" style="background:#9E9E9E;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px;font-family:inherit">বন্ধ করুন</button>
  </div>` : ""}
  </body></html>`;
}

// আসল প্রিন্ট উইন্ডো (এখন থেকে সংরক্ষিত রশিদ পুনঃপ্রিন্টেও ব্যবহৃত)।
function printSalaryReceipt(d) {
  const w = window.open("", "_blank");
  w.document.write(receiptDocHTML(d, true));
  w.document.close();
}

// ── পে-রোল ড্যাশবোর্ড ──
function PayrollDashboard({ onOpenTeacher, onOpenReports, onBack }) {
  const [d, setD] = useState(null);
  useEffect(() => { salaryLedger.dashboard().then(setD).catch(() => setD(null)); }, []);
  return (
    <div>
      <PageHeader icon="💰" title="পে-রোল ড্যাশবোর্ড" description="সকল শিক্ষকের বেতন, পরিশোধ ও বকেয়ার সারসংক্ষেপ" onBack={onBack}
        actions={<Button variant="secondary" onClick={onOpenReports} icon="📊">রিপোর্ট</Button>} />
      <StatRow>
        <StatCard icon="👥" label="মোট শিক্ষক" value={bn(d ? d.teacherCount : 0)} color="#8E24AA" />
        <StatCard icon="💵" label="মোট মাসিক বেতন" value={money(d ? d.totalMonthlySalary : 0)} color="#00838F" />
        <StatCard icon="✅" label="মোট পরিশোধ" value={money(d ? d.totalPaid : 0)} color="#2E7D32" />
        <StatCard icon="⚠️" label="মোট বকেয়া" value={money(d ? d.totalDue : 0)} color="#E53935" />
        <StatCard icon="🕗" label="বকেয়া শিক্ষক" value={bn(d ? d.dueTeacherCount : 0)} color="#EF6C00" />
      </StatRow>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 10 }}>⚠️ বকেয়া শিক্ষকগণ</div>
          {!d ? <div style={{ color: "#90A4AE" }}>লোড হচ্ছে…</div>
            : d.dueTeachers.length === 0 ? <div style={{ color: "#2E7D32" }}>কোনো বকেয়া নেই ✓</div>
            : d.dueTeachers.map((t) => (
              <div key={t.id} onClick={() => onOpenTeacher(t)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderBottom: "1px solid #f0f4f0", cursor: "pointer" }}>
                <span style={{ fontWeight: 600, color: "#37474F" }}>{t.name} <span style={{ color: "#90A4AE", fontWeight: 400 }}>· {t.code}</span></span>
                <Badge color="#E53935">{money(t.due)}</Badge>
              </div>
            ))}
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 10 }}>🧾 সাম্প্রতিক পরিশোধ</div>
          {!d ? <div style={{ color: "#90A4AE" }}>লোড হচ্ছে…</div>
            : d.recentPayments.length === 0 ? <div style={{ color: "#90A4AE" }}>এখনো কোনো পরিশোধ নেই</div>
            : d.recentPayments.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderBottom: "1px solid #f0f4f0" }}>
                <span style={{ color: "#37474F" }}>{p.teacher_name} <span style={{ color: "#90A4AE" }}>· {monthLabel(p.month)}</span></span>
                <span><b style={{ color: "#2E7D32" }}>{money(p.amount)}</b> <span style={{ color: "#90A4AE", fontSize: 12 }}>{bn(p.txn_date)}</span></span>
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
}

// ── এক শিক্ষকের বেতন স্টেটমেন্ট (ব্যাংক-স্টেটমেন্ট স্টাইল) ──
export default function TeacherPayroll({ teacher, startDashboard, onBack, embedded }) {
  const toast = useToast();
  const [view, setView] = useState(startDashboard ? "dashboard" : "statement");
  const [current, setCurrent] = useState(teacher || null);
  const [stmt, setStmt] = useState(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receipts, setReceipts] = useState([]);         // সংরক্ষিত রশিদ
  const [preview, setPreview] = useState(null);          // { d, savedId } — রশিদ প্রিভিউ মডাল
  const [savingReceipt, setSavingReceipt] = useState(false);
  const emptyPay = () => ({ txn_type: "payment", month: recentMonths(1)[0].value, salary: current ? String(nz(current.salary)) : "", allowance: "", bonus: "", deduction: "", pay_amount: "", method: "নগদ", reference: "", notes: "", collected_by: "সুপার অ্যাডমিন", txn_date: todayISO() });
  const [pay, setPay] = useState(emptyPay());
  const setP = (k, v) => setPay((f) => ({ ...f, [k]: v }));

  const loadStmt = (tid) => salaryLedger.statement(tid).then(setStmt).catch(() => setStmt(null));
  const loadReceipts = (tid) => salaryReceipt.list(tid).then((r) => setReceipts(r || [])).catch(() => setReceipts([]));
  useEffect(() => { if (current && view === "statement") { loadStmt(current.id); loadReceipts(current.id); } }, [current, view]);

  const openTeacher = (t) => { setCurrent(t); setView("statement"); };

  const monthRec = useMemo(() => (stmt && stmt.months || []).find((m) => m.month === pay.month), [stmt, pay.month]);

  const openPay = () => { setPay(emptyPay()); setModal(true); };

  const isPayment = pay.txn_type === "payment";
  const doSave = async (doPrint) => {
    if (isPayment && !nz(pay.salary)) return toast.error("এই মাসের নির্ধারিত বেতন দিন");
    if (isPayment && nz(pay.pay_amount) <= 0 && !nz(pay.allowance) && !nz(pay.bonus) && !nz(pay.deduction)) return toast.error("পরিশোধ বা ভাতা/বোনাস/কর্তন — অন্তত একটি দিন");
    if (!isPayment && nz(pay.pay_amount) <= 0) return toast.error("পরিমাণ দিন");
    setSaving(true);
    try {
      // payment: মাসের বেতন accrue + পরিশোধ। advance/loan/deduction: শুধু ঐ লেনদেন (accrual নয়)।
      const res = await salaryLedger.collect({
        teacher_id: current.id, teacher_code: current.code, teacher_name: current.name,
        month: pay.month,
        salary: isPayment ? nz(pay.salary) : 0, allowance: isPayment ? nz(pay.allowance) : 0, bonus: isPayment ? nz(pay.bonus) : 0, deduction: isPayment ? nz(pay.deduction) : 0,
        pay_amount: nz(pay.pay_amount), pay_category: pay.txn_type,
        method: pay.method, reference: pay.reference, notes: pay.notes,
        collected_by: pay.collected_by, txn_date: pay.txn_date,
      });
      const fresh = res.statement;
      setStmt(fresh);
      toast.success("বেতন লেজারে সংরক্ষিত হয়েছে");
      setModal(false);
      // রশিদ প্রিভিউ (প্রিন্ট/সংরক্ষণ বাটনসহ) — শুধু পরিশোধ থাকলে
      if (doPrint && nz(pay.pay_amount) > 0) {
        const mr = fresh.months.find((m) => m.month === pay.month) || {};
        setPreview({ savedId: null, ledgerId: res.payment && res.payment.id, d: {
          teacher: current.name, code: current.code, month: pay.month, date: pay.txn_date, method: pay.method, reference: pay.reference,
          payItems: [{ label: TXN_TYPES.find((x) => x.value === pay.txn_type)?.label || "বেতন পরিশোধ", amount: nz(pay.pay_amount) }],
          paidNow: nz(pay.pay_amount), monthEarned: mr.earned || 0, monthPaid: mr.paid || 0, monthDue: mr.due || 0,
          dueMonths: fresh.dueMonths || [], totalDue: fresh.due || 0, collectedBy: pay.collected_by,
        } });
      }
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  // রশিদ প্রিভিউ থেকে সংরক্ষণ → শিক্ষকের পোর্টালে
  const saveReceipt = async () => {
    if (!preview || preview.savedId) return;
    setSavingReceipt(true);
    try {
      const d = preview.d;
      const row = await salaryReceipt.add({
        teacher_id: current.id, ledger_id: preview.ledgerId, teacher_name: d.teacher, teacher_code: d.code,
        month: d.month, amount: d.paidNow, method: d.method, reference: d.reference, collected_by: d.collectedBy,
        r_date: d.date, snapshot: d,
      });
      setPreview((p) => ({ ...p, savedId: row.id }));
      await loadReceipts(current.id);
      toast.success("রশিদ শিক্ষকের পোর্টালে সংরক্ষিত হয়েছে");
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSavingReceipt(false); }
  };
  const delReceipt = async (r) => {
    if (!window.confirm(`রশিদ ${r.receipt_no} মুছবেন?`)) return;
    await salaryReceipt.remove(r.id); toast.success("রশিদ মুছে ফেলা হয়েছে"); await loadReceipts(current.id);
  };

  const doReverse = async (row) => {
    if (!window.confirm(`লেনদেন #${row.id} বাতিল/সংশোধন করবেন? (মূল সারি মুছবে না — বিপরীত এন্ট্রি যোগ হবে)`)) return;
    try { await salaryLedger.reverse(row.id, { notes: "ভুল সংশোধন" }); toast.success("সংশোধন এন্ট্রি যোগ হয়েছে"); await loadStmt(current.id); }
    catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
  };

  if (view === "reports") return <TeacherReports onBack={() => setView("dashboard")} />;
  if (view === "dashboard") return <PayrollDashboard onOpenTeacher={openTeacher} onOpenReports={() => setView("reports")} onBack={onBack} />;
  if (!current) return null;

  const paidPct = stmt && stmt.totalEarned > 0 ? Math.min(100, Math.round((stmt.totalPaid / stmt.totalEarned) * 100)) : 0;

  const ledgerCols = [
    { key: "txn_date", label: "তারিখ", render: (r) => bn(r.txn_date), sortable: true },
    { key: "month", label: "মাস", render: (r) => monthLabel(r.month) },
    { key: "desc", label: "বিবরণ", render: (r) => <span>{CAT_LABEL[r.category] || r.category}{r.reversed_of ? ` (সংশোধন #${r.reversed_of})` : ""}{r.notes ? <span style={{ color: "#90A4AE" }}> · {r.notes}</span> : ""}</span> },
    { key: "credit", label: "প্রাপ্য (+)", align: "right", render: (r) => r.kind === "earning" ? <span style={{ color: "#2E7D32", fontWeight: 600 }}>{money(r.amount)}</span> : "—", exportValue: (r) => r.kind === "earning" ? r.amount : 0 },
    { key: "debit", label: "পরিশোধ/কর্তন (−)", align: "right", render: (r) => r.kind !== "earning" ? <span style={{ color: "#C62828", fontWeight: 600 }}>{money(r.amount)}</span> : "—", exportValue: (r) => r.kind !== "earning" ? r.amount : 0 },
    { key: "balance", label: "ব্যালেন্স", align: "right", render: (r) => <b style={{ color: r.balance > 0 ? "#E53935" : "#2E7D32" }}>{money(r.balance)}</b>, exportValue: (r) => r.balance },
    { key: "__a", label: "", render: (r) => r.category !== "adjustment" ? <Button size="sm" variant="subtle" onClick={() => doReverse(r)} title="বাতিল/সংশোধন">↩</Button> : null },
  ];

  return (
    <div>
      {embedded ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: "#1b4d3e", fontSize: 15 }}>🏦 বেতন লেজার <span style={{ fontSize: 12, color: "#90A4AE", fontWeight: 400 }}>· ব্যাংক-স্টেটমেন্ট নীতি</span></div>
          <Button onClick={openPay} icon="＋">বেতন পরিশোধ</Button>
        </div>
      ) : (
        <PageHeader icon="👨‍🏫" title={`বেতন লেজার — ${current.name}`} description={`আইডি ${current.code || "—"} · মাসিক বেতন ${money(nz(current.salary))} · ব্যাংক-স্টেটমেন্ট নীতি (স্থায়ী লেনদেন)`}
          onBack={onBack}
          actions={<><Button variant="secondary" onClick={() => setView("dashboard")} icon="📊">ড্যাশবোর্ড</Button><Button onClick={openPay} icon="＋">বেতন পরিশোধ</Button></>} />
      )}

      <StatRow>
        <StatCard icon="📈" label="মোট প্রাপ্য (accrued)" value={money(stmt ? stmt.totalEarned : 0)} color="#00838F" />
        <StatCard icon="✅" label="মোট পরিশোধ" value={money(stmt ? stmt.totalPaid : 0)} color="#2E7D32" />
        <StatCard icon="➖" label="মোট কর্তন" value={money(stmt ? stmt.totalDeducted : 0)} color="#EF6C00" />
        <StatCard icon={stmt && stmt.balance < 0 ? "💠" : "⚠️"} label={stmt && stmt.balance < 0 ? "অতিরিক্ত পরিশোধ" : "নিট বকেয়া"} value={money(stmt ? Math.abs(stmt.balance) : 0)} color={stmt && stmt.balance < 0 ? "#1565C0" : "#E53935"} />
      </StatRow>

      {/* Progress bar */}
      <Card style={{ padding: 16, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#37474F" }}>
          <span>পরিশোধের অগ্রগতি</span><span>{bn(paidPct)}%</span>
        </div>
        <div style={{ height: 12, borderRadius: 8, background: "#eceff1", overflow: "hidden" }}>
          <div style={{ width: `${paidPct}%`, height: "100%", background: paidPct >= 100 ? "#2E7D32" : "#42A5F5", transition: "width .3s" }} />
        </div>
      </Card>

      {/* মাস-ভিত্তিক রোলআপ */}
      <Card style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 10 }}>📅 মাস-ভিত্তিক বেতন হিসাব</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead><tr style={{ background: "#E8F5E9" }}>{["মাস", "প্রাপ্য", "পরিশোধিত", "কর্তন", "বকেয়া", "অবস্থা"].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #cfe0cf" }}>{h}</th>)}</tr></thead>
            <tbody>
              {!stmt || stmt.months.length === 0 ? <tr><td colSpan={6} style={{ padding: 14, color: "#90A4AE", textAlign: "center" }}>এখনো কোনো বেতন এন্ট্রি নেই — “বেতন পরিশোধ” দিয়ে শুরু করুন</td></tr>
                : stmt.months.map((m) => (
                  <tr key={m.month}>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{monthLabel(m.month)}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right" }}>{money(m.earned)}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", color: "#2E7D32" }}>{money(m.paid)}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", color: "#EF6C00" }}>{money(m.deducted)}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", fontWeight: 700, color: m.due > 0 ? "#E53935" : "#2E7D32" }}>{money(m.due)}</td>
                    <td style={{ padding: "6px 10px", border: "1px solid #eef" }}><Badge color={STATUS_COLOR[m.status]}>{m.status}</Badge></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* পূর্ণ লেজার (ব্যাংক স্টেটমেন্ট) */}
      <div style={{ marginTop: 16, fontWeight: 700, color: "#1b4d3e" }}>🏦 লেনদেন লেজার <span style={{ fontSize: 12, color: "#90A4AE", fontWeight: 400 }}>— প্রতিটি সারি স্থায়ী; কখনো মুছে না</span></div>
      <div style={{ marginTop: 8 }}>
        <DataTable columns={ledgerCols} rows={stmt ? stmt.transactions : []} loading={!stmt} exportName={`salary-${current.code || current.id}`}
          empty={{ icon: "🏦", title: "লেজার খালি", description: "‘বেতন পরিশোধ’ দিয়ে প্রথম এন্ট্রি করুন" }} />
      </div>

      {/* সংরক্ষিত রশিদ — পরে যেকোনো সময় প্রিন্ট বা ডিলিট */}
      <Card style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 10 }}>🧾 সংরক্ষিত রশিদ <Badge color="#1565C0">{bn(receipts.length)}</Badge> <span style={{ fontSize: 12, color: "#90A4AE", fontWeight: 400 }}>— পরে যেকোনো সময় প্রিন্ট বা ডিলিট করা যাবে</span></div>
        {receipts.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13 }}>এখনো কোনো রশিদ সংরক্ষণ করা হয়নি। বেতন পরিশোধের পর রশিদ প্রিভিউতে “সংরক্ষণ করুন” দিন।</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
                <thead><tr style={{ background: "#E3F2FD" }}>{["রশিদ নং", "মাস", "পরিমাণ", "তারিখ", "মাধ্যম", "কার্যক্রম"].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #cfe0f0" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef", fontWeight: 600 }}>{r.receipt_no}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{monthLabel(r.month)}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef", textAlign: "right", color: "#1565C0", fontWeight: 700 }}>{money(r.amount)}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{bn(r.r_date)}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{r.method || "—"}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <Button size="sm" variant="subtle" onClick={() => r.snapshot && printSalaryReceipt(r.snapshot)} title="প্রিন্ট">🖨️</Button>
                          <Button size="sm" variant="dangerSoft" onClick={() => delReceipt(r)} title="মুছুন">🗑</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {preview && (
        <Modal title="বেতন রশিদ" icon="🧾" width={520} onClose={() => setPreview(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setPreview(null)}>বন্ধ করুন</Button>
            <Button variant="secondary" onClick={() => printSalaryReceipt(preview.d)} icon="🖨️">প্রিন্ট করুন</Button>
            <Button onClick={saveReceipt} loading={savingReceipt} disabled={!!preview.savedId} icon={preview.savedId ? "✓" : "💾"}>{preview.savedId ? "সংরক্ষিত" : "সংরক্ষণ করুন"}</Button>
          </>}>
          <iframe title="receipt" srcDoc={receiptDocHTML(preview.d, false)} style={{ width: "100%", height: 560, border: "1px solid #e0e0e0", borderRadius: 8 }} />
        </Modal>
      )}

      {modal && (
        <Modal title={`বেতন পরিশোধ — ${current.name}`} icon="💰" width={640} onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button variant="secondary" onClick={() => doSave(false)} loading={saving} icon="💾">সংরক্ষণ</Button><Button onClick={() => doSave(true)} loading={saving} icon="🖨️">সংরক্ষণ ও রশিদ</Button></>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <SelectField label="লেনদেনের ধরন" value={pay.txn_type} onChange={(v) => setP("txn_type", v)} options={TXN_TYPES} />
            <ComboField label="মাস (বেছে নিন / পুরনো মাস)" value={pay.month} onChange={(v) => setP("month", v)} options={recentMonths(15)} />
            <DateField label="তারিখ" value={pay.txn_date} onChange={(v) => setP("txn_date", v)} />
            <TextField label={isPayment ? "পরিশোধের পরিমাণ" : "পরিমাণ *"} value={pay.pay_amount} onChange={(v) => setP("pay_amount", v.replace(/[^\d.]/g, ""))} />
            {isPayment && <TextField label="এই মাসের নির্ধারিত বেতন *" value={pay.salary} onChange={(v) => setP("salary", v.replace(/[^\d.]/g, ""))} />}
            {isPayment && <TextField label="ভাতা (ঐচ্ছিক)" value={pay.allowance} onChange={(v) => setP("allowance", v.replace(/[^\d.]/g, ""))} />}
            {isPayment && <TextField label="বোনাস (ঐচ্ছিক)" value={pay.bonus} onChange={(v) => setP("bonus", v.replace(/[^\d.]/g, ""))} />}
            {isPayment && <TextField label="কর্তন (ঐচ্ছিক)" value={pay.deduction} onChange={(v) => setP("deduction", v.replace(/[^\d.]/g, ""))} />}
            <SelectField label="মাধ্যম" value={pay.method} onChange={(v) => setP("method", v)} options={METHODS} />
            <TextField label="রেফারেন্স (চেক/ট্রানজেকশন নং)" value={pay.reference} onChange={(v) => setP("reference", v)} />
            <TextField label="প্রদানকারী" value={pay.collected_by} onChange={(v) => setP("collected_by", v)} />
          </div>
          <TextareaField label="নোট" value={pay.notes} onChange={(v) => setP("notes", v)} rows={2} />
          {isPayment ? (
            <div style={{ marginTop: 6, background: monthRec && monthRec.due > 0 ? "#FFF3E0" : "#E8F5E9", border: `1px solid ${monthRec && monthRec.due > 0 ? "#FFCC80" : "#A5D6A7"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
              {monthRec
                ? <><b>{monthLabel(pay.month)}</b> — প্রাপ্য {money(monthRec.earned)} · পরিশোধিত <b style={{ color: "#2E7D32" }}>{money(monthRec.paid)}</b> · {monthRec.due > 0 ? <>বাকি <b style={{ color: "#E53935" }}>{money(monthRec.due)}</b></> : <b style={{ color: "#2E7D32" }}>সম্পূর্ণ পরিশোধিত ✓</b>}</>
                : <span style={{ color: "#546E7A" }}>💡 এই মাসে এখনো এন্ট্রি নেই — সংরক্ষণে নির্ধারিত বেতন accrue হয়ে পরিশোধ যোগ হবে (আগের কোনো লেনদেন মুছবে না)।</span>}
            </div>
          ) : (
            <div style={{ marginTop: 6, background: "#EDE7F6", border: "1px solid #B39DDB", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#4527A0" }}>
              💡 এটি একটি স্বতন্ত্র লেনদেন (মাসিক বেতন accrue হবে না) — লেজারে স্থায়ীভাবে সংরক্ষিত হবে এবং সংশ্লিষ্ট রিপোর্টে দেখাবে।
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
