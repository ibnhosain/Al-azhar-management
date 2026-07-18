import { useState, useEffect, useMemo, useRef } from "react";
import { PageHeader, DataTable, StatCard, StatRow, Badge, Button, Modal, useToast, TextField, SelectField, ComboField, DateField, TextareaField } from "../../ui";
import { teachers as teachersApi, salaryLedger } from "../../data";
import TeacherPayroll from "./TeacherPayroll";
import TeacherProfile from "./TeacherProfile";
import TeacherReminders from "./TeacherReminders";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const num = (v) => { const e = String(v ?? "").replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d)); const n = parseFloat(e.replace(/[^\d.]/g, "")); return isNaN(n) ? 0 : n; };
const money = (n) => "৳" + bn((Math.round(n) || 0).toLocaleString("en-US"));

const DESIGNATIONS = ["প্রধান শিক্ষক", "সহকারী শিক্ষক", "মৌলভী", "হাফেজ", "ক্বারী", "মুহাদ্দিস", "শিক্ষিকা", "অন্যান্য"];
const DEPARTMENTS = ["হিফয বিভাগ", "নাজেরা বিভাগ", "কিতাব বিভাগ", "নূরানী বিভাগ", "মক্তব বিভাগ", "প্রশাসন", "অন্যান্য"];
const EMPLOYMENT_TYPES = ["স্থায়ী", "চুক্তিভিত্তিক", "খণ্ডকালীন", "শিক্ষানবিশ"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const STATUSES = ["সক্রিয়", "ছুটিতে", "নিষ্ক্রিয়"];
const STATUS_COLOR = { "সক্রিয়": "#2E7D32", "ছুটিতে": "#EF6C00", "নিষ্ক্রিয়": "#E53935" };

function resizeImg(file, max = 400) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); resolve(c.toDataURL("image/jpeg", 0.8)); }; img.onerror = reject; img.src = r.result; };
    r.onerror = reject; r.readAsDataURL(file);
  });
}

