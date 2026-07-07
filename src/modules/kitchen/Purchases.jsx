import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, DataTable, Badge, Button, Modal, useToast, SelectField, TextField } from "../../ui";
import { purchases as purchaseApi, suppliers as supplierApi, ingredients as ingApi } from "../../data";
import { bn, todayISO, taka } from "./constants";
import { printDoc, tableHtml } from "./print";

const blankItem = () => ({ ingredient_id: "", qty: "", unit: "", unit_cost: "" });

export default function Purchases({ nav, icon }) {
  const toast = useToast();
  const [ingList, setIngList] = useState([]);
  const [supList, setSupList] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState({ p_date: todayISO(), supplier_id: "", note: "" });
  const [items, setItems] = useState([blankItem()]);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState(null);

  const ingById = useMemo(() => Object.fromEntries(ingList.map((i) => [String(i.id), i])), [ingList]);
  const ingOpts = useMemo(() => [{ value: "", label: "— উপকরণ —" }, ...ingList.map((i) => ({ value: String(i.id), label: `${i.name_bn} (${i.unit})` }))], [ingList]);
  const supOpts = useMemo(() => [{ value: "", label: "— সরবরাহকারী —" }, ...supList.map((s) => ({ value: String(s.id), label: s.name }))], [supList]);

  const reload = async () => { setRows(await purchaseApi.list()); setLoading(false); };
  useEffect(() => {
    let alive = true;
    (async () => {
      const [i, s, p] = await Promise.all([ingApi.list(), supplierApi.list(), purchaseApi.list()]);
      if (alive) { setIngList(i); setSupList(s); setRows(p); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const setRow = (idx, patch) => setItems((a) => a.map((it, i) => {
    if (i !== idx) return it;
    const next = { ...it, ...patch };
    if (patch.ingredient_id) { const ing = ingById[patch.ingredient_id]; if (ing) { if (!it.unit) next.unit = ing.unit; if (!it.unit_cost) next.unit_cost = String(ing.avg_cost || ""); } }
    return next;
  }));
  const addRow = () => setItems((a) => [...a, blankItem()]);
  const removeRow = (idx) => setItems((a) => (a.length > 1 ? a.filter((_, i) => i !== idx) : a));

  const grandTotal = useMemo(() => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_cost) || 0), 0), [items]);

  const reset = () => { setHeader({ p_date: todayISO(), supplier_id: "", note: "" }); setItems([blankItem()]); };

  const save = async () => {
    const clean = items.filter((it) => it.ingredient_id && Number(it.qty) > 0);
    if (!clean.length) return toast.error("অন্তত একটি উপকরণ ও পরিমাণ দিন");
    setSaving(true);
    try {
      await purchaseApi.create(
        { p_date: header.p_date, supplier_id: header.supplier_id ? Number(header.supplier_id) : null, note: header.note },
        clean.map((it) => ({ ingredient_id: Number(it.ingredient_id), qty: Number(it.qty), unit: it.unit || null, unit_cost: Number(it.unit_cost) || 0 }))
      );
      toast.success("ক্রয় সংরক্ষণ হয়েছে — স্টকে যোগ হয়েছে");
      reset(); await reload();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const del = async (r) => { if (!window.confirm("এই ক্রয় মুছবেন? সংশ্লিষ্ট স্টক এন্ট্রিও মুছে যাবে।")) return; await purchaseApi.remove(r.id); toast.success("মুছে ফেলা হয়েছে"); await reload(); };
  const openView = async (r) => setView(await purchaseApi.get(r.id));

  const printPurchase = (p) => {
    const body = tableHtml(["#", "উপকরণ", "পরিমাণ", "একক", "একক মূল্য", "উপমোট"],
      (p.items || []).map((it, i) => [i + 1, it.ingredient, bn(it.qty), it.unit || "", taka(it.unit_cost), taka(it.subtotal)]),
      ["center", "left", "right", "center", "right", "right"]);
    const tot = `<div style="text-align:right;margin-top:10px;font-weight:700">সর্বমোট: ${taka(p.total)}</div>`;
    printDoc("ক্রয় রসিদ #" + p.id, body + tot, { subtitle: `${p.p_date}${p.supplier_name ? " • " + p.supplier_name : ""}` });
  };

  const columns = [
    { key: "p_date", label: "তারিখ", sortable: true },
    { key: "supplier_name", label: "সরবরাহকারী", render: (r) => r.supplier_name || "—" },
    { key: "item_count", label: "আইটেম", align: "center", render: (r) => bn(r.item_count) },
    { key: "total", label: "মোট", align: "right", render: (r) => taka(r.total), exportValue: (r) => r.total, sortable: true },
    { key: "__a", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <Button size="sm" variant="subtle" onClick={() => openView(r)}>👁</Button>
        <Button size="sm" variant="subtle" onClick={() => printPurchase(r)}>🖨</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="কিচেন ক্রয়" description="উপকরণ ক্রয় — সেভ করলে স্বয়ংক্রিয়ভাবে স্টকে যোগ হয় ও গড় মূল্য আপডেট হয়" onBack={nav.onBack} breadcrumb={nav.crumbs} />

      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1.4fr", gap: 12, marginBottom: 12 }}>
          <div><TextField label="তারিখ" type="date" value={header.p_date} onChange={(v) => setHeader({ ...header, p_date: v })} /></div>
          <SelectField label="সরবরাহকারী" value={header.supplier_id} onChange={(v) => setHeader({ ...header, supplier_id: v })} options={supOpts} />
          <TextField label="নোট" value={header.note} onChange={(v) => setHeader({ ...header, note: v })} />
        </div>

        <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 8 }}>🧾 ক্রয় আইটেম</div>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <SelectField label="উপকরণ" value={it.ingredient_id} onChange={(v) => setRow(idx, { ingredient_id: v })} options={ingOpts} />
            <TextField label="পরিমাণ" value={it.qty} onChange={(v) => setRow(idx, { qty: v })} />
            <TextField label="একক" value={it.unit} onChange={(v) => setRow(idx, { unit: v })} />
            <TextField label="একক মূল্য" value={it.unit_cost} onChange={(v) => setRow(idx, { unit_cost: v })} />
            <div style={{ textAlign: "right", fontWeight: 700, color: "#2E7D32", fontSize: 14 }}>{taka((Number(it.qty) || 0) * (Number(it.unit_cost) || 0))}</div>
            <button type="button" onClick={() => removeRow(idx)} title="সরান" style={{ background: "none", border: "none", color: "#E53935", cursor: "pointer", fontSize: 18 }}>🗑</button>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 10 }}>
          <Button size="sm" variant="secondary" onClick={addRow} icon="＋">আইটেম যোগ</Button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1b5e20" }}>সর্বমোট: {taka(grandTotal)}</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Button onClick={save} loading={saving} icon="💾">ক্রয় সংরক্ষণ</Button>
          <Button variant="secondary" onClick={reset} icon="✕" style={{ marginLeft: 8 }}>রিসেট</Button>
        </div>
      </Card>

      <DataTable columns={columns} rows={rows} loading={loading} exportName="purchases"
        empty={{ icon: "🧾", title: "কোনো ক্রয় নেই", description: "উপরে ক্রয় যোগ করুন" }} />

      {view && (
        <Modal title={"ক্রয় #" + view.id} icon="🧾" onClose={() => setView(null)}
          footer={<><Button variant="secondary" onClick={() => setView(null)}>বন্ধ</Button><Button onClick={() => printPurchase(view)} icon="🖨">প্রিন্ট</Button></>}>
          <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 14, flexWrap: "wrap" }}>
            <span>📅 {view.p_date}</span>
            {view.supplier_name && <span>🏪 {view.supplier_name}</span>}
            <Badge color="#2E7D32">মোট {taka(view.total)}</Badge>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#E8F5E9" }}>
              {["উপকরণ", "পরিমাণ", "একক", "একক মূল্য", "উপমোট"].map((h) => <th key={h} style={{ padding: 8, textAlign: "left", border: "1px solid #cfe0cf" }}>{h}</th>)}
            </tr></thead>
            <tbody>{(view.items || []).map((it) => (
              <tr key={it.id}>
                <td style={{ padding: 8, border: "1px solid #eef" }}>{it.ingredient}</td>
                <td style={{ padding: 8, border: "1px solid #eef", textAlign: "right" }}>{bn(it.qty)}</td>
                <td style={{ padding: 8, border: "1px solid #eef" }}>{it.unit}</td>
                <td style={{ padding: 8, border: "1px solid #eef", textAlign: "right" }}>{taka(it.unit_cost)}</td>
                <td style={{ padding: 8, border: "1px solid #eef", textAlign: "right" }}>{taka(it.subtotal)}</td>
              </tr>
            ))}</tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}
