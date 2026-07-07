import { useState, useEffect } from "react";
import { PageHeader, Card, StatCard, StatRow, Badge, Button, Spinner } from "../../ui";
import { kitchenDashboard } from "../../data";
import { bn, taka, mealLabel, txnTypeColor, txnTypeLabel } from "./constants";

function Section({ title, icon, children, action }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, color: "#243B40" }}>{icon} {title}</div>{action}
      </div>
      {children}
    </Card>
  );
}

function MenuBlock({ menus, empty }) {
  if (!menus || !menus.length) return <div style={{ color: "#90A4AE", fontSize: 13 }}>{empty}</div>;
  return menus.map((m) => (
    <div key={m.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f4f0" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
        <Badge color="#2E7D32">{mealLabel(m.meal_type)}</Badge>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{m.title || "—"}</span>
      </div>
      <div style={{ fontSize: 12, color: "#607D8B" }}>{m.dish_names || "কোনো পদ নেই"}</div>
    </div>
  ));
}

export default function KitchenDashboard({ nav, icon }) {
  const [d, setD] = useState(null);

  const load = async () => setD(await kitchenDashboard.overview());
  useEffect(() => {
    let alive = true;
    (async () => { const o = await kitchenDashboard.overview(); if (alive) setD(o); })();
    return () => { alive = false; };
  }, []);

  if (!d) return (
    <div>
      <PageHeader icon={icon} title="কিচেন ড্যাশবোর্ড" description="রান্নাঘরের সারসংক্ষেপ" onBack={nav.onBack} breadcrumb={nav.crumbs} />
      <div style={{ textAlign: "center", padding: 60 }}><Spinner /></div>
    </div>
  );

  return (
    <div>
      <PageHeader icon={icon} title="কিচেন ড্যাশবোর্ড" description="আজকের মেনু, স্টক অবস্থা, কম-স্টক সতর্কতা ও সাম্প্রতিক কার্যক্রম" onBack={nav.onBack} breadcrumb={nav.crumbs}
        actions={<Button variant="secondary" onClick={load} icon="↻">রিফ্রেশ</Button>} />

      <StatRow>
        <StatCard icon="💰" label="স্টক মূল্য" value={taka(d.store.totalValue)} color="#6A1B9A" />
        <StatCard icon="⚠️" label="কম স্টক" value={bn(d.store.lowCount)} color="#E53935" />
        <StatCard icon="🍲" label="পদ" value={bn(d.counts.dishes)} color="#EF6C00" />
        <StatCard icon="🧂" label="উপকরণ" value={bn(d.counts.ingredients)} color="#558B2F" />
        <StatCard icon="📅" label="মেনু" value={bn(d.counts.menus)} color="#2E7D32" />
        <StatCard icon="🏪" label="সরবরাহকারী" value={bn(d.counts.suppliers)} color="#00838F" />
      </StatRow>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Section title="আজকের মেনু" icon="🍽️"><MenuBlock menus={d.todayMenus} empty="আজকের কোনো মেনু নেই" /></Section>
        <Section title="আগামীকালের মেনু" icon="🌅"><MenuBlock menus={d.tomorrowMenus} empty="আগামীকালের কোনো মেনু নেই" /></Section>

        <Section title="কম স্টক সতর্কতা" icon="⚠️">
          {(!d.low || !d.low.length) && <div style={{ color: "#2E7D32", fontSize: 13 }}>✓ সব উপকরণ পর্যাপ্ত আছে</div>}
          {(d.low || []).slice(0, 8).map((l) => (
            <div key={l.ingredient_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f4f0", fontSize: 13 }}>
              <span>{l.name_bn}</span>
              <span style={{ color: "#E53935", fontWeight: 700 }}>{bn(l.current_qty)} / {bn(l.min_stock || 0)} {l.unit}</span>
            </div>
          ))}
        </Section>

        <Section title="সাম্প্রতিক ক্রয়" icon="🧾">
          {(!d.recentPurchases || !d.recentPurchases.length) && <div style={{ color: "#90A4AE", fontSize: 13 }}>কোনো ক্রয় নেই</div>}
          {(d.recentPurchases || []).map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f4f0", fontSize: 13 }}>
              <span>{p.p_date} · {p.supplier_name || "—"}</span>
              <span style={{ fontWeight: 700, color: "#2E7D32" }}>{taka(p.total)}</span>
            </div>
          ))}
        </Section>
      </div>

      <div style={{ marginTop: 16 }}>
        <Section title="সাম্প্রতিক স্টক নড়াচড়া" icon="📜">
          {(!d.recentTxns || !d.recentTxns.length) && <div style={{ color: "#90A4AE", fontSize: 13 }}>কোনো নড়াচড়া নেই</div>}
          {(d.recentTxns || []).map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f4f0", fontSize: 13 }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Badge color={txnTypeColor(t.type)}>{txnTypeLabel(t.type)}</Badge>{t.ingredient}</span>
              <span style={{ color: "#607D8B" }}>{bn(t.qty)} {t.unit} · {t.t_date}</span>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
