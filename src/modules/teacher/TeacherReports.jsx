import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, SelectField, DateField, ComboField } from "../../ui";
import { salaryLedger } from "../../data";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const nz = (v) => Number(v) || 0;
const money = (n) => "৳" + bn((Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-US"));
const MONTHS_BN = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
const monthLabel = (ym) => { const m = /^(\d{4})-(\d{2})$/.exec(String(ym || "")); return m ? `${MONTHS_BN[+m[2] - 1]} ${bn(m[1])}` : (ym || "—"); };
function recentMonths(n = 15) { const out = []; const d = new Date(); for (let i = 0; i < n; i++) { const y = d.getFullYear(), m = d.getMonth(); out.push({ value: `${y}-${String(m + 1).padStart(2, "0")}`, label: `${MONTHS_BN[m]} ${bn(y)}` }); d.setMonth(d.getMonth() - 1); } return out; }
const YEARS = () => { const y = new Date().getFullYear(); return [y + 1, y, y - 1, y - 2].map((x) => ({ value: String(x), label: bn(x) })); };
const METHODS = ["", "নগদ", "ব্যাংক", "মোবাইল ব্যাংকিং", "চেক"];
const STATUS_COLOR = { "পরিশোধিত": "#2E7D32", "আংশিক": "#EF6C00", "বকেয়া": "#E53935", "—": "#90A4AE" };

const REPORTS = [
  { key: "salary", icon: "📋", label: "শিক্ষক বেতন রিপোর্ট" },
  { key: "monthly", icon: "📅", label: "মাসিক রিপোর্ট" },
  { key: "yearly", icon: "🗓️", label: "বার্ষিক রিপোর্ট" },
  { key: "outstanding", icon: "⚠️", label: "বকেয়া বেতন রিপোর্ট" },
  { key: "payments", icon: "🧾", label: "পরিশোধ ইতিহাস" },
  { key: "advance", icon: "💸", label: "অগ্রিম রিপোর্ট" },
  { key: "loan", icon: "🤝", label: "ঋণ রিপোর্ট" },
];

export default function TeacherReports({ onBack }) {
  const [type, setType] = useState("salary");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(recentMonths(1)[0].value);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState("");

  useEffect(() => {
    let alive = true;
    const params = type === "monthly" ? { month } : type === "yearly" ? { year } : type === "payments" ? { from, to, method } : {};
    const run = async () => {
      setLoading(true);
      try { const r = await salaryLedger.report(type, params); if (alive) setRows(r || []); }
      finally { if (alive) setLoading(false); }
    };
    run();
    return () => { alive = false; };
  }, [type, month, year, from, to, method]);

  const sum = useMemo(() => rows.reduce((s, r) => ({
    earned: s.earned + nz(r.earned), paid: s.paid + nz(r.paid), due: s.due + nz(r.due), amount: s.amount + nz(r.amount),
  }), { earned: 0, paid: 0, due: 0, amount: 0 }), [rows]);

  const sl = { key: "sl", label: "ক্রমিক", width: 60, align: "center", render: (_r, i) => bn(i + 1) };
  const stCol = { key: "status", label: "অবস্থা", align: "center", render: (r) => <Badge color={STATUS_COLOR[r.status] || "#607D8B"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status };
  const COLS = {
    salary: [sl, { key: "name", label: "শিক্ষক", sortable: true }, { key: "code", label: "আইডি" },
      { key: "monthly_salary", label: "মাসিক বেতন", align: "right", render: (r) => money(r.monthly_salary), exportValue: (r) => r.monthly_salary },
      { key: "earned", label: "মোট প্রাপ্য", align: "right", render: (r) => money(r.earned), exportValue: (r) => r.earned },
      { key: "paid", label: "মোট পরিশোধ", align: "right", render: (r) => money(r.paid), exportValue: (r) => r.paid },
      { key: "due", label: "বকেয়া", align: "right", render: (r) => <b style={{ color: r.due > 0 ? "#E53935" : "#2E7D32" }}>{money(r.due)}</b>, exportValue: (r) => r.due }, stCol],
    monthly: [sl, { key: "name", label: "শিক্ষক", sortable: true }, { key: "code", label: "আইডি" },
      { key: "earned", label: "প্রাপ্য", align: "right", render: (r) => money(r.earned), exportValue: (r) => r.earned },
      { key: "paid", label: "পরিশোধ", align: "right", render: (r) => money(r.paid), exportValue: (r) => r.paid },
      { key: "deducted", label: "কর্তন", align: "right", render: (r) => money(r.deducted), exportValue: (r) => r.deducted },
      { key: "due", label: "বকেয়া", align: "right", render: (r) => <b style={{ color: r.due > 0 ? "#E53935" : "#2E7D32" }}>{money(r.due)}</b>, exportValue: (r) => r.due }, stCol],
    yearly: [{ key: "month", label: "মাস", render: (r) => monthLabel(r.month) },
      { key: "earned", label: "প্রাপ্য", align: "right", render: (r) => money(r.earned), exportValue: (r) => r.earned },
      { key: "paid", label: "পরিশোধ", align: "right", render: (r) => money(r.paid), exportValue: (r) => r.paid },
      { key: "deducted", label: "কর্তন", align: "right", render: (r) => money(r.deducted), exportValue: (r) => r.deducted },
      { key: "due", label: "বকেয়া", align: "right", render: (r) => <b style={{ color: r.due > 0 ? "#E53935" : "#2E7D32" }}>{money(r.due)}</b>, exportValue: (r) => r.due }],
    outstanding: [sl, { key: "name", label: "শিক্ষক", sortable: true }, { key: "code", label: "আইডি" },
      { key: "monthly_salary", label: "মাসিক বেতন", align: "right", render: (r) => money(r.monthly_salary), exportValue: (r) => r.monthly_salary },
      { key: "paid", label: "পরিশোধ", align: "right", render: (r) => money(r.paid), exportValue: (r) => r.paid },
      { key: "due", label: "বকেয়া", align: "right", render: (r) => <b style={{ color: "#E53935" }}>{money(r.due)}</b>, exportValue: (r) => r.due }, stCol],
    payments: [sl, { key: "txn_date", label: "তারিখ", render: (r) => bn(r.txn_date), sortable: true },
      { key: "teacher_name", label: "শিক্ষক" }, { key: "month", label: "মাস", render: (r) => monthLabel(r.month) },
      { key: "amount", label: "পরিমাণ", align: "right", render: (r) => <b style={{ color: "#2E7D32" }}>{money(r.amount)}</b>, exportValue: (r) => r.amount },
      { key: "method", label: "মাধ্যম", render: (r) => r.method || "—" }, { key: "reference", label: "রেফারেন্স", render: (r) => r.reference || "—" },
      { key: "collected_by", label: "প্রদানকারী", render: (r) => r.collected_by || "—" }],
    advance: [sl, { key: "txn_date", label: "তারিখ", render: (r) => bn(r.txn_date), sortable: true }, { key: "teacher_name", label: "শিক্ষক" },
      { key: "month", label: "মাস", render: (r) => monthLabel(r.month) },
      { key: "amount", label: "পরিমাণ", align: "right", render: (r) => <b style={{ color: "#6A1B9A" }}>{money(r.amount)}</b>, exportValue: (r) => r.amount },
      { key: "method", label: "মাধ্যম", render: (r) => r.method || "—" }, { key: "notes", label: "নোট", render: (r) => r.notes || "—" }],
    loan: [sl, { key: "txn_date", label: "তারিখ", render: (r) => bn(r.txn_date), sortable: true }, { key: "teacher_name", label: "শিক্ষক" },
      { key: "amount", label: "পরিমাণ", align: "right", render: (r) => <b style={{ color: "#5C6BC0" }}>{money(r.amount)}</b>, exportValue: (r) => r.amount },
      { key: "method", label: "মাধ্যম", render: (r) => r.method || "—" }, { key: "notes", label: "নোট", render: (r) => r.notes || "—" }],
  };

  const stats = () => {
    if (["salary", "monthly", "yearly", "outstanding"].includes(type)) return (
      <StatRow>
        <StatCard icon="📄" label="মোট সারি" value={bn(rows.length)} color="#5C6BC0" />
        {type !== "outstanding" && <StatCard icon="📈" label="মোট প্রাপ্য" value={money(sum.earned)} color="#00838F" />}
        <StatCard icon="✅" label="মোট পরিশোধ" value={money(sum.paid)} color="#2E7D32" />
        <StatCard icon="⚠️" label="মোট বকেয়া" value={money(sum.due)} color="#E53935" />
      </StatRow>
    );
    return (
      <StatRow>
        <StatCard icon="📄" label="মোট এন্ট্রি" value={bn(rows.length)} color="#5C6BC0" />
        <StatCard icon="💰" label="মোট পরিমাণ" value={money(sum.amount)} color="#2E7D32" />
      </StatRow>
    );
  };

  return (
    <div>
      <PageHeader icon="📊" title="পে-রোল রিপোর্ট" description="৭ ধরনের বেতন রিপোর্ট — ফিল্টার, প্রিন্ট ও Excel export" onBack={onBack} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {REPORTS.map((r) => (
          <div key={r.key} onClick={() => setType(r.key)} style={{
            padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
            border: "1px solid", borderColor: type === r.key ? "#5C6BC0" : "#e0e0e0",
            background: type === r.key ? "#5C6BC0" : "#fff", color: type === r.key ? "#fff" : "#546E7A",
          }}>{r.icon} {r.label}</div>
        ))}
      </div>

      {(type === "monthly" || type === "yearly" || type === "payments") && (
        <Card style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "0 14px" }}>
            {type === "monthly" && <ComboField label="মাস" value={month} onChange={setMonth} options={recentMonths(18)} />}
            {type === "yearly" && <SelectField label="বছর" value={year} onChange={setYear} options={YEARS()} />}
            {type === "payments" && <><DateField label="শুরুর তারিখ" value={from} onChange={setFrom} />
              <DateField label="শেষ তারিখ" value={to} onChange={setTo} />
              <SelectField label="মাধ্যম" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: m || "সব মাধ্যম" }))} /></>}
          </div>
        </Card>
      )}

      {stats()}

      <div style={{ marginTop: 16 }}>
        <DataTable columns={COLS[type]} rows={rows} loading={loading} exportName={`report-${type}`}
          empty={{ icon: "📊", title: "কোনো তথ্য নেই", description: "এই রিপোর্টে দেখানোর মতো কোনো ডেটা নেই" }} />
      </div>
    </div>
  );
}