function Avatar({ src, name, size = 40 }) {
  return src
    ? <img src={src} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #e0e6e0" }} />
    : <div style={{ width: size, height: size, borderRadius: "50%", background: "#F3E5F5", color: "#8E24AA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42 }}>{(name || "?").trim().slice(0, 1)}</div>;
}

const emptyForm = () => ({
  name: "", designation: "সহকারী শিক্ষক", department: "", subject: "", qualification: "", skills: "",
  phone: "", whatsapp: "", email: "", nid: "", dob: "", blood_group: "", emergency_contact: "",
  salary: "", join_date: "", employment_type: "স্থায়ী", contract_end: "", increment_due: "", address: "", status: "সক্রিয়", photo: null,
});
const FIELDS = Object.keys(emptyForm());
const pickForm = (r) => { const f = { ...emptyForm() }; for (const k of FIELDS) if (r[k] != null) f[k] = r[k]; f.code = r.code || ""; return f; };

export default function TeacherList() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fltStatus, setFltStatus] = useState("");
  const [fltSubject, setFltSubject] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);     // খোলা শিক্ষকের প্রোফাইল (৪-ট্যাব পেজ)
  const [payroll, setPayroll] = useState(null);     // null | {teacher} | {dashboard:true}
  const [reminders, setReminders] = useState(false); // রিমাইন্ডার ভিউ
  const [dueMap, setDueMap] = useState({});          // { [teacher_id]: {due} } — বেতন লেজার থেকে
  const fileRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const reload = async () => {
    const [r, dm] = await Promise.all([teachersApi.list(), salaryLedger.duesByTeacher().catch(() => ({}))]);
    setRows(r); setDueMap(dm || {}); setLoading(false);
  };
  useEffect(() => { let alive = true; (async () => {
    const [r, dm] = await Promise.all([teachersApi.list(), salaryLedger.duesByTeacher().catch(() => ({}))]);
    if (alive) { setRows(r); setDueMap(dm || {}); setLoading(false); }
  })(); return () => { alive = false; }; }, []);

  const subjects = useMemo(() => [...new Set(rows.map((r) => r.subject).filter(Boolean))], [rows]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!fltStatus || r.status === fltStatus) && (!fltSubject || r.subject === fltSubject) &&
      (!t || [r.name, r.code, r.phone, r.subject, r.designation].some((v) => String(v || "").toLowerCase().includes(t)))
    );
  }, [rows, q, fltStatus, fltSubject]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.status === "সক্রিয়").length,
    leave: rows.filter((r) => r.status === "ছুটিতে").length,
    inactive: rows.filter((r) => r.status === "নিষ্ক্রিয়").length,
    salary: rows.reduce((s, r) => s + num(r.salary), 0),
  }), [rows]);

  const nextCode = () => { const n = rows.map((r) => parseInt(String(r.code || "").replace(/\D/g, ""), 10)).filter((x) => !isNaN(x)); return "TCH-" + String((n.length ? Math.max(...n) : 0) + 1).padStart(3, "0"); };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm(), code: nextCode() }); setModal(true); };
  const openEdit = (r) => { setEditing(r.id); setForm(pickForm(r)); setModal(true); };

  const onFile = async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; try { set("photo", await resizeImg(f)); } catch { toast.error("ছবি লোড হয়নি"); } };

  const save = async () => {
    if (!form.name.trim()) return toast.error("নাম দিন");
    setSaving(true);
    try {
      let savedRow;
      if (editing) { savedRow = await teachersApi.update(editing, form); toast.success("আপডেট হয়েছে"); }
      else { savedRow = await teachersApi.create({ ...form, code: form.code || nextCode() }); toast.success("শিক্ষক যোগ হয়েছে"); }
      setModal(false);
      if (profile && savedRow && savedRow.id === profile.id) setProfile(savedRow); // খোলা প্রোফাইল রিফ্রেশ
      await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };
  const del = async (r) => { if (!window.confirm(`"${r.name}" মুছবেন?`)) return; await teachersApi.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 64, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "photo", label: "ছবি", width: 56, render: (r) => <Avatar src={r.photo} name={r.name} /> },
    { key: "code", label: "আইডি", sortable: true },
    { key: "name", label: "নাম", sortable: true },
    { key: "designation", label: "পদবি", render: (r) => r.designation ? <Badge color="#8E24AA">{r.designation}</Badge> : "—", exportValue: (r) => r.designation },
    { key: "subject", label: "বিষয়", render: (r) => r.subject || "—" },
    { key: "phone", label: "ফোন", render: (r) => bn(r.phone || "—") },
    { key: "salary", label: "বেতন", align: "right", render: (r) => r.salary ? money(num(r.salary)) : "—", exportValue: (r) => num(r.salary), sortable: true },
    { key: "due", label: "বকেয়া বেতন", align: "right", render: (r) => { const d = num(dueMap[r.id] && dueMap[r.id].due); return d > 0 ? <Badge color="#E53935">{money(d)}</Badge> : <span style={{ color: "#2E7D32" }}>—</span>; }, exportValue: (r) => num(dueMap[r.id] && dueMap[r.id].due) },
    { key: "status", label: "অবস্থা", align: "center", render: (r) => <Badge color={STATUS_COLOR[r.status] || "#607D8B"}>{r.status || "—"}</Badge>, exportValue: (r) => r.status },
    { key: "__a", label: "কার্যক্রম", render: (r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <Button size="sm" variant="subtle" onClick={() => setPayroll({ teacher: r })} title="বেতন লেজার">💰</Button>
        <Button size="sm" variant="subtle" onClick={() => setProfile(r)} title="প্রোফাইল (৪ ট্যাব)">👁</Button>
        <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  const renderModal = () => (
    <Modal title={editing ? "শিক্ষক সম্পাদনা" : "নতুন শিক্ষক"} icon="👨‍🏫" width={640} onClose={() => setModal(false)}
      footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>💾 সংরক্ষণ</Button></>}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
        <Avatar src={form.photo} name={form.name} size={74} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ cursor: "pointer" }}><span style={{ padding: "7px 14px", borderRadius: 8, background: "#F3E5F5", color: "#8E24AA", fontWeight: 600, fontSize: 13, display: "inline-block" }}>📷 ছবি নির্বাচন</span><input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} /></label>
          {form.photo && <button type="button" onClick={() => set("photo", "")} style={{ background: "none", border: "none", color: "#E53935", cursor: "pointer", fontSize: 12, textAlign: "left" }}>✕ ছবি সরান</button>}
        </div>
      </div>
      <div style={{ fontWeight: 700, color: "#8E24AA", fontSize: 13, margin: "4px 0 8px" }}>👤 ব্যক্তিগত তথ্য</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
        <TextField label="আইডি (স্বয়ংক্রিয়)" value={form.code || ""} onChange={(v) => set("code", v)} />
        <TextField label="পূর্ণ নাম *" value={form.name} onChange={(v) => set("name", v)} />
        <DateField label="জন্ম তারিখ" value={form.dob} onChange={(v) => set("dob", v)} />
        <SelectField label="রক্তের গ্রুপ" value={form.blood_group} onChange={(v) => set("blood_group", v)} options={[{ value: "", label: "— বাছুন —" }, ...BLOOD_GROUPS]} />
        <TextField label="জাতীয় পরিচয়পত্র (NID)" value={form.nid} onChange={(v) => set("nid", v)} />
      </div>

      <div style={{ fontWeight: 700, color: "#00838F", fontSize: 13, margin: "12px 0 8px" }}>📞 যোগাযোগ</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
        <TextField label="মোবাইল নম্বর" value={form.phone} onChange={(v) => set("phone", v)} />
        <TextField label="হোয়াটসঅ্যাপ নম্বর" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} />
        <TextField label="ইমেইল" value={form.email} onChange={(v) => set("email", v)} />
        <TextField label="জরুরি যোগাযোগ" value={form.emergency_contact} onChange={(v) => set("emergency_contact", v)} />
      </div>
      <TextareaField label="ঠিকানা" value={form.address} onChange={(v) => set("address", v)} rows={2} />

      <div style={{ fontWeight: 700, color: "#2E7D32", fontSize: 13, margin: "12px 0 8px" }}>💼 কর্মসংস্থান ও একাডেমিক</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
        <ComboField label="পদবি (বাছুন বা নিজে লিখুন)" value={form.designation} onChange={(v) => set("designation", v)} options={DESIGNATIONS} />
        <ComboField label="বিভাগ (Department)" value={form.department} onChange={(v) => set("department", v)} options={DEPARTMENTS} />
        <SelectField label="নিয়োগের ধরন" value={form.employment_type} onChange={(v) => set("employment_type", v)} options={EMPLOYMENT_TYPES} />
        <DateField label="যোগদানের তারিখ" value={form.join_date} onChange={(v) => set("join_date", v)} />
        <DateField label="চুক্তি শেষের তারিখ" value={form.contract_end} onChange={(v) => set("contract_end", v)} />
        <DateField label="ইনক্রিমেন্টের তারিখ" value={form.increment_due} onChange={(v) => set("increment_due", v)} />
        <TextField label="বিষয়" value={form.subject} onChange={(v) => set("subject", v)} />
        <TextField label="শিক্ষাগত যোগ্যতা" value={form.qualification} onChange={(v) => set("qualification", v)} />
        <TextField label="দক্ষতা / Skills" value={form.skills} onChange={(v) => set("skills", v)} />
        <TextField label="মাসিক বেতন" value={form.salary} onChange={(v) => set("salary", v)} />
        <SelectField label="অবস্থা" value={form.status} onChange={(v) => set("status", v)} options={STATUSES} />
      </div>
    </Modal>
  );

  // প্রোফাইল ৪-ট্যাব পেজ — এডিট মডাল প্রোফাইলের উপরেই খোলে
  if (profile) return (
    <>
      <TeacherProfile teacher={profile} onBack={() => { setProfile(null); reload(); }} onEdit={openEdit} />
      {modal && renderModal()}
    </>
  );

  // পে-রোল ভিউ (বেতন লেজার / ড্যাশবোর্ড) — বিদ্যমান তালিকা অক্ষুণ্ণ রেখে
  if (payroll) return <TeacherPayroll teacher={payroll.teacher} startDashboard={payroll.dashboard} onBack={() => { setPayroll(null); reload(); }} />;

  // রিমাইন্ডার ভিউ
  if (reminders) return <TeacherReminders onBack={() => setReminders(false)} />;

  return (
    <div>
      <PageHeader icon="👨‍🏫" title="শিক্ষক ব্যবস্থাপনা" description="শিক্ষকের তথ্য, পদবি, বিষয়, বেতন ও ছবি"
        actions={<><Button variant="secondary" onClick={() => setReminders(true)} icon="🔔">রিমাইন্ডার</Button><Button variant="secondary" onClick={() => setPayroll({ dashboard: true })} icon="💰">পে-রোল ড্যাশবোর্ড</Button><Button onClick={openCreate} icon="＋">নতুন শিক্ষক</Button></>} />

      <StatRow>
        <StatCard icon="👥" label="মোট শিক্ষক" value={bn(stats.total)} color="#8E24AA" />
        <StatCard icon="✅" label="সক্রিয়" value={bn(stats.active)} color="#2E7D32" />
        <StatCard icon="🏖️" label="ছুটিতে" value={bn(stats.leave)} color="#EF6C00" />
        <StatCard icon="🚫" label="নিষ্ক্রিয়" value={bn(stats.inactive)} color="#E53935" />
        <StatCard icon="💰" label="মোট মাসিক বেতন" value={money(stats.salary)} color="#00838F" />
      </StatRow>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "16px 0" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 নাম / আইডি / ফোন / বিষয়" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cfd8cf", minWidth: 250, fontSize: 14 }} />
        <select value={fltSubject} onChange={(e) => setFltSubject(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }}>
          <option value="">সব বিষয়</option>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fltStatus} onChange={(e) => setFltStatus(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }}>
          <option value="">সব অবস্থা</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} exportName="teachers"
        empty={{ icon: "👨‍🏫", title: "কোনো শিক্ষক নেই", description: "‘নতুন শিক্ষক’ দিয়ে যোগ করুন" }} />

      {modal && renderModal()}
    </div>
  );
}
