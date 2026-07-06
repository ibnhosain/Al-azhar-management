import { useState, useEffect } from "react";
import { Button, useToast } from "../../ui";
import { backup } from "../../data";

// প্রথমবার অ্যাপ চালুতে ডেটাবেস লোকেশন নিশ্চিত/নির্বাচন করার স্ক্রিন।
export default function FirstRunSetup({ onDone }) {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => { try { setInfo(await backup.info()); } catch { /* ignore */ } })(); }, []);

  const choose = async () => {
    setBusy(true);
    try {
      const r = await backup.chooseDir();
      if (r && !r.canceled) { setInfo(r); toast.success("লোকেশন নির্বাচিত হয়েছে"); }
    } catch (e) { toast.error("ব্যর্থ: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true);
    try { await backup.completeSetup(); onDone(); }
    catch (e) { toast.error("ব্যর্থ: " + (e.message || e)); setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(135deg,#1B5E20,#2E7D32,#388E3C)", fontFamily: "'Hind Siliguri','Noto Sans Bengali',sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", width: 560, maxWidth: "96vw", padding: 36 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: 20, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, margin: "0 auto 16px" }}>🕌</div>
          <h2 style={{ margin: 0, color: "#1B5E20", fontSize: 22, fontWeight: 700 }}>স্বাগতম</h2>
          <div style={{ color: "#546E7A", fontSize: 14, marginTop: 6 }}>মাদরাসা ম্যানেজমেন্ট — প্রাথমিক সেটআপ</div>
        </div>

        <div style={{ marginTop: 26 }}>
          <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 8 }}>📁 ডেটাবেস কোথায় সংরক্ষণ হবে?</div>
          <div style={{ background: "#F4F7F5", border: "1px solid #E4E8EB", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: "#546E7A", fontFamily: "monospace", wordBreak: "break-all" }}>
              {info ? info.dbDirectory : "লোড হচ্ছে..."}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#90A4AE", marginTop: 10, lineHeight: 1.7 }}>
            💡 ডেটা <b>ইনস্টল ফোল্ডারের বাইরে</b> থাকবে — সফটওয়্যার আপডেট, রিইনস্টল বা আনইনস্টলেও আপনার সব তথ্য নিরাপদ থাকবে। স্বয়ংক্রিয় ব্যাকআপও চালু থাকবে।
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={choose} loading={busy} icon="📂">অন্য ফোল্ডার বেছে নিন</Button>
          <Button onClick={confirm} loading={busy} icon="✅">এই লোকেশনে শুরু করুন</Button>
        </div>
      </div>
    </div>
  );
}
