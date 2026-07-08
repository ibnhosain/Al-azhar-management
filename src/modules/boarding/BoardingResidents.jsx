import { useState, useEffect } from "react";
import { PageHeader, DataTable, Badge, Button, Modal, useToast, TextField, SelectField } from "../../ui";
import { boarding, students as studentsApi, environment, seedResource } from "../../data";
import { bn } from "./constants";

const emptyForm = () => ({ name: "", room: "", floor: "", fee: "", status: "সক্রিয়" });
const initResidents = [
  { code: "BRD-001", name: "মোঃ আরিফ হোসেন", room: "A-১০১", floor: "১ম তলা", fee: "৳৮০০", status: "সক্রিয়" },
  { code: "BRD-002", name: "মোঃ ইমরান খান", room: "A-১০২", floor: "১ম তলা", fee: "৳৮০০", status: "সক্রিয়" },
  { code: "BRD-003", name: "মোঃ রাফি আহমেদ", room: "B-২০১", floor: "২য় তলা", fee: "৳৯০০", status: "বকেয়া" },
];

export default function BoardingResidents({ nav, icon }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [studentOpts, setStudentOpts] = useState([{ value: "", label: "— শিক্ষার্থী থেকে বাছুন (ঐচ্ছিক) —" }]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const reload = async () => { setRows(await boarding.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => {
      if (environment === "web") seedResource("boarding", initResidents);
      const studs = await studentsApi.list().catch(() => []);
      if (alive) setStudentOpts([{ value: "", label: "— শিক্ষার্থী থেকে বাছুন (ঐচ্ছিক) —" }, ...studs.map((s) => ({ value: s.name, label: `${s.name} (${s.code || s.roll || "—"})` }))]);
      await reload();
    })();
    return () => { alive = false; };
  }, []);

  const nextCode = () => {
    const nums = rows.map((r) => parseInt(String(r.code || "").replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return "BRD-" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
  };

  const save = async () => {
    if (!form.name.trim() || !form.room.trim()) return toast.error("নাম ও রুম নম্বর দিন");
    setSaving(true);
    try {
      await boarding.create({ ...form, code: nextCode() });
      toast.success("আবাসিক যোগ হয়েছে");
      setModal(false); setForm(emptyForm()); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const del = async (r) => {
    if (!window.confirm("এই আবাসিক মুছে ফেলবেন?")) return;
    await boarding.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload();
  };

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 70, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "code", label: "আইডি", sortable: true },
    { key: "name", label: "নাম", sortable: true },
    { key: "room", label: "রুম" },
    { key: "floor", label: "তলা" },
    { key: "fee", label: "ফি" },
    { key: "status", label: "অবস্থা", render: (r) => <Badge color={r.status === "সক্রিয়" ? "#2E7D32" : r.status === "বকেয়া" ? "#F59E0B" : "#E53935"}>{r.status}</Badge>, exportValue: (r) => r.status },
    { key: "__actions", label: "অ্যাকশন", render: (r) => <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑 মুছুন</Button> },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="আবাসিক তালিকা" description="বোর্ডিং শিক্ষার্থীদের তালিকা" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<Button onClick={() => { setForm(emptyForm()); setModal(true); }} icon="＋">নতুন আবাসিক</Button>} />
      <DataTable columns={columns} rows={rows} loading={loading} exportName="boarding-residents"
        empty={{ icon: "🏠", title: "কোনো আবাসিক নেই", description: "‘নতুন আবাসিক’ দিয়ে যোগ করুন" }} />
      {modal && (
        <Modal title="নতুন আবাসিক" icon="🏠" onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={save} loading={saving}>সংরক্ষণ</Button></>}>
          <SelectField label="শিক্ষার্থী থেকে অটো-ফিল" value="" onChange={(v) => v && setForm({ ...form, name: v })} options={studentOpts} />
          <TextField label="নাম" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <TextField label="রুম নম্বর" required value={form.room} onChange={(v) => setForm({ ...form, room: v })} />
            <TextField label="তলা" value={form.floor} onChange={(v) => setForm({ ...form, floor: v })} />
            <TextField label="মাসিক ফি" value={form.fee} onChange={(v) => setForm({ ...form, fee: v })} />
            <SelectField label="অবস্থা" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["সক্রিয়", "বকেয়া", "নিষ্ক্রিয়"]} />
          </div>
        </Modal>
      )}
    </div>
  );
}
