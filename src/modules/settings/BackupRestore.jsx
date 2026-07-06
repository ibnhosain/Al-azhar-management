import { useState, useEffect } from "react";
import { PageHeader, Card, StatCard, StatRow, DataTable, Button, useToast } from "../../ui";
import { backup, environment } from "../../data";

const fmtBytes = (n) => {
  if (!n) return "০ KB";
  const bn = (s) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
  const kb = n / 1024;
  return kb < 1024 ? `${bn(kb.toFixed(1))} KB` : `${bn((kb / 1024).toFixed(2))} MB`;
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("bn-BD"); } catch { return iso; }
};

export default function BackupRestore({ onBack }) {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const isWeb = environment !== "electron";

  const reload = async () => {
    const [i, l] = await Promise.all([backup.info(), backup.list()]);
    setInfo(i); setList(Array.isArray(l) ? l : []); setLoading(false);
  };
  useEffect(() => { (async () => { await reload(); })(); }, []);

  const doCreate = async () => {
    setBusy(true);
    try { await backup.create(); toast.success("ব্যাকআপ তৈরি হয়েছে"); await reload(); }
    catch (e) { toast.error("ব্যর্থ: " + (e.message || e)); }
    finally { setBusy(false); }
  };
  const doExport = async () => {
    setBusy(true);
    try { const r = await backup.exportTo(); if (r && !r.canceled) toast.success("ব্যাকআপ রপ্তানি হয়েছে"); }
    catch { toast.error("রপ্তানি ব্যর্থ"); }
    finally { setBusy(false); }
  };
  const doRestore = async (row) => {
    if (!window.confirm(`"${row.name}" থেকে রিস্টোর করবেন?\nবর্তমান ডেটা প্রতিস্থাপিত হবে (আগে একটি নিরাপত্তা-ব্যাকআপ রাখা হবে)।`)) return;
    setBusy(true);
    try { await backup.restore(row.path); toast.success("রিস্টোর সম্পন্ন — রিলোড হচ্ছে..."); setTimeout(() => window.location.reload(), 900); }
    catch (e) { toast.error("ব্যর্থ: " + (e.message || e)); setBusy(false); }
  };
  const doDelete = async (row) => {
    if (!window.confirm("এই ব্যাকআপ মুছে ফেলবেন?")) return;
    await backup.remove(row.path); toast.success("মুছে ফেলা হয়েছে"); await reload();
  };
  const toggleAuto = async () => {
    setBusy(true);
    try { const i = await backup.setAuto(!info.autoBackup); setInfo(i); toast.success(i.autoBackup ? "অটো-ব্যাকআপ চালু" : "অটো-ব্যাকআপ বন্ধ"); }
    finally { setBusy(false); }
  };
  const changeDir = async () => {
    setBusy(true);
    try { const r = await backup.chooseDir(); if (r && !r.canceled) { setInfo(r); toast.success("ডেটাবেস লোকেশন পরিবর্তিত"); await reload(); } }
    catch (e) { toast.error("ব্যর্থ: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const columns = [
    { key: "name", label: "ব্যাকআপ ফাইল", render: (r) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{r.name}</span> },
    { key: "at", label: "তারিখ ও সময়", sortable: true, render: (r) => fmtDate(r.at) },
    { key: "size", label: "সাইজ", align: "right", render: (r) => fmtBytes(r.size), exportValue: (r) => r.size },
    { key: "__actions", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="sm" variant="subtle" onClick={() => doRestore(r)}>↩ রিস্টোর</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => doDelete(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon="💾" title="ব্যাকআপ ও রিস্টোর" description="ডেটা নিরাপত্তা — ব্যাকআপ, রিস্টোর ও লোকেশন"
        onBack={onBack} breadcrumb={[{ label: "ড্যাশবোর্ড" }, { label: "সিস্টেম সেটিংস", onClick: onBack }, { label: "ব্যাকআপ ও রিস্টোর" }]}
        actions={<>
          <Button variant="secondary" onClick={doExport} loading={busy} icon="⤓">রপ্তানি</Button>
          <Button onClick={doCreate} loading={busy} icon="💾">এখনই ব্যাকআপ</Button>
        </>} />

      {isWeb ? (
        <Card><div style={{ textAlign: "center", padding: 34, color: "#78909C" }}>💻 ব্যাকআপ/রিস্টোর শুধু ডেস্কটপ অ্যাপে কাজ করে।</div></Card>
      ) : (
        <>
          <StatRow>
            <StatCard icon="🗄️" label="মোট ব্যাকআপ" value={loading ? "…" : String(info?.backupCount || 0).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d])} color="#2E7D32" />
            <StatCard icon="💽" label="ডেটাবেস সাইজ" value={loading ? "…" : fmtBytes(info?.dbSize)} color="#00838F" />
            <StatCard icon="🕒" label="সর্বশেষ ব্যাকআপ" value={loading ? "…" : fmtDate(info?.lastBackupAt)} color="#EF6C00" />
          </StatRow>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 4 }}>📁 ডেটাবেস লোকেশন</div>
                <div style={{ fontSize: 12, color: "#546E7A", fontFamily: "monospace", wordBreak: "break-all" }}>{info?.dbPath || "—"}</div>
                <div style={{ fontSize: 11, color: "#90A4AE", marginTop: 3 }}>ইনস্টল ফোল্ডারের বাইরে → সফটওয়্যার আপডেটেও ডেটা নিরাপদ</div>
              </div>
              <Button variant="secondary" onClick={changeDir} loading={busy} icon="📂">লোকেশন পরিবর্তন</Button>
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 4 }}>🔄 স্বয়ংক্রিয় ব্যাকআপ</div>
                <div style={{ fontSize: 12, color: "#546E7A" }}>অ্যাপ চালুতে প্রতি {String(info?.autoBackupIntervalHours || 24).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d])} ঘণ্টায় একবার (সর্বশেষ ১০টি সংরক্ষিত)</div>
              </div>
              <Button variant={info?.autoBackup ? "primary" : "secondary"} onClick={toggleAuto} loading={busy}>
                {info?.autoBackup ? "✅ চালু আছে" : "বন্ধ — চালু করুন"}
              </Button>
            </div>
          </Card>

          <DataTable columns={columns} rows={list} loading={loading} exportName="backups" title="ব্যাকআপসমূহ"
            actions={<Button size="sm" variant="secondary" onClick={() => backup.openFolder()}>📂 ফোল্ডার</Button>}
            empty={{ icon: "🗄️", title: "কোনো ব্যাকআপ নেই", description: "‘এখনই ব্যাকআপ’ দিয়ে প্রথম ব্যাকআপ নিন" }} />
        </>
      )}
    </div>
  );
}
