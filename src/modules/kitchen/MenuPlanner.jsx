import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader, Card, DataTable, Badge, Button, useToast, SelectField, TextField } from "../../ui";
import { dishes as dishApi, menus as menuApi } from "../../data";
import { bn, todayISO, MEALS, MENU_TYPES, menuTypeLabel, mealLabel } from "./constants";
import { printDoc, tableHtml } from "./print";

const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export default function MenuPlanner({ nav, icon }) {
  const toast = useToast();
  const [dishList, setDishList] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [meal, setMeal] = useState("lunch");
  const [menuType, setMenuType] = useState("normal");
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState([]);           // dish ids (numbers)
  const [currentId, setCurrentId] = useState(null);    // editing dated menu id
  const [dishQ, setDishQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [range, setRange] = useState("month");         // week | month | all

  const dishById = useMemo(() => Object.fromEntries(dishList.map((d) => [d.id, d])), [dishList]);

  const reloadLists = useCallback(async () => {
    const filter = range === "all" ? {} : { from: range === "week" ? addDays(date, -6) : addDays(date, -30), to: addDays(date, 30) };
    const [l, t] = await Promise.all([menuApi.list(filter), menuApi.templates()]);
    setList(l); setTemplates(t);
  }, [range, date]);

  useEffect(() => {
    let alive = true;
    (async () => { const d = await dishApi.list(); if (alive) setDishList(d); })();
    return () => { alive = false; };
  }, []);

  // date/meal বদলালে ঐ বেলার মেনু লোড
  useEffect(() => {
    let alive = true;
    (async () => {
      const m = await menuApi.getByDateMeal(date, meal);
      if (!alive) return;
      if (m) { setCurrentId(m.id); setMenuType(m.menu_type || "normal"); setTitle(m.title || ""); setPicked(m.items.map((i) => i.dish_id)); }
      else { setCurrentId(null); setTitle(""); setPicked([]); setMenuType("normal"); }
    })();
    return () => { alive = false; };
  }, [date, meal]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const filter = range === "all" ? {} : { from: range === "week" ? addDays(date, -6) : addDays(date, -30), to: addDays(date, 30) };
      const [l, t] = await Promise.all([menuApi.list(filter), menuApi.templates()]);
      if (alive) { setList(l); setTemplates(t); }
    })();
    return () => { alive = false; };
  }, [range, date]);

  const availableDishes = useMemo(() => {
    const t = dishQ.trim().toLowerCase();
    return dishList.filter((d) => d.active !== "0" && (d.meal_type === "any" || d.meal_type === meal) &&
      (!t || String(d.name).toLowerCase().includes(t) || String(d.category || "").toLowerCase().includes(t)));
  }, [dishList, dishQ, meal]);

  const toggle = (id) => setPicked((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

  const save = async (asTemplate) => {
    if (!picked.length) return toast.error("অন্তত একটি পদ নির্বাচন করুন");
    setSaving(true);
    try {
      if (asTemplate) {
        await menuApi.save({ is_template: 1, m_date: null, meal_type: meal, menu_type: "template", title: title || `${mealLabel(meal)} টেমপ্লেট`, items: picked });
        toast.success("টেমপ্লেট সংরক্ষণ হয়েছে");
      } else {
        const saved = await menuApi.save({ id: currentId, m_date: date, meal_type: meal, menu_type: menuType, title, items: picked });
        setCurrentId(saved.id);
        toast.success("মেনু সংরক্ষণ হয়েছে");
      }
      await reloadLists();
    } catch (e) { toast.error("সমস্যা: " + (e.message || e)); }
    finally { setSaving(false); }
  };

  // আগের মেনু/টেমপ্লেট থেকে পদ বর্তমান এডিটরে আনা (Copy Previous / Apply Template)
  const loadInto = (m) => { setPicked(m.items.map((i) => i.dish_id)); if (m.title) setTitle(m.title); toast.info("পদ এডিটরে আনা হয়েছে — সংরক্ষণ করুন"); };
  const editDated = (m) => { setDate(m.m_date); setMeal(m.meal_type); };
  const del = async (m) => { if (!window.confirm("এই মেনু মুছবেন?")) return; await menuApi.remove(m.id); toast.success("মুছে ফেলা হয়েছে"); if (m.id === currentId) setCurrentId(null); await reloadLists(); };

  const printMenu = (m, compact) => {
    const body = tableHtml(["#", "পদ", "ক্যাটাগরি"], (m.items || []).map((i, idx) => [idx + 1, i.dish_name, i.dish_category || ""]), ["center", "left", "left"]);
    printDoc(`মেনু — ${m.title || mealLabel(m.meal_type)}`, body, { compact, subtitle: `${m.m_date || "টেমপ্লেট"} • ${mealLabel(m.meal_type)}` });
  };
  const printCurrent = (compact) => printMenu({ title, meal_type: meal, m_date: date, items: picked.map((id) => ({ dish_name: dishById[id]?.name, dish_category: dishById[id]?.category })) }, compact);

  const listCols = [
    { key: "m_date", label: "তারিখ", sortable: true, render: (r) => r.m_date || "—" },
    { key: "meal_type", label: "বেলা", render: (r) => <Badge color="#2E7D32">{mealLabel(r.meal_type)}</Badge>, exportValue: (r) => mealLabel(r.meal_type) },
    { key: "menu_type", label: "ধরন", render: (r) => <Badge color="#6A1B9A">{menuTypeLabel(r.menu_type)}</Badge>, exportValue: (r) => menuTypeLabel(r.menu_type) },
    { key: "title", label: "শিরোনাম", render: (r) => r.title || "—" },
    { key: "dish_names", label: "পদসমূহ", render: (r) => <span style={{ fontSize: 12, color: "#546E7A" }}>{r.dish_names || "—"}</span> },
    { key: "dish_count", label: "সংখ্যা", align: "center", render: (r) => bn(r.dish_count) },
    { key: "__a", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <Button size="sm" variant="subtle" onClick={() => editDated(r)}>✏</Button>
        <Button size="sm" variant="subtle" onClick={() => loadInto(r)}>📋 কপি</Button>
        <Button size="sm" variant="subtle" onClick={() => printMenu(r, false)}>🖨</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];
  const tplCols = [
    { key: "title", label: "টেমপ্লেট", render: (r) => r.title || "—" },
    { key: "meal_type", label: "বেলা", render: (r) => <Badge color="#2E7D32">{mealLabel(r.meal_type)}</Badge>, exportValue: (r) => mealLabel(r.meal_type) },
    { key: "dish_names", label: "পদসমূহ", render: (r) => <span style={{ fontSize: 12, color: "#546E7A" }}>{r.dish_names || "—"}</span> },
    { key: "__a", label: "অ্যাকশন", render: (r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <Button size="sm" onClick={() => loadInto(r)}>➕ প্রয়োগ</Button>
        <Button size="sm" variant="dangerSoft" onClick={() => del(r)}>🗑</Button>
      </div>
    ) },
  ];

  const rangeBtn = (v, label) => (
    <button type="button" onClick={() => setRange(v)} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `1.5px solid ${range === v ? "#2E7D32" : "#cfd8cf"}`, background: range === v ? "#2E7D32" : "#fff", color: range === v ? "#fff" : "#607D8B" }}>{label}</button>
  );

  return (
    <div>
      <PageHeader icon={icon} title="মেনু প্ল্যানার" description="দৈনিক/সাপ্তাহিক/মাসিক মেনু, রমজান/ঈদ/বিশেষ ইভেন্ট, টেমপ্লেট ও আগের মেনু কপি" onBack={nav.onBack} breadcrumb={nav.crumbs} />

      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #cfd8cf", fontSize: 14 }} />
          {MEALS.map((m) => (
            <button key={m.key} type="button" onClick={() => setMeal(m.key)} style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, border: `1.5px solid ${meal === m.key ? "#2E7D32" : "#cfd8cf"}`, background: meal === m.key ? "#2E7D32" : "#fff", color: meal === m.key ? "#fff" : "#4a5a4a" }}>{m.icon} {m.label}</button>
          ))}
          <div style={{ minWidth: 170 }}><SelectField label="মেনুর ধরন" value={menuType} onChange={setMenuType} options={MENU_TYPES.filter((t) => t.value !== "template")} /></div>
          <div style={{ flex: 1, minWidth: 180 }}><TextField label="শিরোনাম (ঐচ্ছিক)" value={title} onChange={setTitle} /></div>
          {currentId && <Badge color="#0288D1">সম্পাদনা হচ্ছে</Badge>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#243B40", marginBottom: 6 }}>পদ নির্বাচন ({bn(availableDishes.length)}টি)</div>
            <input value={dishQ} onChange={(e) => setDishQ(e.target.value)} placeholder="🔍 পদ খুঁজুন" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cfd8cf", fontSize: 13, marginBottom: 8 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 220, overflowY: "auto" }}>
              {availableDishes.map((d) => {
                const on = picked.includes(d.id);
                return <button key={d.id} type="button" onClick={() => toggle(d.id)} style={{ padding: "6px 12px", borderRadius: 18, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `1.5px solid ${on ? "#2E7D32" : "#cfd8cf"}`, background: on ? "#2E7D32" : "#fff", color: on ? "#fff" : "#4a5a4a" }}>{on ? "✓ " : ""}{d.name}</button>;
              })}
              {availableDishes.length === 0 && <span style={{ color: "#90A4AE", fontSize: 13 }}>এই বেলার কোনো পদ নেই — পদ ব্যবস্থাপনায় যোগ করুন।</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#243B40", marginBottom: 6 }}>নির্বাচিত পদ ({bn(picked.length)})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 40, padding: 8, background: "#F6FAF6", borderRadius: 10, border: "1px dashed #cfd8cf" }}>
              {picked.length === 0 && <span style={{ color: "#90A4AE", fontSize: 13 }}>বাম থেকে পদ নির্বাচন করুন</span>}
              {picked.map((id) => <span key={id} onClick={() => toggle(id)} style={{ padding: "5px 10px", borderRadius: 16, background: "#E8F5E9", color: "#1b5e20", fontSize: 13, fontWeight: 600, cursor: "pointer" }} title="সরাতে ক্লিক করুন">{dishById[id]?.name || "?"} ✕</span>)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <Button onClick={() => save(false)} loading={saving} icon="💾">মেনু সংরক্ষণ</Button>
          <Button variant="secondary" onClick={() => save(true)} icon="⭐">টেমপ্লেট হিসেবে সংরক্ষণ</Button>
          <Button variant="secondary" onClick={() => printCurrent(false)} icon="🖨">প্রিন্ট (A4)</Button>
          <Button variant="secondary" onClick={() => printCurrent(true)} icon="🍳">কিচেন কপি</Button>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 700, color: "#243B40" }}>📅 মেনু তালিকা</div>
          <div style={{ display: "flex", gap: 6 }}>{rangeBtn("week", "সপ্তাহ")}{rangeBtn("month", "মাস")}{rangeBtn("all", "সব")}</div>
        </div>
        <DataTable columns={listCols} rows={list} exportName="menus" empty={{ icon: "📅", title: "কোনো মেনু নেই", description: "উপরে মেনু তৈরি করে সংরক্ষণ করুন" }} />
      </Card>

      {templates.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, color: "#243B40", marginBottom: 10 }}>⭐ টেমপ্লেট</div>
          <DataTable columns={tplCols} rows={templates} exportName="menu-templates" />
        </Card>
      )}
    </div>
  );
}
