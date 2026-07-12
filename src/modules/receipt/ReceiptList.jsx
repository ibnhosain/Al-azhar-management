import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, Modal, useToast, TextField, SelectField, ComboField, DateField } from "../../ui";
import { receipts as receiptsApi, students as studentsApi } from "../../data";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const num = (v) => { const e = String(v ?? "").replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d)); const n = parseFloat(e.replace(/[^\d.]/g, "")); return isNaN(n) ? 0 : n; };
const money = (n) => "৳" + bn((Math.round(n) || 0).toLocaleString("en-US"));
const todayISO = () => new Date().toISOString().slice(0, 10);

const TYPES = ["বেতন", "ভর্তি", "বোর্ডিং", "পরীক্ষা ফি", "যাকাত", "অনুদান", "সদকা", "ফিতরা", "অন্যান্য"];
const STATUSES = ["পরিশোধিত", "বকেয়া"];
const TYPE_COLOR = { "বেতন": "#2E7D32", "ভর্তি": "#1565C0", "বোর্ডিং": "#00838F", "পরীক্ষা ফি": "#6A1B9A", "যাকাত": "#EF6C00", "অনুদান": "#AD1457", "সদকা": "#00695C", "ফিতরা": "#5D4037" };

// সংশ্লিষ্ট মেনুর সূচক (App.jsx menuItems অনুযায়ী)
const RELATED = [
  { icon: "💵", label: "বেতন ব্যবস্থাপনা", desc: "ফি আদায় → এখানে রশিদ আসে", menu: 2, color: "#2E7D32" },
  { icon: "💰", label: "হিসাব ও অর্থ বিভাগ", desc: "রশিদ = আয়ের উৎস", menu: 7, color: "#00838F" },
  { icon: "🤝", label: "স্পনসর ও অনুদান", desc: "অনুদান/যাকাত রশিদ", menu: 9, color: "#AD1457" },
  { icon: "🏠", label: "বোর্ডিং ব্যবস্থাপনা", desc: "বোর্ডিং আয়", menu: 12, color: "#6A1B9A" },
];

