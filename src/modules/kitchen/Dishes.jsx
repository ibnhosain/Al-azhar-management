import { useState, useEffect, useMemo } from "react";
import { PageHeader, DataTable, Badge, Button, Modal, useToast, TextField, SelectField, TextareaField } from "../../ui";
import { dishes as dishApi } from "../../data";
import { bn, DISH_CATEGORIES, DISH_MEAL_OPTIONS, SERVING_TYPES, mealLabel, resizeImage } from "./constants";

function Avatar({ src, name, size = 40 }) {
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", border: "1px solid #dfe6df" }} />
    : <div style={{ width: size, height: size, borderRadius: 10, background: "#FFF3E0", color: "#EF6C00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🍲</div>;
}

const EMPTY = { name: "", category: DISH_CATEGORIES[0], meal_type: "any", serving_type: "জনপ্রতি", prep_time: "0", cook_time: "0", description: "", active: "1", photo: null };

export default function Dishes({ nav, icon }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => { setRows(await dishApi.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => { const r = await dishApi.list(); if (alive) { setRows(r); setLoading(false); } })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => [r.name, r.category, mealLabel(r.meal_type)].some((v) => String(v || "").toLowerCase().includes(t)));
  }, [rows, q]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (r) => {
    setEditing(r.id);
    setForm({ name: r.name || "", category: r.category || DISH_CATEGORIES[0], meal_type: r.meal_type || "any", serving_type: r.serving_type || "জনপ্রতি", prep_time: String(r.prep_time ?? 0), cook_time: String(r.cook_time ?? 0), description: r.description || "", active: r.active ?? "1", photo: r.photo || null });
    setModal(true);
  };

  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { const photo = await resizeImage(file); setForm((f) => ({ ...f, photo })); } catch { toast.error("ছবি লোড হয়নি"); }
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("পদের নাম দিন");
    setSaving(true);
    try {
      if (editing) { await dishApi.update(editing, form); toast.success("আপডেট হয়েছে"); }
      else { await dishApi.create(form); toast.success("পদ যোগ হয়েছে"); }
      setModal(false); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };
  const del = async (r) => { if (!window.confirm(`"${r.name}" মুছবেন? এর রেসিপিও মুছে যাবে।`)) return; await dishApi.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };

  const columns = [
    { key: "photo", label: "ছবি", width: 60, render: (r) => <Avatar src={r.photo} name={r.name} /> },
    { key: "name", label: "পদের নাম", sortable: true },
    { key: "category", label: "ক্যাটাগরি", render: (r) => r.category ? <Badge color="#EF6C00">{r.category}</Badge> : "—", exportValue: (r) => r.category },
    { key: "meal_type", label: "বেলা", render: (r) => <Badge color="#2E7D32">{mealLabel(r.meal_type)}</Badge>, exportValue: (r) => mealLabel(r.meal_type) },
    { key: "prep_time", label: "প্রস্তুতি", align: "center", render: (r) => bn(r.prep_time ?? 0) + " মি.", exportValue: (r) => r.prep_time },
    { key: "cook_time", label: "রান্না", align: "center", render: (r) => bn(r.cook_time ?? 0) + " মি.", exportValue: (r) => r.cook_time },
    { key: "active", label: "অবস্থা", align: "center", render: (r) => r.active === "1" ? <Badge color="#2E7D32">সক্রিয়</Badge> : <Badge color="#90A4AE">নিষ্ক্রিয়</Badge>, exportValue: (r) => r.active },
    { key: "__actions", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="পদ ব্যবস্থাপনা" description="রান্নার পদ — ক্যাটাগরি, বেলা, ছবি, প্রস্তুতি ও রান্নার সময়" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 নাম / ক্যাটাগরি / বেলা" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cfd8cf", minWidth: 210, fontSize: 14 }} />
          <Button onClick={openCreate} icon="＋">নতুন পদ</Button>
        </div>} />
      <DataTable columns={columns} rows={filtered} loading={loading} exportName="dishes"
        empty={{ icon: "🍲", title: "কোনো পদ নেই", description: "‘নতুন পদ’ দিয়ে যোগ করুন" }} />

      {modal && (
        <Modal title={editing ? "পদ সম্পাদনা" : "নতুন পদ"} icon="🍲" onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>💾 সংরক্ষণ</Button></>}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
            <Avatar src={form.photo} name={form.name} size={68} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ cursor: "pointer" }}>
                <span style={{ padding: "7px 14px", borderRadius: 8, background: "#FFF3E0", color: "#EF6C00", fontWeight: 600, fontSize: 13, display: "inline-block" }}>📷 ছবি নির্বাচন</span>
                <input type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
              </label>
              {form.photo && <button type="button" onClick={() => setForm((f) => ({ ...f, photo: "" }))} style={{ background: "none", border: "none", color: "#E53935", cursor: "pointer", fontSize: 12, textAlign: "left" }}>✕ ছবি সরান</button>}
            </div>
          </div>
          <TextField label="পদের নাম" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SelectField label="ক্যাটাগরি" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={DISH_CATEGORIES} />
            <SelectField label="বেলা" value={form.meal_type} onChange={(v) => setForm({ ...form, meal_type: v })} options={DISH_MEAL_OPTIONS} />
            <SelectField label="পরিবেশন ধরন" value={form.serving_type} onChange={(v) => setForm({ ...form, serving_type: v })} options={SERVING_TYPES} />
            <SelectField label="অবস্থা" value={form.active} onChange={(v) => setForm({ ...form, active: v })} options={[{ value: "1", label: "সক্রিয়" }, { value: "0", label: "নিষ্ক্রিয়" }]} />
            <TextField label="প্রস্তুতি সময় (মিনিট)" value={form.prep_time} onChange={(v) => setForm({ ...form, prep_time: v })} />
            <TextField label="রান্নার সময় (মিনিট)" value={form.cook_time} onChange={(v) => setForm({ ...form, cook_time: v })} />
          </div>
          <TextareaField label="বিবরণ" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} />
        </Modal>
      )}
    </div>
  );
}
