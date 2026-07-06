import { useState, useEffect } from "react";
import { PageHeader, DataTable, Badge, Button, Modal, useToast, SelectField, DateField, TextareaField } from "../../ui";
import { mealPauses, students as studentsApi } from "../../data";
import { bn, todayISO, PAUSE_REASONS } from "./constants";

export default function MealPause({ nav, icon }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [studentOpts, setStudentOpts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ student_code: "", from_date: todayISO(), to_date: todayISO(), reason: "ছুটি", note: "" });
  const [saving, setSaving] = useState(false);
  const today = todayISO();

  const reload = async () => { setRows(await mealPauses.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => {
      const studs = await studentsApi.list();
      const opts = studs.map((s) => ({ value: s.code, label: `${s.name} (${s.code})`, name: s.name }));
      const r = await mealPauses.list();
      if (alive) { setStudentOpts(opts); setRows(r); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const openCreate = () => { setEditing(null); setForm({ student_code: "", from_date: today, to_date: today, reason: "ছুটি", note: "" }); setModal(true); };
  const openEdit = (r) => { setEditing(r.id); setForm({ student_code: r.student_code || "", from_date: r.from_date || today, to_date: r.to_date || today, reason: r.reason || "ছুটি", note: r.note || "" }); setModal(true); };

  const save = async () => {
    if (!form.student_code) return toast.error("ছাত্র নির্বাচন করুন");
    if (!form.from_date || !form.to_date) return toast.error("তারিখ দিন");
    if (form.to_date < form.from_date) return toast.error("শেষ তারিখ শুরুর আগে হতে পারে না");
    const opt = studentOpts.find((o) => o.value === form.student_code);
    const data = { ...form, student_name: opt ? opt.name : form.student_code };
    setSaving(true);
    try {
      if (editing) { await mealPauses.update(editing, data); toast.success("আপডেট হয়েছে"); }
      else { await mealPauses.create(data); toast.success("বিরতি যোগ হয়েছে"); }
      setModal(false); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };
  const del = async (r) => { if (!window.confirm("এই বিরতি মুছবেন?")) return; await mealPauses.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };

  const statusOf = (r) => (r.from_date <= today && r.to_date >= today ? "চলমান" : r.from_date > today ? "আসন্ন" : "সমাপ্ত");

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 70, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "student_name", label: "ছাত্র", sortable: true },
    { key: "student_code", label: "আইডি", sortable: true },
    { key: "from_date", label: "শুরু", sortable: true },
    { key: "to_date", label: "শেষ (auto-resume)", sortable: true },
    { key: "reason", label: "কারণ", render: (r) => <Badge color="#EF6C00">{r.reason}</Badge>, exportValue: (r) => r.reason },
    { key: "status", label: "অবস্থা", render: (r) => { const s = statusOf(r); return <Badge color={s === "চলমান" ? "#E53935" : s === "আসন্ন" ? "#0288D1" : "#78909C"}>{s}</Badge>; }, exportValue: statusOf },
    { key: "__actions", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="মিল বিরতি" description="বিরতিতে থাকা ছাত্র অটো মিল লিস্ট থেকে বাদ; শেষ তারিখ পার হলে স্বয়ংক্রিয় resume" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<Button onClick={openCreate} icon="＋">নতুন বিরতি</Button>} />
      <DataTable columns={columns} rows={rows} loading={loading} exportName="meal-pauses"
        empty={{ icon: "⏸️", title: "কোনো বিরতি নেই", description: "‘নতুন বিরতি’ দিয়ে যোগ করুন" }} />
      {modal && (
        <Modal title={editing ? "বিরতি সম্পাদনা" : "নতুন মিল বিরতি"} icon="⏸️" onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>💾 সংরক্ষণ</Button></>}>
          <SelectField label="ছাত্র" required value={form.student_code} onChange={(v) => setForm({ ...form, student_code: v })} options={studentOpts} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DateField label="শুরুর তারিখ" required value={form.from_date} onChange={(v) => setForm({ ...form, from_date: v })} />
            <DateField label="শেষ তারিখ" required value={form.to_date} onChange={(v) => setForm({ ...form, to_date: v })} />
          </div>
          <SelectField label="কারণ" value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} options={PAUSE_REASONS} />
          <TextareaField label="নোট" value={form.note} onChange={(v) => setForm({ ...form, note: v })} rows={2} />
        </Modal>
      )}
    </div>
  );
}