function printReceipt(r) {
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Hind Siliguri',sans-serif;padding:20px;color:#263238;font-size:13px}
    @media print{body{padding:0}.no-print{display:none}}
  </style></head><body>
  <div style="border:2px solid #2E7D32;border-radius:10px;max-width:420px;margin:auto;padding:0;overflow:hidden">
    <div style="background:#2E7D32;color:#fff;padding:16px 20px;text-align:center">
      <div style="font-size:18px;font-weight:700">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
      <div style="font-size:12px;opacity:0.85;margin-top:4px">সদর, ময়মনসিংহ | +880 1747-658744</div>
    </div>
    <div style="background:#E8F5E9;padding:10px 20px;text-align:center;font-size:15px;font-weight:700;color:#1B5E20;letter-spacing:1px">
      💳 অর্থ প্রদানের রশিদ
    </div>
    <div style="padding:20px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><td style="padding:8px 0;color:#546E7A;width:40%">রশিদ নং</td><td style="padding:8px 0;font-weight:600">: ${r.code || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#546E7A">শিক্ষার্থী/দাতা</td><td style="padding:8px 0;font-weight:600">: ${r.student || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#546E7A">শ্রেণি</td><td style="padding:8px 0;font-weight:600">: ${r.class || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#546E7A">রোল নম্বর</td><td style="padding:8px 0;font-weight:600">: ${bn(r.roll) || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#546E7A">ফি-এর ধরন</td><td style="padding:8px 0;font-weight:600">: ${r.type || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#546E7A">তারিখ</td><td style="padding:8px 0;font-weight:600">: ${bn(r.date) || "—"}</td></tr>
        <tr style="border-top:2px dashed #E0E0E0"><td style="padding:12px 0;color:#546E7A;font-size:15px">পরিমাণ</td>
          <td style="padding:12px 0;font-weight:700;font-size:18px;color:#2E7D32">: ${money(num(r.amount))}</td>
        </tr>
        <tr><td style="padding:8px 0;color:#546E7A">অবস্থা</td>
          <td style="padding:8px 0"><span style="background:${r.status === 'পরিশোধিত' ? '#E8F5E9' : '#FFEBEE'};color:${r.status === 'পরিশোধিত' ? '#2E7D32' : '#F44336'};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600">: ${r.status || "—"}</span></td>
        </tr>
      </table>
    </div>
    <div style="border-top:1px dashed #E0E0E0;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:11px;color:#90A4AE">ধন্যবাদ আপনার পেমেন্টের জন্য</div>
      <div style="font-size:11px;color:#90A4AE">Easy Coding Space</div>
    </div>
  </div>
  <div class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="background:#2E7D32;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">🖨️ প্রিন্ট করুন</button>
    <button onclick="window.close()" style="background:#9E9E9E;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px;font-family:inherit">বন্ধ করুন</button>
  </div>
  </body></html>`);
  w.document.close();
}

const emptyForm = () => ({ code: "", student: "", class: "", roll: "", type: "বেতন", amount: "", date: todayISO(), status: "পরিশোধিত" });

export default function ReceiptList({ onNavigate }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fltType, setFltType] = useState("");
  const [fltStatus, setFltStatus] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const reload = async () => { setRows(await receiptsApi.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => {
      const [r, s] = await Promise.all([receiptsApi.list(), studentsApi.list().catch(() => [])]);
      if (alive) { setRows(r); setStudents(s || []); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const studentOpts = useMemo(() => students.map((s) => ({ value: s.name, label: `${s.name} | ${bn(s.code || s.roll || "")}` })), [students]);
  const types = useMemo(() => [...new Set(rows.map((r) => r.type).filter(Boolean))], [rows]);

  // শিক্ষার্থী বাছলে শ্রেণি ও রোল স্বয়ংক্রিয় বসাও (শিক্ষার্থী ব্যবস্থাপনার সাথে লিংক)
  const pickStudent = (name) => {
    const s = students.find((x) => x.name === name);
    setForm((f) => ({ ...f, student: name, class: s ? (s.class || f.class) : f.class, roll: s ? (s.roll || f.roll) : f.roll }));
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!fltType || r.type === fltType) && (!fltStatus || r.status === fltStatus) &&
      (!t || [r.code, r.student, r.class, r.type].some((v) => String(v || "").toLowerCase().includes(t)))
    );
  }, [rows, q, fltType, fltStatus]);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.status === "পরিশোধিত");
    const today = todayISO();
    const isToday = (d) => String(d || "").slice(0, 10) === today;
    return {
      total: rows.length,
      income: paid.reduce((s, r) => s + num(r.amount), 0),
      today: paid.filter((r) => isToday(r.date)).reduce((s, r) => s + num(r.amount), 0),
      due: rows.filter((r) => r.status === "বকেয়া").length,
    };
  }, [rows]);

  const nextCode = () => { const n = rows.map((r) => parseInt(String(r.code || "").replace(/\D/g, ""), 10)).filter((x) => !isNaN(x)); return "RCP-" + String((n.length ? Math.max(...n) : 0) + 1).padStart(3, "0"); };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm(), code: nextCode() }); setModal(true); };
  const openEdit = (r) => { setEditing(r.id); setForm({ code: r.code || "", student: r.student || "", class: r.class || "", roll: r.roll || "", type: r.type || "বেতন", amount: num(r.amount) || "", date: r.date || todayISO(), status: r.status || "পরিশোধিত" }); setModal(true); };

  const save = async () => {
    if (!form.student.trim()) return toast.error("শিক্ষার্থী/দাতার নাম দিন");
    if (!num(form.amount)) return toast.error("পরিমাণ দিন");
    setSaving(true);
    try {
      const data = { ...form, amount: num(form.amount) };
      if (editing) { await receiptsApi.update(editing, data); toast.success("রশিদ আপডেট হয়েছে"); }
      else { await receiptsApi.create({ ...data, code: form.code || nextCode() }); toast.success("রশিদ তৈরি হয়েছে ও হিসাবে যুক্ত হয়েছে"); }
      setModal(false); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };
  const del = async (r) => { if (!window.confirm(`রশিদ "${r.code || r.student}" মুছবেন?`)) return; await receiptsApi.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 60, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "code", label: "রশিদ নং", sortable: true },
    { key: "student", label: "শিক্ষার্থী/দাতা", sortable: true, render: (r) => r.student || "—" },
    { key: "class", label: "শ্রেণি", render: (r) => r.class || "—" },
    { key: "type", label: "ধরন", render: (r) => r.type ? <Badge color={TYPE_COLOR[r.type] || "#607D8B"}>{r.type}</Badge> : "—", exportValue: (r) => r.type },
    { key: "amount", label: "পরিমাণ", align: "right", sortable: true, render: (r) => <b style={{ color: "#2E7D32" }}>{money(num(r.amount))}</b>, exportValue: (r) => num(r.amount) },
    { key: "date", label: "তারিখ", render: (r) => bn(r.date) || "—" },
    { key: "status", label: "অবস্থা", align: "center", render: (r) => <Badge color={r.status === "পরিশোধিত" ? "#2E7D32" : "#E53935"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status },
    { key: "__a", label: "কার্যক্রম", render: (r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <Button size="sm" variant="subtle" onClick={() => printReceipt(r)}>🖨️</Button>
        <Button size="sm" variant="subtle" onClick={() => setDetail(r)}>👁</Button>
        <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon="🧾" title="রশিদ ব্যবস্থাপনা" description="বেতন, ভর্তি, বোর্ডিং ও অনুদানের সকল আয়ের রশিদ — তৈরি, প্রিন্ট ও হিসাবের সাথে সংযুক্ত।"
        actions={<Button onClick={openCreate} icon="＋">নতুন রশিদ</Button>} />

      <StatRow>
        <StatCard icon="🧾" label="মোট রশিদ" value={bn(stats.total)} color="#00838F" />
        <StatCard icon="💰" label="মোট আয় (পরিশোধিত)" value={money(stats.income)} color="#2E7D32" />
        <StatCard icon="📅" label="আজকের আয়" value={money(stats.today)} color="#1565C0" />
        <StatCard icon="⚠️" label="বকেয়া রশিদ" value={bn(stats.due)} color="#E53935" />
      </StatRow>

      {/* সংশ্লিষ্ট মেনু — লিংক */}
      {onNavigate && (
        <Card style={{ marginTop: 16, padding: 14 }}>
          <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 10, fontSize: 13 }}>🔗 সংশ্লিষ্ট মেনু</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }}>
            {RELATED.map((m) => (
              <div key={m.menu} onClick={() => onNavigate(m.menu)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid #e7eee7", borderLeft: `3px solid ${m.color}`, borderRadius: 10, cursor: "pointer", background: "#fff", transition: "box-shadow .15s" }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(27,77,62,.12)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div><div style={{ fontWeight: 700, color: "#1b4d3e", fontSize: 13.5 }}>{m.label}</div><div style={{ fontSize: 11.5, color: "#78909C" }}>{m.desc}</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "16px 0" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 রশিদ নং / নাম / শ্রেণি / ধরন" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cfd8cf", minWidth: 250, fontSize: 14 }} />
        <select value={fltType} onChange={(e) => setFltType(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }}>
          <option value="">সব ধরন</option>{types.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fltStatus} onChange={(e) => setFltStatus(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }}>
          <option value="">সব অবস্থা</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} exportName="receipts"
        empty={{ icon: "🧾", title: "কোনো রশিদ নেই", description: "‘নতুন রশিদ’ দিয়ে যোগ করুন — অথবা বেতন ব্যবস্থাপনা থেকে স্বয়ংক্রিয় রশিদ আসবে" }} />

      {modal && (
        <Modal title={editing ? "রশিদ সম্পাদনা" : "নতুন রশিদ"} icon="🧾" width={600} onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>💾 সংরক্ষণ</Button></>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <TextField label="রশিদ নং" value={form.code || ""} onChange={(v) => set("code", v)} />
            <ComboField label="শিক্ষার্থী/দাতা * (বাছুন বা লিখুন)" value={form.student} onChange={pickStudent} options={studentOpts} />
            <TextField label="শ্রেণি" value={form.class} onChange={(v) => set("class", v)} />
            <TextField label="রোল নম্বর" value={form.roll} onChange={(v) => set("roll", v)} />
            <ComboField label="ফি-এর ধরন" value={form.type} onChange={(v) => set("type", v)} options={TYPES} />
            <TextField label="পরিমাণ *" value={form.amount} onChange={(v) => set("amount", v)} />
            <DateField label="তারিখ" value={form.date} onChange={(v) => set("date", v)} />
            <SelectField label="অবস্থা" value={form.status} onChange={(v) => set("status", v)} options={STATUSES} />
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#78909C" }}>💡 শিক্ষার্থী বাছলে শ্রেণি ও রোল স্বয়ংক্রিয় বসবে। পরিশোধিত রশিদ হিসাব ও অর্থ বিভাগের আয়ে গণ্য হয়।</div>
        </Modal>
      )}

      {detail && (
        <Modal title={"রশিদ " + (detail.code || "")} icon="🧾" width={480} onClose={() => setDetail(null)}
          footer={<><Button variant="secondary" onClick={() => setDetail(null)}>বন্ধ</Button><Button onClick={() => printReceipt(detail)} icon="🖨️">প্রিন্ট</Button></>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontSize: 13 }}>
            {[["রশিদ নং", detail.code], ["শিক্ষার্থী/দাতা", detail.student], ["শ্রেণি", detail.class], ["রোল", bn(detail.roll)], ["ধরন", detail.type], ["তারিখ", bn(detail.date)]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 6 }}><span style={{ color: "#90A4AE", minWidth: 80 }}>{k}:</span><span style={{ color: "#37474F", fontWeight: 600 }}>{v || "—"}</span></div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#E8F5E9", borderRadius: 10, padding: "12px 16px" }}>
            <span style={{ color: "#546E7A", fontSize: 13 }}>পরিমাণ</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: "#2E7D32" }}>{money(num(detail.amount))}</span>
          </div>
          <div style={{ marginTop: 10, textAlign: "center" }}><Badge color={detail.status === "পরিশোধিত" ? "#2E7D32" : "#E53935"}>{detail.status}</Badge></div>
        </Modal>
      )}
    </div>
  );
}
