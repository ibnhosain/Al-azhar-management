import { Modal, Button, useToast } from "../../ui";

// অফলাইন-ফ্রেন্ডলি শেয়ার: টেক্সট কপি + WhatsApp deep-link (wa.me/?text=)।
export default function ShareModal({ title = "পাঠান", text, onClose }) {
  const toast = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success("কপি হয়েছে"); }
    catch { toast.error("কপি করা যায়নি"); }
  };
  const whatsapp = () => window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");

  return (
    <Modal title={title} icon="📤" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>বন্ধ</Button>
        <Button variant="secondary" onClick={copy} icon="📋">কপি</Button>
        <Button onClick={whatsapp} icon="💬">WhatsApp</Button>
      </>}>
      <div style={{ fontSize: 12, color: "#78909C", marginBottom: 6 }}>নিচের বার্তাটি কপি করুন বা সরাসরি WhatsApp-এ পাঠান।</div>
      <textarea readOnly value={text} onFocus={(e) => e.target.select()}
        style={{ width: "100%", minHeight: 240, padding: 12, borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 13, fontFamily: "inherit", lineHeight: 1.7, resize: "vertical" }} />
    </Modal>
  );
}
