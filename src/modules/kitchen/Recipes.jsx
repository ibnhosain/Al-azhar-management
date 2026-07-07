import { useState, useEffect, useMemo } from "react";
import { PageHeader, Card, Badge, Button, useToast, SelectField, TextField, TextareaField } from "../../ui";
import { dishes as dishApi, ingredients as ingApi, recipes as recipeApi } from "../../data";
import { bn, mealLabel } from "./constants";
import { printDoc, tableHtml } from "./print";

const blankItem = () => ({ ingredient_id: "", qty_per_person: "", unit: "", optional: false, note: "" });

export default function Recipes({ nav, icon }) {
  const toast = useToast();
  const [dishList, setDishList] = useState([]);
  const [ingList, setIngList] = useState([]);
  const [dishId, setDishId] = useState("");
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState({ cooking_notes: "", prep_notes: "", special_instruction: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [d, i] = await Promise.all([dishApi.list(), ingApi.list()]);
      if (alive) { setDishList(d); setIngList(i); }
    })();
    return () => { alive = false; };
  }, []);

  const dishOpts = useMemo(() => dishList.map((d) => ({ value: String(d.id), label: `${d.name}${d.category ? " · " + d.category : ""}` })), [dishList]);
  const ingOpts = useMemo(() => ingList.map((i) => ({ value: String(i.id), label: `${i.name_bn} (${i.unit})` })), [ingList]);
  const ingById = useMemo(() => Object.fromEntries(ingList.map((i) => [String(i.id), i])), [ingList]);
  const dish = dishList.find((d) => String(d.id) === String(dishId));

  const pickDish = async (id) => {
    setDishId(id);
    if (!id) { setItems([]); setNotes({ cooking_notes: "", prep_notes: "", special_instruction: "" }); return; }
    setLoading(true);
    try {
      const r = await recipeApi.getByDish(Number(id));
      setNotes({ cooking_notes: r.cooking_notes || "", prep_notes: r.prep_notes || "", special_instruction: r.special_instruction || "" });
      setItems((r.items || []).map((it) => ({ ingredient_id: String(it.ingredient_id || ""), qty_per_person: String(it.qty_per_person ?? ""), unit: it.unit || "", optional: it.optional === "1", note: it.note || "" })));
    } finally { setLoading(false); }
  };

  const addRow = () => setItems((a) => [...a, blankItem()]);
  const removeRow = (idx) => setItems((a) => a.filter((_, i) => i !== idx));
  const setRow = (idx, patch) => setItems((a) => a.map((it, i) => {
    if (i !== idx) return it;
    const next = { ...it, ...patch };
    if (patch.ingredient_id && !it.unit) { const ing = ingById[patch.ingredient_id]; if (ing) next.unit = ing.unit; }
    return next;
  }));

  const costPerPerson = useMemo(() => items.reduce((s, it) => {
    const ing = ingById[it.ingredient_id];
    return s + (Number(it.qty_per_person) || 0) * (ing ? Number(ing.avg_cost) || 0 : 0);
  }, 0), [items, ingById]);

  const save = async () => {
    if (!dishId) return toast.error("প্রথমে একটি পদ নির্বাচন করুন");
    const clean = items.filter((it) => it.ingredient_id);
    setSaving(true);
    try {
      await recipeApi.saveForDish(Number(dishId), {
        ...notes,
        items: clean.map((it) => ({ ingredient_id: Number(it.ingredient_id), qty_per_person: Number(it.qty_per_person) || 0, unit: it.unit || null, optional: it.optional, note: it.note || null })),
      });
      toast.success("রেসিপি সংরক্ষণ হয়েছে");
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  const printRecipe = (compact) => {
    if (!dish) return;
    const body = tableHtml(
      ["#", "উপকরণ", "জনপ্রতি পরিমাণ", "একক", "ধরন", "নোট"],
      items.filter((it) => it.ingredient_id).map((it, i) => {
        const ing = ingById[it.ingredient_id];
        return [i + 1, ing ? ing.name_bn : "—", it.qty_per_person || 0, it.unit || (ing ? ing.unit : ""), it.optional ? "ঐচ্ছিক" : "আবশ্যক", it.note || ""];
      }),
      ["center", "left", "right", "center", "center", "left"]
    );
    const notesHtml = `<div style="margin-top:12px;font-size:13px;line-height:1.7">
      ${notes.prep_notes ? `<b>প্রস্তুতি:</b> ${notes.prep_notes}<br/>` : ""}
      ${notes.cooking_notes ? `<b>রান্না:</b> ${notes.cooking_notes}<br/>` : ""}
      ${notes.special_instruction ? `<b>বিশেষ নির্দেশনা:</b> ${notes.special_instruction}` : ""}</div>`;
    printDoc(`রেসিপি — ${dish.name}`, body + notesHtml, { compact, subtitle: `${mealLabel(dish.meal_type)} • জনপ্রতি খরচ ৳${bn(costPerPerson.toFixed(2))}` });
  };

  return (
    <div>
      <PageHeader icon={icon} title="রেসিপি ব্যবস্থাপনা" description="প্রতিটি পদের উপকরণ (জনপ্রতি পরিমাণ), ঐচ্ছিক উপকরণ ও রান্নার নোট" onBack={nav.onBack} breadcrumb={nav.crumbs} />

      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ maxWidth: 460 }}>
          <SelectField label="পদ নির্বাচন করুন" value={dishId} onChange={pickDish} options={[{ value: "", label: "— পদ বাছুন —" }, ...dishOpts]} />
        </div>
        {dish && <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Badge color="#EF6C00">{dish.category || "—"}</Badge>
          <Badge color="#2E7D32">{mealLabel(dish.meal_type)}</Badge>
          <span style={{ color: "#607D8B", fontSize: 13 }}>জনপ্রতি আনুমানিক খরচ: <b style={{ color: "#2E7D32" }}>৳{bn(costPerPerson.toFixed(2))}</b></span>
        </div>}
      </Card>

      {!dishId && <Card style={{ padding: 40, textAlign: "center", color: "#90A4AE" }}>🍽️ রেসিপি যুক্ত/সম্পাদনা করতে উপরে একটি পদ নির্বাচন করুন</Card>}

      {dishId && !loading && (
        <>
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: "#243B40" }}>🧂 উপকরণ তালিকা</div>
              <Button size="sm" variant="secondary" onClick={addRow} icon="＋">উপকরণ যোগ</Button>
            </div>
            {items.length === 0 && <div style={{ color: "#90A4AE", fontSize: 13, padding: "8px 0" }}>এখনো কোনো উপকরণ নেই — ‘উপকরণ যোগ’ দিন।</div>}
            {items.map((it, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto 1.4fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <SelectField label="উপকরণ" value={it.ingredient_id} onChange={(v) => setRow(idx, { ingredient_id: v })} options={[{ value: "", label: "— বাছুন —" }, ...ingOpts]} />
                <TextField label="জনপ্রতি" value={it.qty_per_person} onChange={(v) => setRow(idx, { qty_per_person: v })} />
                <TextField label="একক" value={it.unit} onChange={(v) => setRow(idx, { unit: v })} />
                <button type="button" title="ঐচ্ছিক?" onClick={() => setRow(idx, { optional: !it.optional })}
                  style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", border: `1.5px solid ${it.optional ? "#EF6C00" : "#cfd8cf"}`, background: it.optional ? "#EF6C00" : "#fff", color: it.optional ? "#fff" : "#607D8B" }}>
                  {it.optional ? "ঐচ্ছিক" : "আবশ্যক"}
                </button>
                <TextField label="নোট" value={it.note} onChange={(v) => setRow(idx, { note: v })} />
                <button type="button" onClick={() => removeRow(idx)} title="সরান" style={{ background: "none", border: "none", color: "#E53935", cursor: "pointer", fontSize: 18 }}>🗑</button>
              </div>
            ))}
          </Card>

          <Card style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 10 }}>📝 নোট</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <TextareaField label="প্রস্তুতি নোট" value={notes.prep_notes} onChange={(v) => setNotes({ ...notes, prep_notes: v })} rows={2} />
              <TextareaField label="রান্নার ধাপ" value={notes.cooking_notes} onChange={(v) => setNotes({ ...notes, cooking_notes: v })} rows={2} />
            </div>
            <TextareaField label="বিশেষ নির্দেশনা" value={notes.special_instruction} onChange={(v) => setNotes({ ...notes, special_instruction: v })} rows={2} />
          </Card>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={save} loading={saving} icon="💾">রেসিপি সংরক্ষণ</Button>
            <Button variant="secondary" onClick={() => printRecipe(false)} icon="🖨">রেসিপি প্রিন্ট (A4)</Button>
            <Button variant="secondary" onClick={() => printRecipe(true)} icon="🍳">কিচেন কপি</Button>
          </div>
        </>
      )}
    </div>
  );
}
