import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader, DataTable, StatCard, StatRow, Badge, Button, Modal, useToast, SelectField, TextField, TextareaField } from "../../ui";
import { store as storeApi } from "../../data";
import { bn, todayISO, taka, TXN_TYPES, TXN_SOURCES, txnTypeLabel, txnTypeColor, txnSourceLabel } from "./constants";
import { printDoc, tableHtml } from "./print";

export default function KitchenStore({ nav, icon }) {
  const toast = useToast();
  const [balances, setBalances] = useState([]);
  const [summary, setSummary] = useState({ itemCount: 0, lowCount: 0, totalValue: 0, txnCount: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ledger, setLedger] = useState(null); // {ingredient, rows}

  const load = useCallback(async () => {
    const [b, s] = await Promise.all([storeApi.balances(), storeApi.summary()]);
    setBalances(b); setSummary(s); setLoading(false);
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => { const [b, s] = await Promise.all([storeApi.balances(), storeApi.summary()]); if (alive) { setBalances(b); setSummary(s); setLoading(false); } })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return balances.filter((r) => {
      if (lowOnly && !r.low) return false;
      if (!t) return true;
      return [r.name_bn, r.category].some((v) => String(v || "").toLowerCase().includes(t));
    });
  }, [balances, q, lowOnly]);

  const ingOpts = useMemo(() => balances.map((b) => ({ value: String(b.ingredient_id), label: `${b.name_bn} (${b.unit})`, unit: b.unit })), [balances]);

  const openMove = (row) => {
    setForm({ ingredient_id: row ? String(row.ingredient_id) : "", t_date: todayISO(), type: "in", source: "manual", qty: "", unit: row ? row.unit : "", unit_cost: "", note: "" });
    setModal(true);
  };

  const submit = async () => {
    if (!form.ingredient_id) return toast.error("উপকরণ নির্বাচন করুন");
    if (!(Number(form.qty) > 0)) return toast.error("পরিমাণ দিন");
    setSaving(true);
    try {
      await storeApi.add({ ingredient_id: Number(form.ingredient_id), t_date: form.t_date, type: form.type, qty: Number(form.qty), unit: form.unit || null, unit_cost: Number(form.unit_cost) || 0, source: form.source, note: form.note || null });
      toast.success("স্টক এন্ট্রি হয়েছে"); setModal(false); await load();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const openLedger = async (row) => {
    const rows = await storeApi.transactions({ ingredientId: row.ingredient_id });
    setLedger({ ingredient: row.name_bn, rows });
  };
  const delTxn = async (t) => { if (!window.confirm("এই এন্ট্রি মুছবেন?")) return; await storeApi.remove(t.id); const rows = await storeApi.transactions({ ingredientId: t.ingredient_id }); setLedger((l) => ({ ...l, rows })); await load(); };

  const printStock = () => {
    const body = tableHtml(["#", "উপকরণ", "ক্যাটাগরি", "বর্তমান স্টক", "একক", "ন্যূনতম", "মূল্য", "অবস্থা"],
      filtered.map((r, i) => [i + 1, r.name_bn, r.category || "", bn(r.current_qty), r.unit, bn(r.min_stock || 0), taka(r.stock_value), r.low ? "কম" : "ঠিক"]),
      ["center", "left", "left", "right", "center", "right", "right", "center"]);
    printDoc("স্টক তালিকা", body, { subtitle: `মোট মূল্য ${taka(summary.totalValue)} • কম স্টক ${bn(summary.lowCount)}` });
  };

  const columns = [
    { key: "name_bn", label: "উপকরণ", sortable: true },
    { key: "category", label: "ক্যাটাগরি", render: (r) => r.category ? <Badge color="#00838F">{r.category}</Badge> : "—", exportValue: (r) => r.category },
    { key: "current_qty", label: "বর্তমান স্টক", align: "right", sortable: true, render: (r) => <b style={{ color: r.low ? "#E53935" : "#1b5e20" }}>{bn(r.current_qty)}</b> },
    { key: "unit", label: "একক", align: "center" },
    { key: "min_stock", label: "ন্যূনতম", align: "right", render: (r) => bn(r.min_stock || 0) },
    { key: "stock_value", label: "মূল্য", align: "right", render: (r) => taka(r.stock_value), exportValue: (r) => r.stock_value, sortable: true },
    { key: "low", label: "অবস্থা", align: "center", render: (r) => r.low ? <Badge color="#E53935">কম স্টক</Badge> : <Badge color="#2E7D32">ঠিক আছে</Badge>, exportValue: (r) => r.low ? "কম" : "ঠিক" },
    { key: "__a", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <Button size="sm" onClick={() => openMove(r)}>± নড়াচড়া</Button>
        <Button size="sm" variant="subtle" onClick={() => openLedger(r)}>📜 লেজার</Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader icon={icon} title="কিচেন স্টোর" description="উপকরণভিত্তিক স্টক (লেজার থেকে গণনা), কম-স্টক সতর্কতা ও স্টক নড়াচড়া" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<><Button variant="secondary" onClick={printStock} icon="🖨">প্রিন্ট</Button><Button onClick={() => openMove(null)} icon="±">স্টক এন্ট্রি</Button></>} />

      <StatRow>
        <StatCard icon="🧂" label="মোট উপকরণ" value={bn(summary.itemCount)} color="#2E7D32" />
        <StatCard icon="⚠️" label="কম স্টক" value={bn(summary.lowCount)} color="#E53935" />
        <StatCard icon="💰" label="স্টক মূল্য" value={taka(summary.totalValue)} color="#6A1B9A" />
        <StatCard icon="📜" label="মোট লেজার এন্ট্রি" value={bn(summary.txnCount)} color="#00838F" />
      </StatRow>

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 উপকরণ / ক্যাটাগরি" style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #cfd8cf", minWidth: 230, fontSize: 14 }} />
        <button type="button" onClick={() => setLowOnly((v) => !v)} style={{ padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `1.5px solid ${lowOnly ? "#E53935" : "#cfd8cf"}`, background: lowOnly ? "#E53935" : "#fff", color: lowOnly ? "#fff" : "#607D8B" }}>⚠️ শুধু কম স্টক</button>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} exportName="kitchen-stock"
        empty={{ icon: "📦", title: "স্টকে কিছু নেই", description: "‘স্টক এন্ট্রি’ বা ক্রয় দিয়ে যোগ করুন" }} />

      {modal && form && (
        <Modal title="স্টক নড়াচড়া" icon="±" onClose={() => setModal(false)}
          footer={<><Button variant="secondary" onClick={() => setModal(false)}>বাতিল</Button><Button onClick={submit} loading={saving}>💾 সংরক্ষণ</Button></>}>
          <SelectField label="উপকরণ" required value={form.ingredient_id} onChange={(v) => { const o = ingOpts.find((x) => x.value === v); setForm({ ...form, ingredient_id: v, unit: o ? o.unit : form.unit }); }} options={[{ value: "", label: "— বাছুন —" }, ...ingOpts]} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SelectField label="ধরন" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TXN_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
            <SelectField label="উৎস" value={form.source} onChange={(v) => setForm({ ...form, source: v })} options={TXN_SOURCES.map((t) => ({ value: t.value, label: t.label }))} />
            <TextField label="পরিমাণ" value={form.qty} onChange={(v) => setForm({ ...form, qty: v })} />
            <TextField label="একক" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
            <TextField label="একক মূল্য (ঐচ্ছিক)" value={form.unit_cost} onChange={(v) => setForm({ ...form, unit_cost: v })} />
            <TextField label="তারিখ" type="date" value={form.t_date} onChange={(v) => setForm({ ...form, t_date: v })} />
          </div>
          <div style={{ fontSize: 12, color: "#78909C", margin: "2px 0 6px" }}>ইন → স্টক বাড়ে, আউট → কমে, সমন্বয় → সরাসরি যোগ/বিয়োগ (ঋণাত্মক পরিমাণ দিলে কমবে)।</div>
          <TextareaField label="নোট" value={form.note} onChange={(v) => setForm({ ...form, note: v })} rows={2} />
        </Modal>
      )}

      {ledger && (
        <Modal title={`লেজার — ${ledger.ingredient}`} icon="📜" onClose={() => setLedger(null)}
          footer={<Button variant="secondary" onClick={() => setLedger(null)}>বন্ধ</Button>}>
          {ledger.rows.length === 0 && <div style={{ color: "#90A4AE", padding: 12 }}>কোনো লেজার এন্ট্রি নেই।</div>}
          {ledger.rows.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: "#E8F5E9" }}>{["তারিখ", "ধরন", "উৎস", "পরিমাণ", "একক", "নোট", ""].map((h) => <th key={h} style={{ padding: 7, textAlign: "left", border: "1px solid #cfe0cf" }}>{h}</th>)}</tr></thead>
              <tbody>{ledger.rows.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: 7, border: "1px solid #eef" }}>{t.t_date}</td>
                  <td style={{ padding: 7, border: "1px solid #eef" }}><Badge color={txnTypeColor(t.type)}>{txnTypeLabel(t.type)}</Badge></td>
                  <td style={{ padding: 7, border: "1px solid #eef" }}>{txnSourceLabel(t.source)}</td>
                  <td style={{ padding: 7, border: "1px solid #eef", textAlign: "right" }}>{bn(t.qty)}</td>
                  <td style={{ padding: 7, border: "1px solid #eef" }}>{t.unit}</td>
                  <td style={{ padding: 7, border: "1px solid #eef", fontSize: 12, color: "#607D8B" }}>{t.note || "—"}</td>
                  <td style={{ padding: 7, border: "1px solid #eef" }}>{t.source !== "purchase" && <button type="button" onClick={() => delTxn(t)} style={{ background: "none", border: "none", color: "#E53935", cursor: "pointer" }}>🗑</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </Modal>
      )}
    </div>
  );
}
