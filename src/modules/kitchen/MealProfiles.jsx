import { useState, useEffect, useMemo } from "react";
import { PageHeader, DataTable, Badge, Button, Modal, useToast, SelectField, TextField, TextareaField } from "../../ui";
import { mealProfiles } from "../../data";
import { bn, MEALS, DIET_TYPES, resizeImage } from "./constants";

const DIET_COLOR = { normal: "#2E7D32", special: "#EF6C00", sick: "#E53935", vip: "#6A1B9A" };
const dietLabel = (v) => (DIET_TYPES.find((d) => d.value === v) || DIET_TYPES[0]).label;

function Avatar({ src, name, size = 38 }) {
  const initials = (name || "?").trim().slice(0, 1);
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #dfe6df" }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#E8F5E9", color: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42 }}>{initials}</div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600,
      border: `1.5px solid ${active ? "#2E7D32" : "#cfd8cf"}`,
      background: active ? "#2E7D32" : "#fff", color: active ? "#fff" : "#4a5a4a",
    }}>{children}</button>
  );
}

const EMPTY = { take_breakfast: "1", take_lunch: "1", take_dinner: "1", home_food: "0", meal_status: "active", diet_type: "normal", allergy: "", note: "", photo: null };

export default function MealProfiles({ nav, icon }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [pf, setPf] = useState("");   // "" সব | "yes" তৈরি | "no" বাকি
  const [modal, setModal] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => { setRows(await mealProfiles.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => { const r = await mealProfiles.list(); if (alive) { setRows(r); setLoading(false); } })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (pf === "yes" && !r.has_profile) return false;
      if (pf === "no" && r.has_profile) return false;
      if (!t) return true;
      return [r.name, r.code, r.class, r.room_no].some((v) => String(v || "").toLowerCase().includes(t));
    });
  }, [rows, q, pf]);

  const pendingCount = useMemo(() => rows.filter((r) => !r.has_profile).length, [rows]);

  const openEdit = (r) => {
    setCurrent(r);
    setForm({ take_breakfast: r.take_breakfast, take_lunch: r.take_lunch, take_dinner: r.take_dinner, home_food: r.home_food, meal_status: r.meal_status, diet_type: r.diet_type, allergy: r.allergy || "", note: r.note || "", photo: r.photo || null });
    setModal(true);
  };

  const toggle = (key) => setForm((f) => ({ ...f, [key]: f[key] === "1" ? "0" : "1" }));
  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { const photo = await resizeImage(file); setForm((f) => ({ ...f, photo })); } catch { toast.error("ছবি লোড হয়নি"); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await mealProfiles.upsert(current.id, form);
      toast.success("প্রোফাইল সংরক্ষণ হয়েছে");
      setModal(false); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const mealBadges = (r) => (
    <div style={{ display: "flex", gap: 4 }}>
      {MEALS.map((m) => <span key={m.key} title={m.label} style={{ opacity: r["take_" + m.key] === "1" ? 1 : 0.22, fontSize: 15 }}>{m.icon}</span>)}
    </div>
  );

  const columns = [
    { key: "photo", label: "ছবি", width: 60, render: (r) => <Avatar src={r.photo} name={r.name} /> },
    { key: "name", label: "নাম", sortable: true },
    { key: "code", label: "আইডি", sortable: true },
    { key: "class", label: "শ্রেণি", sortable: true },
    { key: "room_no", label: "রুম", render: (r) => r.room_no || "—" },
    { key: "meals", label: "বেলা", render: mealBadges, exportValue: (r) => MEALS.filter((m) => r["take_" + m.key] === "1").map((m) => m.short).join("/") },
    { key: "home_food", label: "বাড়ির খাবার", align: "center", render: (r) => r.home_food === "1" ? <Badge color="#0288D1">হ্যাঁ</Badge> : <span style={{ color: "#9aa" }}>—</span>, exportValue: (r) => r.home_food === "1" ? "হ্যাঁ" : "না" },
    { key: "diet_type", label: "ডায়েট", render: (r) => <Badge color={DIET_COLOR[r.diet_type]}>{dietLabel(r.diet_type)}</Badge>, exportValue: (r) => dietLabel(r.diet_type) },
    { key: "allergy", label: "অ্যালার্জি", render: (r) => r.allergy ? <span title={r.allergy} style={{ color: "#E53935" }}>⚠ {r.allergy}</span> : <span style={{ color: "#9aa" }}>—</span> },
    { key: "meal_status", label: "অবস্থা", render: (r) => r.meal_status === "active" ? <Badge color="#2E7D32">সক্রিয়</Badge> : <Badge color="#EF6C00">বিরত</Badge>, exportValue: (r) => r.meal_status },
    { key: "has_profile", label: "প্রোফাইল", align: "center", render: (r) => r.has_profile ? <Badge color="#2E7D32">তৈরি হয়েছে</Badge> : <Badge color="#90A4AE">ডিফল্ট</Badge>, exportValue: (r) => r.has_profile ? "তৈরি" : "ডিফল্ট" },
    { key: "__actions", label: "", render: (r) => r.has_profile
      ? <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏ সম্পাদনা</Button>
      : <Button size="sm" onClick={() => openEdit(r)}>＋ প্রোফাইল তৈরি</Button> },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="ছাত্র মিল প্রোফাইল"
        description={`সব ছাত্র এখানে আছে — সারির বাটনে ক্লিক করে প্রোফাইল তৈরি/সম্পাদনা করুন${pendingCount ? ` • ${bn(pendingCount)} জনের প্রোফাইল বাকি` : ""}`}
        onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 নাম / আইডি / রুম" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cfd8cf", minWidth: 200, fontSize: 14 }} />
          <select value={pf} onChange={(e) => setPf(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }}>
            <option value="">সব ছাত্র</option>
            <option value="no">প্রোফাইল বাকি</option>
            <option value="yes">তৈরি হয়েছে</option>
          </select>
        </div>} />
      <DataTable columns={columns} rows={filtered} loading={loading} exportName="meal-profiles"
        empty={{ icon: "🍽️", title: "কোনো ছাত্র নেই", description: "ছাত্র যোগ করলে এখানে প্রোফাইল দেখা যাবে" }} />

      {modal && current && (
        <Modal title={`মিল প্রোফাইল — ${current.name}`} icon="🍽️" onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>💾 সংরক্ষণ</Button></>}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
            <Avatar src={form.photo} name={current.name} size={72} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ cursor: "pointer" }}>
                <span style={{ padding: "7px 14px", borderRadius: 8, background: "#E8F5E9", color: "#2E7D32", fontWeight: 600, fontSize: 13, display: "inline-block" }}>📷 ছবি নির্বাচন</span>
                <input type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
              </label>
              {form.photo && <button type="button" onClick={() => setForm((f) => ({ ...f, photo: "" }))} style={{ background: "none", border: "none", color: "#E53935", cursor: "pointer", fontSize: 12, textAlign: "left" }}>✕ ছবি সরান</button>}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "#4a5a4a", marginBottom: 6 }}>কোন বেলা খাবে (একাধিক)</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {MEALS.map((m) => <Chip key={m.key} active={form["take_" + m.key] === "1"} onClick={() => toggle("take_" + m.key)}>{m.icon} {m.label}</Chip>)}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <Chip active={form.home_food === "1"} onClick={() => toggle("home_food")}>🏠 বাড়ির খাবার</Chip>
            <Chip active={form.meal_status !== "active"} onClick={() => setForm((f) => ({ ...f, meal_status: f.meal_status === "active" ? "paused" : "active" }))}>⏸ মিল বিরত</Chip>
          </div>

          <SelectField label="ডায়েট টাইপ" value={form.diet_type} onChange={(v) => setForm({ ...form, diet_type: v })} options={DIET_TYPES} />
          <TextField label="অ্যালার্জি (যদি থাকে)" value={form.allergy} onChange={(v) => setForm({ ...form, allergy: v })} placeholder="যেমন: বাদাম, ডিম" />
          <TextareaField label="নোট" value={form.note} onChange={(v) => setForm({ ...form, note: v })} rows={2} />
        </Modal>
      )}
    </div>
  );
}
