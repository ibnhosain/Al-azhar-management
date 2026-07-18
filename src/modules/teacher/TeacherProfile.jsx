import { useState } from "react";
import { PageHeader, Card, Badge, Button } from "../../ui";
import TeacherPayroll from "./TeacherPayroll";
import TeacherAcademic from "./TeacherAcademic";
import TeacherDocuments from "./TeacherDocuments";
import TeacherComm from "./TeacherComm";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const money = (v) => { const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, "")) || 0; return "৳" + bn(n.toLocaleString("en-US")); };
const STATUS_COLOR = { "সক্রিয়": "#2E7D32", "ছুটিতে": "#EF6C00", "নিষ্ক্রিয়": "#E53935" };

const TABS = [
  { key: "profile", icon: "👤", label: "প্রোফাইল" },
  { key: "academic", icon: "🎓", label: "একাডেমিক" },
  { key: "payroll", icon: "💰", label: "পে-রোল" },
  { key: "documents", icon: "📁", label: "ডকুমেন্টস" },
];

function Avatar({ src, name, size = 40 }) {
  return src
    ? <img src={src} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #e0e6e0" }} />
    : <div style={{ width: size, height: size, borderRadius: "50%", background: "#F3E5F5", color: "#8E24AA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.42 }}>{(name || "?").trim().slice(0, 1)}</div>;
}

function Field({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "6px 0", fontSize: 13.5 }}>
      <span style={{ color: "#90A4AE", minWidth: 130 }}>{label}:</span>
      <span style={{ color: "#37474F", fontWeight: 600 }}>{value || "—"}</span>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <Card style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, color, marginBottom: 8, fontSize: 14 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>{children}</div>
    </Card>
  );
}

export default function TeacherProfile({ teacher, onBack, onEdit }) {
  const [tab, setTab] = useState("profile");
  const [t, setT] = useState(teacher);
  const [prev, setPrev] = useState(teacher);
  if (teacher !== prev) { setPrev(teacher); setT(teacher); } // prop বদলালে লোকাল কপি সিঙ্ক (effect ছাড়া)
  if (!t) return null;

  return (
    <div>
      <PageHeader icon="👨‍🏫" title={t.name} description={`আইডি ${t.code || "—"} · ${t.designation || "—"}${t.department ? " · " + t.department : ""}`}
        onBack={onBack}
        actions={<Button variant="secondary" onClick={() => onEdit && onEdit(t)} icon="✏">প্রোফাইল সম্পাদনা</Button>} />

      {/* Header card */}
      <Card style={{ padding: 16, marginBottom: 14, display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar src={t.photo} name={t.name} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#243B40" }}>{t.name}</div>
          <div style={{ fontSize: 13, color: "#607D8B", marginTop: 2 }}>{t.designation || "—"} · {t.subject || "—"}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge color={STATUS_COLOR[t.status] || "#607D8B"}>{t.status || "—"}</Badge>
            {t.employment_type && <Badge color="#5C6BC0">{t.employment_type}</Badge>}
            {t.salary && <Badge color="#00838F">বেতন {money(t.salary)}</Badge>}
          </div>
        </div>
        <TeacherComm teacher={t} />
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #eceff1", marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((x) => (
          <div key={x.key} onClick={() => setTab(x.key)} style={{
            padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 14,
            color: tab === x.key ? "#8E24AA" : "#78909C",
            borderBottom: tab === x.key ? "3px solid #8E24AA" : "3px solid transparent", marginBottom: -2,
          }}>{x.icon} {x.label}</div>
        ))}
      </div>

      {tab === "profile" && (
        <>
          <Section title="👤 ব্যক্তিগত তথ্য" color="#8E24AA">
            <Field label="পূর্ণ নাম" value={t.name} />
            <Field label="আইডি" value={t.code} />
            <Field label="জন্ম তারিখ" value={bn(t.dob)} />
            <Field label="রক্তের গ্রুপ" value={t.blood_group} />
            <Field label="জাতীয় পরিচয়পত্র" value={bn(t.nid)} />
          </Section>
          <Section title="📞 যোগাযোগ" color="#00838F">
            <Field label="মোবাইল" value={bn(t.phone)} />
            <Field label="হোয়াটসঅ্যাপ" value={bn(t.whatsapp)} />
            <Field label="ইমেইল" value={t.email} />
            <Field label="জরুরি যোগাযোগ" value={bn(t.emergency_contact)} />
            <Field label="ঠিকানা" value={t.address} />
          </Section>
          <Section title="💼 কর্মসংস্থান" color="#2E7D32">
            <Field label="পদবি" value={t.designation} />
            <Field label="বিভাগ" value={t.department} />
            <Field label="নিয়োগের ধরন" value={t.employment_type} />
            <Field label="যোগদানের তারিখ" value={bn(t.join_date)} />
            <Field label="মাসিক বেতন" value={t.salary ? money(t.salary) : "—"} />
            <Field label="অবস্থা" value={t.status} />
          </Section>
        </>
      )}

      {tab === "academic" && <TeacherAcademic teacher={t} onSaved={setT} />}

      {tab === "payroll" && <TeacherPayroll teacher={t} embedded />}

      {tab === "documents" && <TeacherDocuments teacher={t} />}
    </div>
  );
}
