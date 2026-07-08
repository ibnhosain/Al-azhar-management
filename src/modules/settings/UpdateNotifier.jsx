import { useState, useEffect, useRef } from "react";
import { updater, environment } from "../../data";

const bn = (s) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const mb = (n) => (n || n === 0 ? bn((n / 1048576).toFixed(1)) + " MB" : "");

// অ্যাপজুড়ে ভাসমান আপডেট নোটিফিকেশন — চালুর নীরব চেকের ফল এখানেই দেখায়।
// (বিস্তারিত নিয়ন্ত্রণ: সেটিংস → সফটওয়্যার আপডেট)
export default function UpdateNotifier() {
  const [evt, setEvt] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [info, setInfo] = useState({});
  const hideTimer = useRef(null);

  useEffect(() => {
    if (environment === "web") return undefined;
    const unsub = updater.subscribe((d) => {
      if (!d) return;
      setInfo((prev) => ({ version: d.version || prev.version, size: d.size || prev.size }));
      // নীরব startup-এ up-to-date/error লুকানো; ম্যানুয়াল হলে দেখাই
      if ((d.status === "up-to-date" || d.status === "error" || d.status === "dev") && !d.manual) return;
      setHidden(false);
      setEvt(d);
      if (d.status === "up-to-date") {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setHidden(true), 4000);
      }
    });
    return () => { if (typeof unsub === "function") unsub(); clearTimeout(hideTimer.current); };
  }, []);

  if (!evt || hidden) return null;
  const s = evt.status;
  if (!["available", "downloading", "paused", "downloaded", "up-to-date", "error", "installing"].includes(s)) return null;

  const bar = (color, pct) => (
    <div style={{ height: 8, borderRadius: 6, background: "#eef2f6", overflow: "hidden", marginTop: 8 }}>
      <div style={{ width: (pct || 0) + "%", height: "100%", background: color, transition: "width .25s" }} />
    </div>
  );
  const btn = (label, onClick, primary) => (
    <button type="button" onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
      border: primary ? "none" : "1px solid #cfd8dc", background: primary ? "#2E7D32" : "#fff", color: primary ? "#fff" : "#455A64",
    }}>{label}</button>
  );

  const HEAD = {
    available: { icon: "🎉", title: `নতুন সংস্করণ v${bn(info.version || "")}` },
    downloading: { icon: "⬇️", title: "আপডেট ডাউনলোড হচ্ছে…" },
    paused: { icon: "⏸️", title: "ডাউনলোড থেমে আছে" },
    downloaded: { icon: "📦", title: "আপডেট প্রস্তুত" },
    installing: { icon: "⚙️", title: "ইনস্টল হচ্ছে…" },
    "up-to-date": { icon: "✅", title: "সর্বশেষ সংস্করণেই আছেন" },
    error: { icon: "⚠️", title: "আপডেটে সমস্যা" },
  }[s] || { icon: "🔔", title: "আপডেট" };

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, width: 340, zIndex: 4000, background: "#fff", borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,.18)", border: "1px solid #e8edf0", padding: 16, fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>{HEAD.icon}</span>
          <div style={{ fontWeight: 700, color: "#243B40", fontSize: 14 }}>{HEAD.title}</div>
        </div>
        <button type="button" onClick={() => setHidden(true)} title="বন্ধ" style={{ background: "none", border: "none", cursor: "pointer", color: "#90A4AE", fontSize: 16 }}>✕</button>
      </div>

      {s === "available" && <div style={{ fontSize: 12, color: "#78909C", marginTop: 4 }}>ডাউনলোড সাইজ: {mb(info.size) || "—"}</div>}
      {(s === "downloading" || s === "paused") && <>
        {bar(s === "paused" ? "#FFB74D" : "#0288D1", evt.percent)}
        <div style={{ fontSize: 12, color: "#607D8B", marginTop: 4 }}>{bn(Math.round(evt.percent || 0))}%{s === "downloading" && evt.bytesPerSecond ? " • " + mb(evt.bytesPerSecond) + "/s" : ""}</div>
      </>}
      {s === "error" && <div style={{ fontSize: 12, color: "#E53935", marginTop: 4 }}>{evt.message}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
        {s === "available" && <>{btn("পরে", () => setHidden(true))}{btn("এখনই আপডেট", () => updater.download(), true)}</>}
        {s === "downloading" && btn("থামান", () => updater.pause())}
        {s === "paused" && btn("পুনরায় শুরু", () => updater.resume(), true)}
        {s === "downloaded" && <>{btn("পরে", () => setHidden(true))}{btn("রিস্টার্ট ও ইনস্টল", () => updater.install(), true)}</>}
        {s === "error" && btn("আবার চেষ্টা", () => updater.check())}
      </div>
    </div>
  );
}
