import { useState, useEffect, useRef } from "react";
import { PageHeader, Card, Button, Badge, Modal, useToast, TextField, SelectField, DateField, TextareaField } from "../../ui";
import { students as studentsApi } from "../../data";

// ── option তালিকা ──
const ADMISSION_TYPES = ["নতুন ভর্তি", "পুরাতন ভর্তি"];
const STUDENT_TYPES = ["আবাসিক", "অনাবাসিক"];
const SESSIONS = ["২০২৬", "২০২৬-২৭", "২০২৭"];
const CLASSES = ["নার্সারি গ্রুপ", "১ম বর্ষ", "নাজেরা বিভাগ", "হিফযুল কুরআন বিভাগ", "১ম শ্রেণি", "২য় শ্রেণি", "৩য় শ্রেণি"];
const GENDERS = ["ছাত্র", "ছাত্রী"];
const YESNO = ["না", "হ্যাঁ"];
const SECTIONS = ["ক", "খ", "গ"];
const BLOODS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  form_no: "", adm_date: todayISO(), admission_type: "নতুন ভর্তি", name: "",
  father: "", mother: "", dob: "", fingerprint_id: "", birth_cert: "",
  prev_institution: "", prev_class: "", new_result: "",
  student_type: "অনাবাসিক", session: "২০২৬", class: "নার্সারি গ্রুপ", dakhela_no: "",
  roll: "", gender: "ছাত্র", orphan: "না", section: "", blood_group: "",
  mobile: "", guardian_current: "", guardian_mobile2: "", guardian_name2: "",
  guardian_mobile3: "", guardian_name3: "", guardian_nid: "", id_number: "",
  relation: "", occupation: "", village: "", post_office: "", police_station: "", district: "",
  guardian_address: "", photo: null,
  fee: "", discount: "", received: "",
});

function resizeImg(file, max = 420) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject; img.src = r.result;
    };
    r.onerror = reject; r.readAsDataURL(file);
  });
}

// সেকশন হেডার (স্ক্রিনশটের মতো)
function SecHead({ icon, bn, en }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 14px", paddingBottom: 8, borderBottom: "1px solid #eef2ee" }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: 700, color: "#1b4d3e", fontSize: 15 }}>{bn} <span style={{ color: "#90A4AE", fontWeight: 500 }}>/ {en}</span></span>
    </div>
  );
}

// ওয়েবক্যাম মডাল
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let stream;
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then((s) => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setErr("ক্যামেরা খোলা যায়নি — গ্যালারি থেকে বেছে নিন।"));
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);
  const snap = () => {
    const v = videoRef.current; if (!v || !v.videoWidth) return;
    const max = 420, s = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = v.videoWidth * s; c.height = v.videoHeight * s;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    onCapture(c.toDataURL("image/jpeg", 0.8)); onClose();
  };
  return (
    <Modal title="ছবি তুলুন" icon="📷" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>বাতিল</Button><Button onClick={snap} disabled={!!err}>📸 ক্যাপচার</Button></>}>
      {err ? <div style={{ color: "#E53935", padding: 16 }}>{err}</div>
        : <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 10, background: "#000" }} />}
    </Modal>
  );
}

