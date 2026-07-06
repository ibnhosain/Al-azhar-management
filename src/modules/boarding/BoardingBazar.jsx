import { useState, useEffect } from "react";
import { PageHeader, DataTable, StatCard, StatRow, Card, Button, Modal, useToast, TextField, SelectField, DateField, MoneyField, TextareaField } from "../../ui";
import { boardingBazar } from "../../data";
import { UNITS, FUNDS, taka, bn, todayISO } from "./constants";

const emptyHeader = () => ({ purchase_no: "", date: todayISO(), fund: "বোর্ডিং", purchased_by: "", remarks: "" });
const emptyItem = () => ({ item_name: "", unit: "কেজি", quantity: "", unit_price: "" });

export default function BoardingBazar({ nav, icon }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list"); // list | form
  const [editing, setEditing] = useState(null);
  const [header, setHeader] = useState(emptyHeader());
  const [items, setItems] = useState([emptyItem()]);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const reload = async () => { setRows(await boardingBazar.list()); setLoading(false); };
  useEffect(() => { (async () => { await reload(); })(); }, []);

  const nextNo = () => {
    const nums = rows.map((r) => parseInt(String(r.purchase_no || "").replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  };

  const openCreate = () => {
    setEditing(null);
    setHeader({ ...emptyHeader(), purchase_no: nextNo() });
    setItems([emptyItem()]);
    setMode("form");
  };
  const openEdit = (row) => {
    setEditing(row.id);
    setHeader({ purchase_no: row.purchase_no || "", date: row.date || todayISO(), fund: row.fund || "বোর্ডিং", purchased_by: row.purchased_by || "", remarks: row.remarks || "" });
    setItems((row.items && row.items.length ? row.items : [emptyItem()]).map((i) => ({
      item_name: i.item_name || "", unit: i.unit || "কেজি", quantity: String(i.quantity ?? ""), unit_price: String(i.unit_price ?? ""),
    })));
    setMode("form");
  };

  const setItem = (idx, patch) => setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems((its) => [...its, emptyItem()]);
  const removeItem = (idx) => setItems((its) => (its.length > 1 ? its.filter((_, i) => i !== idx) : its));

  const grandTotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

  const save = async () => {
    if (!header.date) return toast.error("তারিখ দিন");
    if (!header.purchased_by.trim()) return toast.error("যিনি বাজার করেছেন তা লিখুন");
    const valid = items.filter((it) => it.item_name.trim() && Number(it.quantity) > 0 && Number(it.unit_price) > 0);
    if (valid.length === 0) return toast.error("অন্তত একটি পণ্য (নাম, পরিমাণ, মূল্য) দিন");
    setSaving(true);
    try {
      const payloadItems = valid.map((it) => ({ item_name: it.item_name.trim(), unit: it.unit, quantity: Number(it.quantity), unit_price: Number(it.unit_price) }));
      if (editing) { await boardingBazar.update(editing, header, payloadItems); toast.success("বাজার আপডেট হয়েছে"); }
      else { await boardingBazar.create(header, payloadItems); toast.success("বাজার সংরক্ষিত হয়েছে"); }
      setMode("list"); await reload();
    } catch (e) { toast.error("সংরক্ষণে সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const del = async (row) => {
    if (!window.confirm(`ক্রয় #${row.purchase_no} মুছে ফেলবেন?`)) return;
    await boardingBazar.remove(row.id); toast.success("মুছে ফেলা হয়েছে"); await reload();
  };

  const printOne = (row) => {
    const w = window.open("", "_blank");
    const body = (row.items || []).map((it, i) =>
      `<tr><td>${bn(i + 1)}</td><td>${it.item_name || ""}</td><td>${it.unit || ""}</td><td style="text-align:right">${bn(it.quantity)}</td><td style="text-align:right">${taka(it.unit_price)}</td><td style="text-align:right">${taka(it.subtotal)}</td></tr>`
    ).join("");
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ক্রয় ${row.purchase_no}</title>` +
      `<style>@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');*{font-family:'Hind Siliguri',sans-serif}body{padding:24px;color:#243B40}h2{margin:0;text-align:center;color:#1B5E20}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}th,td{border:1px solid #ccc;padding:7px 9px}thead{background:#E8F5E9}@media print{.np{display:none}}</style></head>` +
      `<body><h2>মাদরাসাতুল আযহার আল-আরাবিয়া</h2><div style="text-align:center;color:#546E7A;font-size:12px">বোর্ডিং বাজার রসিদ</div>` +
      `<div style="margin-top:12px;font-size:13px">ক্রয় নং: <b>#${bn(row.purchase_no)}</b> &nbsp;|&nbsp; তারিখ: <b>${row.date || ""}</b> &nbsp;|&nbsp; বাজারকারী: <b>${row.purchased_by || ""}</b></div>` +
      `<table><thead><tr><th>#</th><th>পণ্য</th><th>একক</th><th>পরিমাণ</th><th>মূল্য</th><th>মোট</th></tr></thead><tbody>${body}</tbody>` +
      `<tfoot><tr><td colspan="5" style="text-align:right;font-weight:700">সর্বমোট</td><td style="text-align:right;font-weight:700;color:#1B5E20">${taka(row.total)}</td></tr></tfoot></table>` +
      `<div class="np" style="margin-top:18px;text-align:center"><button onclick="window.print()" style="background:#2E7D32;color:#fff;border:none;padding:9px 24px;border-radius:8px;cursor:pointer;font-family:inherit">🖨️ প্রিন্ট</button></div>` +
      `</body></html>`
    );
    w.document.close();
  };

  // ── FORM VIEW ──
  if (mode === "form") {
    return (
      <div>
        <PageHeader icon={icon} title={editing ? "বাজার সম্পাদনা" : "নতুন বাজার তৈরি"} description="নতুন বোর্ডিং বাজার রেকর্ড করুন"
          onBack={() => setMode("list")} breadcrumb={[...nav.crumbs, { label: editing ? "সম্পাদনা" : "নতুন" }]} />
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
            <TextField label="রসিদ নম্বর" value={header.purchase_no} onChange={(v) => setHeader({ ...header, purchase_no: v })} />
            <DateField label="তারিখ" required value={header.date} onChange={(v) => setHeader({ ...header, date: v })} />
            <SelectField label="ফান্ড" value={header.fund} onChange={(v) => setHeader({ ...header, fund: v })} options={FUNDS} />
            <TextField label="যিনি বাজার করেছেন" required value={header.purchased_by} onChange={(v) => setHeader({ ...header, purchased_by: v })} />
          </div>

          <div style={{ margin: "6px 0 10px", fontWeight: 600, color: "#243B40" }}>🛒 বাজারের জিনিসপত্র</div>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 130px", gap: 10, alignItems: "start" }}>
              <TextField label="পণ্যের নাম" value={it.item_name} onChange={(v) => setItem(idx, { item_name: v })} />
              <SelectField label="একক" value={it.unit} onChange={(v) => setItem(idx, { unit: v })} options={UNITS} />
              <MoneyField label="পরিমাণ" value={it.quantity} onChange={(v) => setItem(idx, { quantity: v })} />
              <MoneyField label="মূল্য" value={it.unit_price} onChange={(v) => setItem(idx, { unit_price: v })} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 11 }}>
                <div style={{ flex: 1, textAlign: "right", fontWeight: 600, color: "#2E7D32", fontSize: 13 }}>
                  {taka((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}
                </div>
                <Button size="sm" variant="dangerSoft" onClick={() => removeItem(idx)} disabled={items.length === 1} style={{ padding: "6px 9px" }}>✕</Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="subtle" onClick={addItem} icon="＋" style={{ marginBottom: 8 }}>আরও পণ্য যোগ</Button>

          <TextareaField label="নোট" value={header.remarks} onChange={(v) => setHeader({ ...header, remarks: v })} rows={2} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, borderTop: "1px solid #EEF1F3", paddingTop: 14, flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#243B40" }}>সর্বমোট: <span style={{ color: "#2E7D32" }}>{taka(grandTotal)}</span></div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" onClick={() => setMode("list")}>বাতিল</Button>
              <Button onClick={save} loading={saving}>💾 সংরক্ষণ করুন</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── LIST VIEW ──
  const totalSum = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const monthSum = rows.filter((r) => String(r.date || "").slice(0, 7) === todayISO().slice(0, 7)).reduce((s, r) => s + (Number(r.total) || 0), 0);

  const columns = [
    { key: "sl", label: "ক্রমিক", width: 70, align: "center", render: (_r, i) => bn(i + 1) },
    { key: "date", label: "তারিখ", sortable: true },
    { key: "purchase_no", label: "ক্রয় নং", sortable: true, render: (r) => "#" + bn(r.purchase_no) },
    { key: "summary", label: "বিস্তারিত", render: (r) => r.summary || "—" },
    { key: "total", label: "পরিমাণ", sortable: true, align: "right", render: (r) => <b style={{ color: "#2E7D32" }}>{taka(r.total)}</b>, exportValue: (r) => r.total },
    { key: "purchased_by", label: "যিনি বাজার করেছেন" },
    { key: "__actions", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="sm" variant="secondary" onClick={() => setDetail(r)}>👁</Button>
        <Button size="sm" variant="secondary" onClick={() => printOne(r)}>🖨</Button>
        <Button size="sm" variant="subtle" onClick={() => openEdit(r)}>✏</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="বোর্ডিং বাজার" description="বোর্ডিং বাজার ক্রয় ও খরচের তালিকা" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<Button onClick={openCreate} icon="＋">নতুন বাজার</Button>} />
      <StatRow>
        <StatCard icon="🛒" label="মোট বাজার (ক্রয়)" value={taka(totalSum)} color="#00838F" hint={`${bn(rows.length)} এন্ট্রি`} />
        <StatCard icon="📅" label="এই মাসের বাজার" value={taka(monthSum)} color="#2E7D32" />
      </StatRow>
      <DataTable columns={columns} rows={rows} loading={loading} exportName="boarding-bazar"
        empty={{ icon: "🛒", title: "কোনো বাজার এন্ট্রি নেই", description: "‘নতুন বাজার’ দিয়ে যোগ করুন" }} />

      {detail && (
        <Modal title={`ক্রয় #${bn(detail.purchase_no)}`} icon="🛒" width={560} onClose={() => setDetail(null)}
          footer={<><Button variant="secondary" onClick={() => setDetail(null)}>বন্ধ</Button><Button onClick={() => printOne(detail)} icon="🖨">প্রিন্ট</Button></>}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#546E7A", marginBottom: 12 }}>
            <span>তারিখ: <b style={{ color: "#243B40" }}>{detail.date}</b></span>
            <span>ফান্ড: <b style={{ color: "#243B40" }}>{detail.fund || "—"}</b></span>
            <span>বাজারকারী: <b style={{ color: "#243B40" }}>{detail.purchased_by || "—"}</b></span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#F4F7F5" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>পণ্য</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>একক</th>
              <th style={{ textAlign: "right", padding: "8px 10px" }}>পরিমাণ</th>
              <th style={{ textAlign: "right", padding: "8px 10px" }}>মূল্য</th>
              <th style={{ textAlign: "right", padding: "8px 10px" }}>মোট</th>
            </tr></thead>
            <tbody>
              {(detail.items || []).map((it) => (
                <tr key={it.id} style={{ borderBottom: "1px solid #F0F2F3" }}>
                  <td style={{ padding: "8px 10px" }}>{it.item_name}</td>
                  <td style={{ padding: "8px 10px" }}>{it.unit}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{bn(it.quantity)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{taka(it.unit_price)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>{taka(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td colSpan={4} style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>সর্বমোট</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "#2E7D32" }}>{taka(detail.total)}</td>
            </tr></tfoot>
          </table>
          {detail.remarks ? <div style={{ marginTop: 10, fontSize: 13, color: "#546E7A" }}>নোট: {detail.remarks}</div> : null}
        </Modal>
      )}
    </div>
  );
}
