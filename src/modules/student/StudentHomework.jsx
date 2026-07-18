import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, StatCard, StatRow, Badge, Button, useToast, TextField, ComboField, DateField, TextareaField } from "../../ui";
import { homework as hwApi, students as studentsApi } from "../../data";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const todayISO = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ h_date: todayISO(), class: "", section: "", subject: "", title: "", detail: "", assigned_by: "" });

function printHomework(rows, title) {
  const body = rows.map((r) => `<tr>
    <td style="padding:6px 10px;border:1px solid #ddd">${bn(r.h_date)}</td>
    <td style="padding:6px 10px;border:1px solid #ddd">${r.class || "—"}${r.section ? " (" + r.section + ")" : ""}</td>
    <td style="padding:6px 10px;border:1px solid #ddd">${r.subject || "—"}</td>
    <td style="padding:6px 10px;border:1px solid #ddd"><b>${r.title || "—"}</b>${r.detail ? "<br><span style='color:#555;font-size:12px'>" + r.detail + "</span>" : ""}</td>
  </tr>`).join("");
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Hind Siliguri',sans-serif;padding:24px;color:#263238}
  @media print{.no-print{display:none}}</style></head><body>
  <div style="text-align:center;margin-bottom:14px">
    <div style="font-size:20px;font-weight:700;color:#1b5e20">মাদরাসাতুল আযহার আল-আরাবিয়া</div>
    <div style="font-size:15px;font-weight:700;margin-top:4px">📖 দৈনিক বাড়ির কাজ${title ? " — " + title : ""}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#E8F5E9">
      <th style="padding:7px 10px;border:1px solid #ddd;text-align:left">তারিখ</th>
      <th style="padding:7px 10px;border:1px solid #ddd;text-align:left">শ্রেণি</th>
      <th style="padding:7px 10px;border:1px solid #ddd;text-align:left">বিষয়</th>
      <th style="padding:7px 10px;border:1px solid #ddd;text-align:left">বাড়ির কাজ</th>
    </tr></thead><tbody>${body || `<tr><td colspan="4" style="padding:12px;text-align:center;color:#999">কোনো কাজ নেই</td></tr>`}</tbody>
  </table>
  <div class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="background:#2E7D32;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">🖨️ প্রিন্ট করুন</button>
    <button onclick="window.close()" style="background:#9E9E9E;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px;font-family:inherit">বন্ধ করুন</button>
  </div></body></html>`);
  w.document.close();
}

export default function StudentHomework({ onBack }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fltDate, setFltDate] = useState("");
  const [fltClass, setFltClass] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const reload = () => hwApi.list().then((r) => { setRows(r || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => {
    let alive = true;
    (async () => {
      const [r, s] = await Promise.all([hwApi.list(), studentsApi.list().catch(() => [])]);
      if (alive) { setRows(r || []); setClasses([...new Set((s || []).map((x) => x.class).filter(Boolean))]); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const save = async () => {
    if (!form.class.trim()) return toast.error("শ্রেণি দিন");
    if (!form.title.trim()) return toast.error("বাড়ির কাজ / শিরোনাম দিন");
    setSaving(true);
    try {
      if (editing) { await hwApi.update(editing, form); toast.success("আপডেট হয়েছে"); }
      else { await hwApi.create(form); toast.success("বাড়ির কাজ যোগ হয়েছে"); }
      setForm({ ...emptyForm(), h_date: form.h_date, class: form.class, section: form.section }); setEditing(null);
      await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };
  const edit = (r) => { setEditing(r.id); setForm({ h_date: r.h_date || todayISO(), class: r.class || "", section: r.section || "", subject: r.subject || "", title: r.title || "", detail: r.detail || "", assigned_by: r.assigned_by || "" }); };
  const del = async (r) => { if (!window.confirm("এই বাড়ির কাজ মুছবেন?")) return; await hwApi.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };

  const filtered = useMemo(() => rows.filter((r) =>
    (!fltDate || r.h_date === fltDate) && (!fltClass || r.class === fltClass)
  ).sort((a, b) => String(b.h_date).localeCompare(String(a.h_date)) || b.id - a.id), [rows, fltDate, fltClass]);

  const todayCount = rows.filter((r) => r.h_date === todayISO()).length;
  const classOpts = [{ value: "", label: "সব শ্রেণি" }, ...classes.map((c) => ({ value: c, label: c }))];

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 60, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "h_date", label: "তারিখ", sortable: true, render: (r) => bn(r.h_date) },
    { key: "class", label: "শ্রেণি", render: (r) => r.class ? <Badge color="#2E7D32">{r.class}{r.section ? " · " + r.section : ""}</Badge> : "—", exportValue: (r) => r.class },
    { key: "subject", label: "বিষয়", render: (r) => r.subject || "—" },
    { key: "title", label: "বাড়ির কাজ", render: (r) => <span><b>{r.title}</b>{r.detail ? <span style={{ color: "#78909C" }}> — {r.detail}</span> : ""}</span>, exportValue: (r) => r.title },
    { key: "assigned_by", label: "প্রদানকারী", render: (r) => r.assigned_by || "—" },
    { key: "__a", label: "কার্যক্রম", render: (r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <Button size="sm" variant="subtle" onClick={() => edit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon="📖" title="দৈনিক বাড়ির কাজ" description="শ্রেণি ও তারিখ অনুযায়ী বাড়ির কাজ যোগ, তালিকা ও প্রিন্ট" onBack={onBack}
        breadcrumb={[{ label: "শিক্ষার্থী ব্যবস্থাপনা", onClick: onBack }, { label: "দৈনিক বাড়ির কাজ" }]}
        actions={<Button variant="secondary" onClick={() => printHomework(filtered, fltClass || (fltDate ? bn(fltDate) : "সকল"))} icon="🖨️">প্রিন্ট</Button>} />

      <StatRow>
        <StatCard icon="📖" label="মোট এন্ট্রি" value={bn(rows.length)} color="#2E7D32" />
        <StatCard icon="📅" label="আজকের কাজ" value={bn(todayCount)} color="#00838F" />
      </StatRow>

      <Card style={{ padding: 16, margin: "16px 0" }}>
        <div style={{ fontWeight: 700, color: "#1b4d3e", marginBottom: 12 }}>{editing ? "✏ বাড়ির কাজ সম্পাদনা" : "＋ নতুন বাড়ির কাজ"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 14px" }}>
          <DateField label="তারিখ" value={form.h_date} onChange={(v) => set("h_date", v)} />
          <ComboField label="শ্রেণি *" value={form.class} onChange={(v) => set("class", v)} options={classes} />
          <TextField label="সেকশন" value={form.section} onChange={(v) => set("section", v)} />
          <TextField label="বিষয়" value={form.subject} onChange={(v) => set("subject", v)} />
          <TextField label="বাড়ির কাজ / শিরোনাম *" value={form.title} onChange={(v) => set("title", v)} />
          <TextField label="প্রদানকারী (শিক্ষক)" value={form.assigned_by} onChange={(v) => set("assigned_by", v)} />
        </div>
        <TextareaField label="বিস্তারিত" value={form.detail} onChange={(v) => set("detail", v)} rows={2} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {editing && <Button variant="secondary" onClick={() => { setEditing(null); setForm(emptyForm()); }}>বাতিল</Button>}
          <Button onClick={save} loading={saving} icon="💾">{editing ? "আপডেট" : "সংরক্ষণ"}</Button>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: "#243B40" }}>🔎 ফিল্টার:</div>
        <input type="date" value={fltDate} onChange={(e) => setFltDate(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cfd8cf", fontSize: 14 }} />
        <select value={fltClass} onChange={(e) => setFltClass(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cfd8cf", fontSize: 14 }}>
          {classOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(fltDate || fltClass) && <Button size="sm" variant="secondary" onClick={() => { setFltDate(""); setFltClass(""); }} icon="✕">মুছুন</Button>}
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} exportName="homework"
        empty={{ icon: "📖", title: "কোনো বাড়ির কাজ নেই", description: "উপরের ফরম দিয়ে নতুন বাড়ির কাজ যোগ করুন" }} />
    </div>
  );
}
