import { useState } from "react";
import { Button, Modal, useToast, TextareaField } from "../../ui";
import { system } from "../../data";
import { waUrl, mailUrl, smsUrl } from "./comm";

// এক-ক্লিক যোগাযোগ (WhatsApp / Email / SMS) — বার্তা লিখে পাঠানো যায়।
export default function TeacherComm({ teacher: t, defaultMessage = "", compact }) {
  const toast = useToast();
  const [modal, setModal] = useState(null); // 'whatsapp' | 'email' | 'sms'
  const [subject, setSubject] = useState("মাদরাসাতুল আযহার আল-আরাবিয়া");
  const [msg, setMsg] = useState(defaultMessage);

  const waNo = t.whatsapp || t.phone;
  const smsNo = t.phone || t.whatsapp;

  const open = (ch) => {
    if (ch === "whatsapp" && !waNo) return toast.error("হোয়াটসঅ্যাপ/মোবাইল নম্বর নেই");
    if (ch === "sms" && !smsNo) return toast.error("মোবাইল নম্বর নেই");
    if (ch === "email" && !t.email) return toast.error("ইমেইল ঠিকানা নেই");
    setMsg(defaultMessage || `আসসালামু আলাইকুম, ${t.name}।\n`);
    setModal(ch);
  };

  const send = async () => {
    let url;
    if (modal === "whatsapp") url = waUrl(waNo, msg);
    else if (modal === "sms") url = smsUrl(smsNo, msg);
    else url = mailUrl(t.email, subject, msg);
    const r = await system.openExternal(url);
    if (r && r.ok === false) toast.error("খোলা যায়নি: " + (r.error || ""));
    else toast.success("যোগাযোগ অ্যাপে খোলা হচ্ছে…");
    setModal(null);
  };

  const btn = (ch, icon, label, color) => (
    <Button size={compact ? "sm" : "md"} variant="secondary" onClick={() => open(ch)} icon={icon} style={{ borderColor: color, color }}>{compact ? "" : label}</Button>
  );

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {btn("whatsapp", "📱", "হোয়াটসঅ্যাপ", "#25D366")}
        {btn("email", "✉️", "ইমেইল", "#1565C0")}
        {btn("sms", "💬", "এসএমএস", "#607D8B")}
      </div>

      {modal && (
        <Modal title={modal === "whatsapp" ? "হোয়াটসঅ্যাপ বার্তা" : modal === "email" ? "ইমেইল" : "এসএমএস"}
          icon={modal === "whatsapp" ? "📱" : modal === "email" ? "✉️" : "💬"} width={520} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>বাতিল</Button><Button onClick={send} icon="↗">পাঠান</Button></>}>
          <div style={{ fontSize: 13, color: "#546E7A", marginBottom: 10 }}>
            প্রাপক: <b style={{ color: "#37474F" }}>{t.name}</b> · {modal === "email" ? (t.email || "—") : (modal === "whatsapp" ? (waNo || "—") : (smsNo || "—"))}
          </div>
          {modal === "email" && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6a72", marginBottom: 5 }}>বিষয়</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cfd8cf", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          )}
          <TextareaField label="বার্তা" value={msg} onChange={setMsg} rows={5} />
          <div style={{ fontSize: 12, color: "#90A4AE", marginTop: 4 }}>💡 “পাঠান”-এ ডিফল্ট {modal === "whatsapp" ? "WhatsApp" : modal === "email" ? "ইমেইল" : "মেসেজিং"} অ্যাপ খোলে (ইন্টারনেট/অ্যাপ প্রয়োজন)।</div>
        </Modal>
      )}
    </>
  );
}
