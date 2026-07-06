import { useState, useEffect } from "react";
import { PageHeader, DataTable, StatCard, StatRow, Badge, Button, Modal, useToast, TextField, SelectField, DateField, MoneyField, TextareaField } from "../../ui";
import { boardingExpense } from "../../data";
import { EXPENSE_CATEGORIES, taka, bn, todayISO } from "./constants";

const emptyForm = () => ({ expense_no: "", date: todayISO(), category: "খাবার", description: "", amount: "", paid_by: "", approved_by: "", remarks: "" });

export default function BoardingExpense({ nav, icon }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const r = await boardingExpense.list();
    setRows([...r].sort((a, b) => b.id - a.id)); // নতুন আগে
    setLoading(false);
  };
  useEffect(() => { (async () => { await reload(); })(); }, []);

  const nextNo = () => {
    const nums = rows.map((r) => parseInt(String(r.expense_no || "").replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm(), expense_no: nextNo() }); setModal(true); };
  const openEdit = (r) => {
    setEditing(r.id);
    setForm({ expense_no: r.expense_no || "", date: r.date || todayISO(), category: r.category || "খাবার", description: r.description || "", amount: String(r.amount ?? ""), paid_by: r.paid_by || "", approved_by: r.approved_by || "", remarks: r.remarks || "" });
    setModal(true);
  };

  const save = async () => {
    if (!form.date) return toast.error("তারিখ দিন");
    if (!(Number(form.amount) > 0)) return toast.error("সঠিক পরিমাণ দিন");
    setSaving(true);
    try {
      const data = { ...form, amount: Number(form.amount) };
      if (editing) { await boardingExpense.update(editing, data); toast.success("খরচ আপডেট হয়েছে"); }
      else { await boardingExpense.create(data); toast.success("খরচ যোগ হয়েছে"); }
      setModal(false); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const del = async (r) => {
    if (!window.confirm("এই খরচ এন্ট্রি মুছবেন?")) return;
    await boardingExpense.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload();
  };

  const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const thisMonth = rows.filter((r) => String(r.date || "").slice(0, 7) === todayISO().slice(0, 7)).reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 70, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "expense_no", label: "নং", sortable: true, render: (r) => "#" + bn(r.expense_no) },
    { key: "date", label: "তারিখ", sortable: true },
    { key: "category", label: "ক্যাটাগরি", sortable: true, render: (r) => <Badge color="#EF6C00">{r.category}</Badge>, exportValue: (r) => r.category },
    { key: "description", label: "বিবরণ", render: (r) => r.description || "—" },
    { key: "amount", label: "পরিমাণ", align: "right", sortable: true, render: (r) => <b style={{ color: "#C62828" }}>{taka(r.amount)}</b>, exportValue: (r) => r.amount },
    { key: "paid_by", label: "পরিশোধকারী", render: (r) => r.paid_by || "—" },
    { key: "__actions", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="বোর্ডিং খরচ" description="বোর্ডিং খরচের হিসাব ও তালিকা" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<Button onClick={openCreate} icon="＋">নতুন খরচ</Button>} />
      <StatRow>
        <StatCard icon="🧾" label="মোট খরচ" value={taka(totalAmount)} color="#EF6C00" hint={`${bn(rows.length)} এন্ট্রি`} />
        <StatCard icon="📅" label="এই মাসের খরচ" value={taka(thisMonth)} color="#2E7D32" />
      </StatRow>
      <DataTable columns={columns} rows={rows} loading={loading} exportName="boarding-expense"
        empty={{ icon: "🧾", title: "কোনো খরচ এন্ট্রি নেই", description: "‘নতুন খরচ’ দিয়ে যোগ করুন" }} />
      {modal && (
        <Modal title={editing ? "খরচ সম্পাদনা" : "নতুন খরচ এন্ট্রি"} icon="🧾" onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>💾 সংরক্ষণ</Button></>}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <TextField label="খরচ নম্বর" value={form.expense_no} onChange={(v) => setForm({ ...form, expense_no: v })} />
            <DateField label="তারিখ" required value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <SelectField label="ক্যাটাগরি" required value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={EXPENSE_CATEGORIES} />
            <MoneyField label="পরিমাণ" required value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
            <TextField label="পরিশোধকারী" value={form.paid_by} onChange={(v) => setForm({ ...form, paid_by: v })} />
            <TextField label="অনুমোদনকারী" value={form.approved_by} onChange={(v) => setForm({ ...form, approved_by: v })} />
          </div>
          <TextField label="বিবরণ" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <TextareaField label="নোট" value={form.remarks} onChange={(v) => setForm({ ...form, remarks: v })} rows={2} />
        </Modal>
      )}
    </div>
  );
}
