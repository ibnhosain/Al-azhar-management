import { useState, useEffect, useRef } from "react";
import { PageHeader, Card, Button, Badge, Spinner, useToast } from "../../ui";
import { updater } from "../../data";

const bn = (s) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
const fmtBytes = (n) => {
  if (!n && n !== 0) return "—";
  const mb = n / (1024 * 1024);
  return mb >= 1024 ? bn((mb / 1024).toFixed(2)) + " GB" : bn(mb.toFixed(1)) + " MB";
};
const fmtSpeed = (n) => (n ? fmtBytes(n) + "/s" : "—");
const fmtEta = (sec) => {
  if (!sec || !isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m > 0 ? `${bn(m)} মি ${bn(s)} সে` : `${bn(s)} সে`;
};

const VIEW = {
  idle: { icon: "🔄", color: "#607D8B", title: "আপডেট পরীক্ষা করুন", desc: "নতুন সংস্করণ আছে কিনা দেখতে ‘চেক করুন’ চাপুন।" },
  checking: { icon: "🔍", color: "#0288D1", title: "আপডেট খোঁজা হচ্ছে…", desc: "GitHub থেকে সর্বশেষ সংস্করণ যাচাই করা হচ্ছে।" },
  "up-to-date": { icon: "✅", color: "#2E7D32", title: "আপনি সর্বশেষ সংস্করণে আছেন", desc: "কোনো নতুন আপডেট নেই।" },
  available: { icon: "🎉", color: "#EF6C00", title: "নতুন সংস্করণ পাওয়া গেছে", desc: "রিলিজ নোট দেখে ‘এখনই আপডেট’ চাপুন।" },
  downloading: { icon: "⬇️", color: "#0288D1", title: "আপডেট ডাউনলোড হচ্ছে…", desc: "ব্যাকগ্রাউন্ডে ডাউনলোড চলছে — চাইলে থামাতে পারেন।" },
  paused: { icon: "⏸️", color: "#EF6C00", title: "ডাউনলোড থেমে আছে", desc: "‘পুনরায় শুরু’ চাপলে বাকি অংশ নামবে।" },
  downloaded: { icon: "📦", color: "#2E7D32", title: "ডাউনলোড সম্পন্ন", desc: "রিস্টার্ট করলে নতুন সংস্করণ ইনস্টল হবে।" },
  installing: { icon: "⚙️", color: "#0288D1", title: "ইনস্টল হচ্ছে…", desc: "অ্যাপ বন্ধ হয়ে আপডেট বসছে, একটু অপেক্ষা করুন।" },
  error: { icon: "⚠️", color: "#E53935", title: "আপডেটে সমস্যা", desc: "ইন্টারনেট বা রিলিজ যাচাই করে আবার চেষ্টা করুন।" },
  dev: { icon: "🧪", color: "#6A1B9A", title: "ডেভেলপমেন্ট মোড", desc: "আপডেট শুধু ইনস্টল করা (packaged) অ্যাপে কাজ করে।" },
  web: { icon: "🌐", color: "#607D8B", title: "ওয়েব সংস্করণ", desc: "অটো আপডেট শুধু ডেস্কটপ অ্যাপে প্রযোজ্য।" },
};

export default function AutoUpdate({ onBack }) {
  const toast = useToast();
  const [version, setVersion] = useState("");
  const [evt, setEvt] = useState({ status: "idle" });
  const [info, setInfo] = useState({});   // version/notes/size — accumulated in state
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => { const v = await updater.version(); if (alive) setVersion(v); })();
    const unsub = updater.subscribe((data) => {
      if (!alive || !data) return;
      setInfo((prev) => ({
        version: data.version || prev.version,
        releaseNotes: data.releaseNotes !== undefined ? data.releaseNotes : prev.releaseNotes,
        size: data.size || prev.size,
      }));
      setEvt(data);
    });
    if (!started.current) { started.current = true; updater.check(); }
    return () => { alive = false; if (typeof unsub === "function") unsub(); };
  }, []);

  const doCheck = async () => { setBusy(true); try { await updater.check(); } finally { setBusy(false); } };
  const doDownload = async () => { setBusy(true); try { await updater.download(); } catch (e) { toast.error("ডাউনলোড শুরু হয়নি: " + (e.message || e)); } finally { setBusy(false); } };
  const doPause = () => updater.pause();
  const doResume = () => updater.resume();
  const doInstall = async () => {
    if (!window.confirm("অ্যাপ বন্ধ হয়ে আপডেট ইনস্টল হবে এবং আবার চালু হবে।\nআপনার ডেটাবেস, ছবি ও ব্যাকআপ অপরিবর্তিত থাকবে। এগিয়ে যাবেন?")) return;
    await updater.install();
  };

  const v = VIEW[evt.status] || VIEW.idle;
  const percent = (evt.status === "downloading" || evt.status === "paused") ? (evt.percent || 0) : 0;
  const eta = evt.status === "downloading" && evt.bytesPerSecond ? (evt.total - evt.transferred) / evt.bytesPerSecond : 0;
  const showNotes = ["available", "downloading", "paused", "downloaded"].includes(evt.status) && info.releaseNotes;

  return (
    <div>
      <PageHeader icon="🚀" title="সফটওয়্যার আপডেট" description="GitHub Releases থেকে স্বয়ংক্রিয় আপডেট — নিরাপদ, এক ক্লিকে"
        onBack={onBack} breadcrumb={[{ label: "ড্যাশবোর্ড" }, { label: "সিস্টেম সেটিংস", onClick: onBack }, { label: "সফটওয়্যার আপডেট" }]} />

      <Card style={{ padding: 0, overflow: "hidden", maxWidth: 760 }}>
        {/* সংস্করণ হেডার */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #eef2ee", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E8F5E9", color: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🕌</div>
            <div>
              <div style={{ fontWeight: 700, color: "#243B40" }}>Madrasa Management</div>
              <div style={{ fontSize: 13, color: "#78909C" }}>
                বর্তমান: <b style={{ color: "#2E7D32" }}>v{version ? bn(version) : "…"}</b>
                {info.version && ["available", "downloading", "paused", "downloaded"].includes(evt.status) &&
                  <> → সর্বশেষ: <b style={{ color: "#EF6C00" }}>v{bn(info.version)}</b></>}
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={doCheck} loading={busy && !["downloading", "paused"].includes(evt.status)} icon="🔄">চেক করুন</Button>
        </div>

        {/* স্ট্যাটাস */}
        <div style={{ padding: "22px 20px", textAlign: "center" }}>
          <div style={{ width: 66, height: 66, borderRadius: "50%", margin: "0 auto 12px", background: v.color + "18", color: v.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
            {(evt.status === "checking" || evt.status === "installing") ? <Spinner /> : v.icon}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#243B40" }}>{v.title}</div>
          {(evt.status === "available" || evt.status === "downloaded") && (
            <div style={{ marginTop: 6, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {info.version && <Badge color="#EF6C00">নতুন: v{bn(info.version)}</Badge>}
              {info.size && <Badge color="#607D8B">সাইজ: {fmtBytes(info.size)}</Badge>}
            </div>
          )}
          <div style={{ fontSize: 13, color: evt.status === "error" ? "#E53935" : "#78909C", marginTop: 6 }}>
            {evt.status === "error" && evt.message ? evt.message : v.desc}
          </div>

          {/* প্রোগ্রেস */}
          {(evt.status === "downloading" || evt.status === "paused") && (
            <div style={{ maxWidth: 460, margin: "16px auto 0" }}>
              <div style={{ height: 12, borderRadius: 8, background: "#E3F2FD", overflow: "hidden" }}>
                <div style={{ width: percent + "%", height: "100%", background: evt.status === "paused" ? "#FFB74D" : "#0288D1", transition: "width .25s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#607D8B", marginTop: 6 }}>
                <span>{bn(Math.round(percent))}% • {fmtBytes(evt.transferred)} / {fmtBytes(evt.total)}</span>
                <span>{evt.status === "downloading" ? `${fmtSpeed(evt.bytesPerSecond)} • বাকি ${fmtEta(eta)}` : "থেমে আছে"}</span>
              </div>
            </div>
          )}

          {/* রিলিজ নোট */}
          {showNotes && (
            <div style={{ maxWidth: 520, margin: "18px auto 0", textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#243B40", marginBottom: 6 }}>📋 রিলিজ নোট</div>
              <div style={{ maxHeight: 180, overflowY: "auto", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, color: "#455A64", background: "#F7FAF7", border: "1px solid #e3ede3", borderRadius: 10, padding: "10px 14px" }}>
                {info.releaseNotes}
              </div>
            </div>
          )}

          {/* অ্যাকশন */}
          <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {evt.status === "available" && <>
              <Button onClick={doDownload} loading={busy} icon="⬇️">এখনই আপডেট</Button>
              <Button variant="secondary" onClick={onBack} icon="⏳">পরে</Button>
            </>}
            {evt.status === "downloading" && <Button variant="secondary" onClick={doPause} icon="⏸️">থামান</Button>}
            {evt.status === "paused" && <Button onClick={doResume} icon="▶️">পুনরায় শুরু</Button>}
            {evt.status === "downloaded" && <Button onClick={doInstall} icon="🔁">রিস্টার্ট ও ইনস্টল</Button>}
            {evt.status === "error" && <Button variant="secondary" onClick={doCheck} icon="🔄">আবার চেষ্টা</Button>}
          </div>
        </div>

        {/* ডেটা নিরাপত্তা */}
        <div style={{ padding: "14px 20px", background: "#F1F8F1", borderTop: "1px solid #dcece0", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <div style={{ fontSize: 13, color: "#33691E", lineHeight: 1.6 }}>
            <b>আপনার ডেটা সম্পূর্ণ নিরাপদ।</b> আপডেট শুধু অ্যাপের প্রোগ্রাম ফাইল হালনাগাদ করে —
            <b> ডেটাবেস (D:\BustanulIslam\Data)</b>, ছবি, ব্যাকআপ, কনফিগ ও ডকুমেন্ট ইনস্টল ফোল্ডারের বাইরে থাকায়
            আপডেটে কখনোই পরিবর্তন বা মুছে ফেলা হয় না।
          </div>
        </div>
      </Card>
    </div>
  );
}
