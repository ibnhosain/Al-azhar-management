import { useState, useEffect } from "react";
import { PageHeader, DataTable, Button, Modal, useToast, TextField, SelectField, DateField, MoneyField, TextareaField } from "../../ui";
import { environment, seedResource } from "../../data";
import { bn } from "./constants";

// একটি ফিল্ড কনফিগ → উপযুক্ত ইনপুট (options: dynamic হলে বাইরে থেকে আসে)
function FieldInput({ f, value, onChange, options }) {
  const common = { label: f.label, value, onChange, required: f.required };
  if (f.type === "select") return <SelectField {...common} options={options || f.options || []} />;
  if (f.type === "money") return <MoneyField {...common} />;
  if (f.type === "date") return <DateField {...common} />;
  if (f.type === "textarea") return <TextareaField {...common} />;
  return <TextField {...common} />;
}

// যেকোনো সাধারণ CRUD এন্টিটির পূর্ণ পেজ (list + modal form) — config দিয়ে।
//  field.optionsFrom: async () => [{value,label}]  — real ডেটা থেকে dropdown।
//  onAfterSave(data, {editing}): সংরক্ষণের পর side-effect (যেমন বেড occupied করা)।
//  onFieldChange(key, value, form) => patch — একটি ফিল্ড বদলালে অন্য ফিল্ড auto-fill।
export default function CrudPage({
  nav, icon, title, description, api, resourceKey,
  columns, fields, codePrefix, seedRows, addLabel = "নতুন এন্ট্রি", emptyTitle = "কোনো তথ্য নেই",
  headerExtra = null, onAfterSave = null, onFieldChange = null,
}) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [dynOpts, setDynOpts] = useState({});

  const blank = () => Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]));

  const loadOptions = async () => {
    const dyn = {};
    for (const f of fields) {
      if (typeof f.optionsFrom === "function") {
        try { dyn[f.key] = await f.optionsFrom(); } catch { dyn[f.key] = []; }
      }
    }
    return dyn;
  };

  const reload = async () => { setRows(await api.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => {
      if (environment === "web" && seedRows && resourceKey) seedResource(resourceKey, seedRows);
      const r = await api.list();
      const dyn = await loadOptions();
      if (alive) { setRows(r); setDynOpts(dyn); setLoading(false); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // একটি ফিল্ড বদলালে form patch (নিজের value + optional auto-fill)
  const changeField = (key, value) => {
    const patch = { [key]: value };
    if (onFieldChange) Object.assign(patch, onFieldChange(key, value, form) || {});
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const nextCode = () => {
    const nums = rows.map((r) => parseInt(String(r.code || "").replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return codePrefix + "-" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...blank(), ...(codePrefix ? { code: nextCode() } : {}) });
    setModal(true);
  };
  const openEdit = (r) => {
    setEditing(r.id);
    const f = {};
    fields.forEach((x) => (f[x.key] = r[x.key] ?? ""));
    if (codePrefix) f.code = r.code || "";
    setForm(f);
    setModal(true);
  };

  const save = async () => {
    for (const f of fields) if (f.required && !String(form[f.key] ?? "").trim()) return toast.error(`${f.label} দিন`);
    setSaving(true);
    try {
      const data = { ...form };
      let saved;
      if (editing) { saved = await api.update(editing, data); toast.success("আপডেট হয়েছে"); }
      else { saved = await api.create(codePrefix ? { ...data, code: nextCode() } : data); toast.success("যোগ হয়েছে"); }
      if (onAfterSave) { try { await onAfterSave(saved || data, { editing: !!editing }); } catch { /* side-effect ব্যর্থ হলেও মূল সেভ ঠিক আছে */ } }
      setModal(false); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const del = async (r) => {
    if (!window.confirm("এই এন্ট্রি মুছে ফেলবেন?")) return;
    await api.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload();
  };

  const cols = [
    { key: "sl", label: "ক্রমিক", width: 70, align: "center", render: (_r, i) => bn(i + 1) },
    ...columns,
    { key: "__actions", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon={icon} title={title} description={description} onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{headerExtra}<Button onClick={openCreate} icon="＋">{addLabel}</Button></div>} />
      <DataTable columns={cols} rows={rows} loading={loading} exportName={resourceKey}
        empty={{ icon, title: emptyTitle, description: `‘${addLabel}’ দিয়ে যোগ করুন` }} />
      {modal && (
        <Modal title={editing ? "সম্পাদনা" : addLabel} icon={icon} onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>💾 সংরক্ষণ</Button></>}>
          {codePrefix && <TextField label="আইডি" value={form.code || ""} onChange={(v) => setForm({ ...form, code: v })} />}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map((f) => (
              <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : "auto" }}>
                <FieldInput f={f} value={form[f.key] ?? ""} options={dynOpts[f.key]} onChange={(v) => changeField(f.key, v)} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
