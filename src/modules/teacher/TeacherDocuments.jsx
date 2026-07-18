import { useState, useEffect, useRef } from "react";
import { Card, Badge, Button, useToast, TextField, SelectField } from "../../ui";
import { teacherDocument } from "../../data";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const fmtSize = (n) => { const b = Number(n) || 0; if (b < 1024) return bn(b) + " B"; if (b < 1048576) return bn((b / 1024).toFixed(1)) + " KB"; return bn((b / 1048576).toFixed(1)) + " MB"; };
const MAX = 15 * 1024 * 1024;

const DOC_TYPES = [
  { value: "appointment", label: "নিয়োগপত্র", color: "#2E7D32" },
  { value: "nid", label: "জাতীয় পরিচয়পত্র (NID)", color: "#1565C0" },
  { value: "cv", label: "সিভি / জীবনবৃত্তান্ত", color: "#6A1B9A" },
  { value: "certificate", label: "সার্টিফিকেট", color: "#00838F" },
  { value: "experience", label: "অভিজ্ঞতা সনদ", color: "#EF6C00" },
  { value: "contract", label: "চুক্তিপত্র", color: "#5C6BC0" },
  { value: "other", label: "অন্যান্য ফাইল", color: "#607D8B" },
];
const typeInfo = (v) => DOC_TYPES.find((d) => d.value === v) || DOC_TYPES[DOC_TYPES.length - 1];

export default function TeacherDocuments({ teacher: t }) {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ doc_type: "appointment", title: "" });
  const [file, setFile] = useState(null); // { name, mime, size, data }
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = () => teacherDocument.list(t.id).then((r) => { setDocs(r || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => {
    let alive = true;
    teacherDocument.list(t.id).then((r) => { if (alive) { setDocs(r || []); setLoading(false); } }).catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [t.id]);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > MAX) { toast.error("ফাইল ১৫MB-এর বেশি হতে পারবে না"); return; }
    const r = new FileReader();
    r.onload = () => setFile({ name: f.name, mime: f.type, size: f.size, data: r.result });
    r.onerror = () => toast.error("ফাইল পড়া যায়নি");
    r.readAsDataURL(f);
  };

  const save = async () => {
    if (!file) return toast.error("একটি ফাইল নির্বাচন করুন");
    setSaving(true);
    try {
      await teacherDocument.add({ teacher_id: t.id, doc_type: form.doc_type, title: form.title || file.name,
        file_name: file.name, mime: file.mime, size: file.size, data: file.data });
      toast.success("ডকুমেন্ট সংরক্ষিত হয়েছে");
      setForm({ doc_type: form.doc_type, title: "" }); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const open = async (d) => { const r = await teacherDocument.open(d.id); if (r && r.ok === false) toast.error(r.error || "খোলা যায়নি"); };
  const del = async (d) => { if (!window.confirm(`"${d.title || d.original_name}" মুছবেন?`)) return; await teacherDocument.remove(d.id); toast.success("মুছে ফেলা হয়েছে"); load(); };

  return (
    <div>
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: "#5C6BC0", marginBottom: 12, fontSize: 14 }}>📤 নতুন ডকুমেন্ট আপলোড</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
          <SelectField label="ধরন" value={form.doc_type} onChange={(v) => setForm({ ...form, doc_type: v })} options={DOC_TYPES} />
          <TextField label="শিরোনাম (ঐচ্ছিক)" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <label style={{ cursor: "pointer" }}>
            <span style={{ padding: "9px 16px", borderRadius: 8, background: "#E8EAF6", color: "#3949AB", fontWeight: 600, fontSize: 13, display: "inline-block" }}>📎 ফাইল নির্বাচন (PDF/ছবি/ডক)</span>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={onFile} style={{ display: "none" }} />
          </label>
          {file && <span style={{ fontSize: 13, color: "#37474F" }}>📄 {file.name} <span style={{ color: "#90A4AE" }}>({fmtSize(file.size)})</span></span>}
          <div style={{ flex: 1 }} />
          <Button onClick={save} loading={saving} icon="💾">সংরক্ষণ</Button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#90A4AE" }}>💡 ফাইল ডেটা ফোল্ডারে (ব্যাকআপসহ) নিরাপদে সংরক্ষিত হয়; “খুলুন”-এ ডিফল্ট অ্যাপে খোলে।</div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, color: "#37474F", marginBottom: 12, fontSize: 14 }}>🗂️ সংরক্ষিত ডকুমেন্ট <Badge color="#5C6BC0">{bn(docs.length)}</Badge></div>
        {loading ? <div style={{ color: "#90A4AE" }}>লোড হচ্ছে…</div>
          : docs.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13, textAlign: "center", padding: "24px 0" }}>এখনো কোনো ডকুমেন্ট নেই — উপরে আপলোড করুন।</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
                <thead><tr style={{ background: "#EDE7F6" }}>{["ধরন", "শিরোনাম", "ফাইল", "আকার", "তারিখ", "কার্যক্রম"].map((h) => <th key={h} style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #d7ccec" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {docs.map((d) => { const ti = typeInfo(d.doc_type); return (
                    <tr key={d.id}>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}><Badge color={ti.color}>{ti.label}</Badge></td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef", fontWeight: 600 }}>{d.title || "—"}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef", color: "#607D8B" }}>{d.original_name || "—"}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{fmtSize(d.size)}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{bn(String(d.created_at || "").slice(0, 10))}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <Button size="sm" variant="subtle" onClick={() => open(d)} title="খুলুন">📂</Button>
                          <Button size="sm" variant="dangerSoft" onClick={() => del(d)} title="মুছুন">🗑</Button>
                        </div>
                      </td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          )}
      </Card>
    </div>
  );
}
