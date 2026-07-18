import { useState, useEffect } from "react";
import { Card, Badge, Button, useToast, TextField, SelectField, DateField, TextareaField } from "../../ui";
import { teachers as teachersApi, teacherAcademic } from "../../data";

const bn = (s) => String(s ?? "").replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const todayISO = () => new Date().toISOString().slice(0, 10);
const WEEKDAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const DAYS = ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার"];
const RATINGS = ["চমৎকার", "খুব ভালো", "ভালো", "মোটামুটি", "উন্নতি প্রয়োজন"];
const RATING_COLOR = { "চমৎকার": "#2E7D32", "খুব ভালো": "#388E3C", "ভালো": "#00838F", "মোটামুটি": "#EF6C00", "উন্নতি প্রয়োজন": "#E53935" };
const todayWeekday = () => WEEKDAYS[new Date().getDay()];

function SecTitle({ children, color }) {
  return <div style={{ fontWeight: 700, color: color || "#8E24AA", marginBottom: 12, fontSize: 14 }}>{children}</div>;
}

// চিপ এডিটর (বিষয়/ক্লাস)
function Chips({ items, onAdd, onRemove, placeholder, color }) {
  const [v, setV] = useState("");
  const add = () => { const t = v.trim(); if (t) { onAdd(t); setV(""); } };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {(items || []).length === 0 && <span style={{ color: "#90A4AE", fontSize: 13 }}>— কিছু যোগ করা হয়নি —</span>}
        {(items || []).map((it, i) => (
          <span key={i} style={{ background: color + "22", color, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {it}<span onClick={() => onRemove(i)} style={{ cursor: "pointer", color: "#E53935", fontWeight: 700 }}>✕</span>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={placeholder} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #cfd8cf", fontSize: 14 }} />
        <Button size="sm" variant="secondary" onClick={add} icon="＋">যোগ</Button>
      </div>
    </div>
  );
}

export default function TeacherAcademic({ teacher: t, onSaved }) {
  const toast = useToast();
  const [cfg, setCfg] = useState({
    academic_subjects: t.academic_subjects || (t.subject ? [t.subject] : []),
    academic_classes: t.academic_classes || [],
    routine: t.routine || [],
    certificates: t.certificates || [],
  });
  const [diary, setDiary] = useState([]);
  const [perf, setPerf] = useState([]);
  const [savingCfg, setSavingCfg] = useState(false);
  const [rt, setRt] = useState({ day: "শনিবার", time: "", class: "", subject: "" });
  const [cert, setCert] = useState({ title: "", institution: "", year: "" });
  const [dEntry, setDEntry] = useState({ log_date: todayISO(), class: "", subject: "", title: "", detail: "" });
  const [pEntry, setPEntry] = useState({ log_date: todayISO(), title: "", rating: "ভালো", detail: "" });

  const loadLogs = () => {
    teacherAcademic.list(t.id, "diary").then((r) => setDiary(r || [])).catch(() => {});
    teacherAcademic.list(t.id, "performance").then((r) => setPerf(r || [])).catch(() => {});
  };
  useEffect(() => {
    let alive = true;
    teacherAcademic.list(t.id, "diary").then((r) => alive && setDiary(r || [])).catch(() => {});
    teacherAcademic.list(t.id, "performance").then((r) => alive && setPerf(r || [])).catch(() => {});
    return () => { alive = false; };
  }, [t.id]);

  // extra config (বিষয়/ক্লাস/রুটিন/সার্টিফিকেট) teachers.extra-তে সংরক্ষণ; ছবি বাদ (photo_path অক্ষুণ্ণ)
  const persist = async (next) => {
    setSavingCfg(true);
    try {
      const rest = { ...t }; delete rest.photo;
      const saved = await teachersApi.update(t.id, { ...rest, ...next });
      toast.success("একাডেমিক তথ্য সংরক্ষিত");
      onSaved && onSaved(saved);
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSavingCfg(false); }
  };
  const update = (patch) => { const next = { ...cfg, ...patch }; setCfg(next); return next; };

  const addSubject = (v) => persist(update({ academic_subjects: [...cfg.academic_subjects, v] }));
  const rmSubject = (i) => persist(update({ academic_subjects: cfg.academic_subjects.filter((_, x) => x !== i) }));
  const addClass = (v) => persist(update({ academic_classes: [...cfg.academic_classes, v] }));
  const rmClass = (i) => persist(update({ academic_classes: cfg.academic_classes.filter((_, x) => x !== i) }));

  const addRoutine = () => {
    if (!rt.time && !rt.class && !rt.subject) return toast.error("সময়/ক্লাস/বিষয় দিন");
    persist(update({ routine: [...cfg.routine, { ...rt }] }));
    setRt({ day: rt.day, time: "", class: "", subject: "" });
  };
  const rmRoutine = (i) => persist(update({ routine: cfg.routine.filter((_, x) => x !== i) }));

  const addCert = () => {
    if (!cert.title.trim()) return toast.error("সার্টিফিকেটের নাম দিন");
    persist(update({ certificates: [...cfg.certificates, { ...cert }] }));
    setCert({ title: "", institution: "", year: "" });
  };
  const rmCert = (i) => persist(update({ certificates: cfg.certificates.filter((_, x) => x !== i) }));

  const addDiary = async () => {
    if (!dEntry.title.trim() && !dEntry.detail.trim()) return toast.error("বিষয়বস্তু দিন");
    await teacherAcademic.add({ teacher_id: t.id, log_type: "diary", ...dEntry });
    setDEntry({ log_date: todayISO(), class: "", subject: "", title: "", detail: "" });
    toast.success("ডায়েরি এন্ট্রি যোগ হয়েছে"); loadLogs();
  };
  const addPerf = async () => {
    if (!pEntry.title.trim() && !pEntry.detail.trim()) return toast.error("বিষয়বস্তু দিন");
    await teacherAcademic.add({ teacher_id: t.id, log_type: "performance", ...pEntry });
    setPEntry({ log_date: todayISO(), title: "", rating: "ভালো", detail: "" });
    toast.success("পারফরম্যান্স নোট যোগ হয়েছে"); loadLogs();
  };
  const rmLog = async (id) => { await teacherAcademic.remove(id); loadLogs(); };

  const cellIn = { padding: "6px 8px", borderRadius: 6, border: "1px solid #cfd8cf", fontSize: 13 };
  const today = todayWeekday();
  const todaysRoutine = cfg.routine.filter((r) => r.day === today);

  return (
    <div>
      {/* বিষয় ও ক্লাস */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <SecTitle color="#8E24AA">📚 বিষয় ও ক্লাস</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div><div style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6a72", marginBottom: 8 }}>যে বিষয়গুলো পড়ান</div>
            <Chips items={cfg.academic_subjects} color="#8E24AA" placeholder="বিষয় লিখে Enter" onAdd={addSubject} onRemove={rmSubject} /></div>
          <div><div style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6a72", marginBottom: 8 }}>যে ক্লাসগুলো নেন</div>
            <Chips items={cfg.academic_classes} color="#00838F" placeholder="ক্লাস লিখে Enter" onAdd={addClass} onRemove={rmClass} /></div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12.5, color: "#607D8B" }}>যোগ্যতা: <b>{t.qualification || "—"}</b> · দক্ষতা: <b>{t.skills || "—"}</b></div>
      </Card>

      {/* সাপ্তাহিক রুটিন */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <SecTitle color="#00838F">🗓️ সাপ্তাহিক রুটিন</SecTitle>
        {todaysRoutine.length > 0 && (
          <div style={{ background: "#E3F2FD", border: "1px solid #90CAF9", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 13 }}>
            <b>আজকের ({today}) ক্লাস:</b> {todaysRoutine.map((r, i) => <Badge key={i} color="#1565C0">{r.time || "—"} · {r.class || "—"} · {r.subject || "—"}</Badge>)}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 12 }}>
          <select value={rt.day} onChange={(e) => setRt({ ...rt, day: e.target.value })} style={cellIn}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
          <input value={rt.time} onChange={(e) => setRt({ ...rt, time: e.target.value })} placeholder="সময় (যেমন ৯:০০)" style={cellIn} />
          <input value={rt.class} onChange={(e) => setRt({ ...rt, class: e.target.value })} placeholder="ক্লাস" style={cellIn} />
          <input value={rt.subject} onChange={(e) => setRt({ ...rt, subject: e.target.value })} placeholder="বিষয়" style={cellIn} />
          <Button size="sm" onClick={addRoutine} loading={savingCfg} icon="＋">যোগ</Button>
        </div>
        {cfg.routine.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13 }}>রুটিন খালি।</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead><tr style={{ background: "#E0F2F1" }}>{["দিন", "সময়", "ক্লাস", "বিষয়", ""].map((h) => <th key={h} style={{ padding: "7px 10px", textAlign: "left", border: "1px solid #cfe0dd" }}>{h}</th>)}</tr></thead>
              <tbody>
                {DAYS.filter((d) => cfg.routine.some((r) => r.day === d)).flatMap((d) => cfg.routine
                  .map((r, i) => ({ ...r, i })).filter((r) => r.day === d))
                  .map((r) => (
                    <tr key={r.i} style={r.day === today ? { background: "#E3F2FD" } : {}}>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{r.day}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{bn(r.time) || "—"}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{r.class || "—"}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}>{r.subject || "—"}</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #eef" }}><span onClick={() => rmRoutine(r.i)} style={{ cursor: "pointer", color: "#E53935" }}>🗑</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ক্লাস ডায়েরি */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <SecTitle color="#2E7D32">📓 ক্লাস ডায়েরি</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <DateField label="তারিখ" value={dEntry.log_date} onChange={(v) => setDEntry({ ...dEntry, log_date: v })} />
          <TextField label="ক্লাস" value={dEntry.class} onChange={(v) => setDEntry({ ...dEntry, class: v })} />
          <TextField label="বিষয়" value={dEntry.subject} onChange={(v) => setDEntry({ ...dEntry, subject: v })} />
        </div>
        <TextField label="পাঠ্য বিষয় (আজ যা পড়ানো হলো)" value={dEntry.title} onChange={(v) => setDEntry({ ...dEntry, title: v })} />
        <TextareaField label="বিস্তারিত / হোমওয়ার্ক" value={dEntry.detail} onChange={(v) => setDEntry({ ...dEntry, detail: v })} rows={2} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><Button size="sm" onClick={addDiary} icon="＋">ডায়েরি যোগ</Button></div>
        {diary.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13 }}>এখনো কোনো ডায়েরি এন্ট্রি নেই।</div>
          : diary.map((e) => (
            <div key={e.id} style={{ borderLeft: "3px solid #2E7D32", background: "#f6faf6", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "#1b5e20" }}>{e.title || "—"} <span style={{ color: "#90A4AE", fontWeight: 400, fontSize: 12 }}>{bn(e.log_date)} · {e.class || "—"} · {e.subject || "—"}</span></span>
                <span onClick={() => rmLog(e.id)} style={{ cursor: "pointer", color: "#E53935" }}>🗑</span>
              </div>
              {e.detail && <div style={{ fontSize: 13, color: "#455A64", marginTop: 2 }}>{e.detail}</div>}
            </div>
          ))}
      </Card>

      {/* পারফরম্যান্স নোট */}
      <Card style={{ padding: 16, marginBottom: 14 }}>
        <SecTitle color="#EF6C00">⭐ পারফরম্যান্স নোট</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <DateField label="তারিখ" value={pEntry.log_date} onChange={(v) => setPEntry({ ...pEntry, log_date: v })} />
          <TextField label="শিরোনাম (যেমন মাসিক মূল্যায়ন)" value={pEntry.title} onChange={(v) => setPEntry({ ...pEntry, title: v })} />
          <SelectField label="মূল্যায়ন" value={pEntry.rating} onChange={(v) => setPEntry({ ...pEntry, rating: v })} options={RATINGS} />
        </div>
        <TextareaField label="মন্তব্য" value={pEntry.detail} onChange={(v) => setPEntry({ ...pEntry, detail: v })} rows={2} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><Button size="sm" onClick={addPerf} icon="＋">নোট যোগ</Button></div>
        {perf.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13 }}>এখনো কোনো পারফরম্যান্স নোট নেই।</div>
          : perf.map((e) => (
            <div key={e.id} style={{ borderLeft: `3px solid ${RATING_COLOR[e.rating] || "#EF6C00"}`, background: "#fffaf5", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "#37474F" }}>{e.title || "—"} <Badge color={RATING_COLOR[e.rating] || "#EF6C00"}>{e.rating || "—"}</Badge> <span style={{ color: "#90A4AE", fontWeight: 400, fontSize: 12 }}>{bn(e.log_date)}</span></span>
                <span onClick={() => rmLog(e.id)} style={{ cursor: "pointer", color: "#E53935" }}>🗑</span>
              </div>
              {e.detail && <div style={{ fontSize: 13, color: "#455A64", marginTop: 2 }}>{e.detail}</div>}
            </div>
          ))}
      </Card>

      {/* সার্টিফিকেট / শিক্ষাগত অর্জন */}
      <Card style={{ padding: 16 }}>
        <SecTitle color="#5C6BC0">🎖️ সার্টিফিকেট ও শিক্ষাগত অর্জন</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 8, alignItems: "end", marginBottom: 12 }}>
          <input value={cert.title} onChange={(e) => setCert({ ...cert, title: e.target.value })} placeholder="সার্টিফিকেট/ডিগ্রি" style={cellIn} />
          <input value={cert.institution} onChange={(e) => setCert({ ...cert, institution: e.target.value })} placeholder="প্রতিষ্ঠান" style={cellIn} />
          <input value={cert.year} onChange={(e) => setCert({ ...cert, year: e.target.value })} placeholder="সন" style={cellIn} />
          <Button size="sm" onClick={addCert} loading={savingCfg} icon="＋">যোগ</Button>
        </div>
        {cfg.certificates.length === 0 ? <div style={{ color: "#90A4AE", fontSize: 13 }}>কোনো সার্টিফিকেট যোগ করা হয়নি।</div>
          : cfg.certificates.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", borderBottom: "1px solid #f0f0f5" }}>
              <span><b style={{ color: "#37474F" }}>{c.title}</b> {c.institution && <span style={{ color: "#607D8B" }}>· {c.institution}</span>} {c.year && <span style={{ color: "#90A4AE" }}>· {bn(c.year)}</span>}</span>
              <span onClick={() => rmCert(i)} style={{ cursor: "pointer", color: "#E53935" }}>🗑</span>
            </div>
          ))}
      </Card>
    </div>
  );
}