export default function StudentAdmission({ onBack, onSaved }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [cam, setCam] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ফর্ম নং স্বয়ংক্রিয় (বিদ্যমান সংখ্যা + ১)
  useEffect(() => { studentsApi.list().then((l) => set("form_no", String((l || []).length + 1))).catch(() => {}); }, []);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { set("photo", await resizeImg(file)); } catch { toast.error("ছবি লোড হয়নি"); }
  };

  const nextCode = (list) => {
    const nums = (list || []).map((s) => parseInt(String(s.code || "").replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0");
  };

  const due = (Number(form.fee) || 0) - (Number(form.discount) || 0) - (Number(form.received) || 0);

  const save = async () => {
    if (!form.name.trim()) { setStep(1); return toast.error("শিক্ষার্থীর নাম দিন"); }
    if (!form.roll.trim()) { setStep(1); return toast.error("রোল নং দিন"); }
    if (!form.mobile.trim()) { setStep(1); return toast.error("মোবাইল নম্বর দিন"); }
    setSaving(true);
    try {
      const list = await studentsApi.list();
      await studentsApi.create({ ...form, code: nextCode(list), status: "সক্রিয়" });
      toast.success("🎓 শিক্ষার্থী ভর্তি সম্পন্ন হয়েছে");
      onSaved && onSaved();
      onBack && onBack();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(215px,1fr))", gap: "0 16px" };

  const stepper = (
    <Card style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        {[[1, "শিক্ষার্থীর তথ্য", "Student Data"], [2, "পেমেন্ট তথ্য", "Payment Data"]].map(([n, bn, en], i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => setStep(n)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 18px", borderRadius: 10, background: step === n ? "#1b5e20" : "#f1f5f1", color: step === n ? "#fff" : "#607D8B", fontWeight: 700 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: step === n ? "#fff" : "#cfd8cf", color: step === n ? "#1b5e20" : "#607D8B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{n}</span>
              <span style={{ fontSize: 13 }}>{bn} <span style={{ opacity: .7 }}>/ {en}</span></span>
            </div>
            {i === 0 && <span style={{ color: "#cfd8cf" }}>———</span>}
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader icon="🧑‍🎓" title="স্টুডেন্ট তৈরি" description="নতুন শিক্ষার্থী ভর্তি ফরম" onBack={onBack} breadcrumb={[{ label: "শিক্ষার্থী ব্যবস্থাপনা", onClick: onBack }, { label: "ভর্তি" }]} />
      {stepper}

      {step === 1 && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <SecHead icon="📝" bn="মৌলিক তথ্য" en="Basic Information" />
            <div style={grid}>
              <TextField label="ফর্ম নং / Form No *" value={form.form_no} onChange={(v) => set("form_no", v)} />
              <DateField label="তারিখ / Date *" value={form.adm_date} onChange={(v) => set("adm_date", v)} />
              <SelectField label="ভর্তির ধরন / Admission Type *" value={form.admission_type} onChange={(v) => set("admission_type", v)} options={ADMISSION_TYPES} />
              <TextField label="নাম / Student Name *" value={form.name} onChange={(v) => set("name", v)} />
              <TextField label="পিতা / Father Name *" value={form.father} onChange={(v) => set("father", v)} />
              <TextField label="মাতা / Mother Name" value={form.mother} onChange={(v) => set("mother", v)} />
              <DateField label="জন্ম তারিখ / Date Of Birth" value={form.dob} onChange={(v) => set("dob", v)} />
              <TextField label="ফিঙ্গারপ্রিন্ট আইডি / Fingerprint ID" value={form.fingerprint_id} onChange={(v) => set("fingerprint_id", v)} />
              <TextField label="জন্ম নিবন্ধন / Birth Certificate" value={form.birth_cert} onChange={(v) => set("birth_cert", v)} />
              <TextField label="পূর্ববর্তী প্রতিষ্ঠান / Previous Institution" value={form.prev_institution} onChange={(v) => set("prev_institution", v)} />
              <TextField label="পূর্ববর্তী ক্লাস / Previous Class" value={form.prev_class} onChange={(v) => set("prev_class", v)} />
              <TextField label="নতুন শিক্ষার্থীর রেজাল্ট / New Student Result" value={form.new_result} onChange={(v) => set("new_result", v)} />
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <SecHead icon="🎓" bn="ক্লাস ও সেশন" en="Class & Session" />
            <div style={grid}>
              <SelectField label="শিক্ষার্থীর ধরন / Student Type *" value={form.student_type} onChange={(v) => set("student_type", v)} options={STUDENT_TYPES} />
              <SelectField label="শিক্ষার্থীর সেশন / Session *" value={form.session} onChange={(v) => set("session", v)} options={SESSIONS} />
              <SelectField label="ক্লাস / Class *" value={form.class} onChange={(v) => set("class", v)} options={CLASSES} />
              <TextField label="দাখেলা নং / Dhakhela No" value={form.dakhela_no} onChange={(v) => set("dakhela_no", v)} />
              <TextField label="রোল নং / Roll No *" value={form.roll} onChange={(v) => set("roll", v)} />
              <SelectField label="লিঙ্গ / Student Gender *" value={form.gender} onChange={(v) => set("gender", v)} options={GENDERS} />
              <SelectField label="এতিম / Orphan *" value={form.orphan} onChange={(v) => set("orphan", v)} options={YESNO} />
              <SelectField label="সেকশন / Section" value={form.section} onChange={(v) => set("section", v)} options={SECTIONS} />
              <SelectField label="রক্তের গ্রুপ / Blood Group" value={form.blood_group} onChange={(v) => set("blood_group", v)} options={BLOODS} />
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <SecHead icon="👨‍👩‍👧" bn="অভিভাবক" en="Guardian" />
            <div style={grid}>
              <TextField label="মোবাইল / Mobile *" value={form.mobile} onChange={(v) => set("mobile", v)} />
              <TextField label="বর্তমান অভিভাবক / Current Guardian" value={form.guardian_current} onChange={(v) => set("guardian_current", v)} />
              <TextField label="অভিভাবকের মোবাইল ২ / Guardian Mobile 2" value={form.guardian_mobile2} onChange={(v) => set("guardian_mobile2", v)} />
              <TextField label="অভিভাবকের নাম ২ / Guardian Name 2" value={form.guardian_name2} onChange={(v) => set("guardian_name2", v)} />
              <TextField label="অভিভাবকের মোবাইল ৩ / Guardian Mobile 3" value={form.guardian_mobile3} onChange={(v) => set("guardian_mobile3", v)} />
              <TextField label="অভিভাবকের নাম ৩ / Guardian Name 3" value={form.guardian_name3} onChange={(v) => set("guardian_name3", v)} />
              <TextField label="অভিভাবকের এন আইডি / Guardian NID" value={form.guardian_nid} onChange={(v) => set("guardian_nid", v)} />
              <TextField label="আইডি নাম্বার / Id Number" value={form.id_number} onChange={(v) => set("id_number", v)} />
              <TextField label="সম্পর্ক / Relation" value={form.relation} onChange={(v) => set("relation", v)} />
              <TextField label="পেশা / Occupation" value={form.occupation} onChange={(v) => set("occupation", v)} />
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <SecHead icon="📍" bn="ঠিকানা" en="Address" />
            <div style={grid}>
              <TextField label="গ্রাম / Village" value={form.village} onChange={(v) => set("village", v)} />
              <TextField label="ডাকঘর / Post Office" value={form.post_office} onChange={(v) => set("post_office", v)} />
              <TextField label="থানা / Police Station" value={form.police_station} onChange={(v) => set("police_station", v)} />
              <TextField label="জেলা / District" value={form.district} onChange={(v) => set("district", v)} />
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <SecHead icon="🏠" bn="অভিভাবকের ঠিকানা ও ছবি" en="Guardian Address & Photo" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <TextareaField label="অভিভাবকের ঠিকানা / Guardian's Address" value={form.guardian_address} onChange={(v) => set("guardian_address", v)} rows={4} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6a72", marginBottom: 5 }}>শিক্ষার্থীর ছবি / Student Photo</div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 92, height: 92, borderRadius: 12, border: "1px dashed #cfd8cf", background: "#f7faf7", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.photo ? <img src={form.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, color: "#b0bec5" }}>👤</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Button onClick={() => setCam(true)} icon="📷" style={{ background: "#1976D2" }}>Take Photo</Button>
                    <Button variant="secondary" onClick={() => fileRef.current && fileRef.current.click()} icon="🖼">Select from Gallery</Button>
                    {form.photo && <button type="button" onClick={() => set("photo", "")} style={{ background: "none", border: "none", color: "#E53935", cursor: "pointer", fontSize: 12, textAlign: "left" }}>✕ ছবি সরান</button>}
                    <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setStep(2)} icon="→">পরবর্তী - পেমেন্ট / Next to Payment</Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <SecHead icon="💵" bn="পেমেন্ট তথ্য" en="Payment Data" />
            <div style={grid}>
              <TextField label="ভর্তি ফি / Admission Fee" value={form.fee} onChange={(v) => set("fee", v.replace(/[^\d.]/g, ""))} />
              <TextField label="ছাড় / Discount" value={form.discount} onChange={(v) => set("discount", v.replace(/[^\d.]/g, ""))} />
              <TextField label="গৃহীত / Received" value={form.received} onChange={(v) => set("received", v.replace(/[^\d.]/g, ""))} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6a72", marginBottom: 5 }}>বকেয়া / Due</div>
                <div style={{ padding: "11px 12px", border: "1px solid #E0E0E0", borderRadius: 8, background: "#f7faf7", fontWeight: 700, color: due > 0 ? "#E53935" : "#2E7D32" }}>৳ {due.toLocaleString("en-US")}</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}><Badge color="#00838F">শিক্ষার্থী: {form.name || "—"}</Badge> <Badge color="#6A1B9A">শ্রেণি: {form.class}</Badge></div>
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="secondary" onClick={() => setStep(1)} icon="←">পূর্ববর্তী</Button>
            <Button onClick={save} loading={saving} icon="💾">ভর্তি সম্পন্ন করুন</Button>
          </div>
        </>
      )}

      {cam && <CameraModal onCapture={(d) => set("photo", d)} onClose={() => setCam(false)} />}
    </div>
  );
}
