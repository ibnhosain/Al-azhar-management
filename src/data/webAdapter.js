// ────────────────────────────────────────────────────────────────
//  webAdapter.js — Electron ছাড়া (ব্রাউজার/GitHub Pages) চালানোর
//  in-memory fallback। SQLite-এর মতো একই channel:action সমর্থন করে,
//  যাতে একই React কোড ওয়েবেও ভাঙে না।
//  (পেজ রিফ্রেশে ডেটা মুছে যায় — শুধু ডেমো/ওয়েব সংস্করণের জন্য)
// ────────────────────────────────────────────────────────────────
const stores = {}; // resource -> { seq, rows: [] }

function store(resource) {
  if (!stores[resource]) stores[resource] = { seq: 0, rows: [] };
  return stores[resource];
}

// একবারই seed করে (ইতিমধ্যে ডেটা থাকলে আবার করে না)।
export function seedResource(resource, rows) {
  const s = store(resource);
  if (s.rows.length === 0 && Array.isArray(rows)) {
    for (const r of rows) s.rows.push({ ...r, id: ++s.seq });
  }
}

const attendanceByDate = {};
const bazarStore = { seq: 0, rows: [] };

export async function webCall(channel, payload) {
  const [resource, action] = String(channel).split(":");

  // দৈনিক হাজিরা (custom — CRUD নয়)
  if (resource === "attendance") {
    if (action === "getByDate") return (attendanceByDate[payload] || []).slice();
    if (action === "saveForDate") {
      const { date, records } = payload;
      attendanceByDate[date] = records.map((r, i) => ({ ...r, id: i + 1, date }));
      return attendanceByDate[date].slice();
    }
    return [];
  }

  // ব্যাকআপ — শুধু ডেস্কটপ (Electron) অ্যাপে; ওয়েবে নিষ্ক্রিয়
  if (resource === "backup") {
    if (action === "info") return { web: true, dbPath: "(ওয়েব সংস্করণ)", dbDirectory: "(ওয়েব)", backupDir: "", autoBackup: false, lastBackupAt: null, backupCount: 0, dbSize: 0 };
    if (action === "list") return [];
    return { web: true, unsupported: true };
  }

  // Auto Update — শুধু ডেস্কটপ (Electron) অ্যাপে; ওয়েবে নিষ্ক্রিয়
  if (resource === "updater") {
    if (action === "version") return "web";
    return { web: true, unsupported: true };
  }

  // Kitchen — ওয়েবে সীমিত (Electron-primary)
  if (resource === "meal_profile") {
    if (action === "list") return [];
    if (action === "get") return null;
    if (action === "upsert") return (payload && payload.data) || {};
    return null;
  }
  if (resource === "meal_list") {
    if (action === "generate") return { rows: [], summary: { total: 0, home: 0, paused: 0, sick: 0 }, holiday: null };
    return {};
  }
  // Phase 2 kitchen — custom-action resources (ingredient/dish use generic CRUD below)
  if (resource === "recipe") {
    if (action === "getByDish") return { dish_id: payload, cooking_notes: "", prep_notes: "", special_instruction: "", items: [] };
    if (action === "saveForDish") return (payload && payload.data) || {};
    return null;
  }
  if (resource === "menu") {
    if (action === "list" || action === "templates") return [];
    if (action === "get" || action === "getByDateMeal") return null;
    if (action === "save" || action === "copy") return payload || {};
    if (action === "delete") return { id: payload };
    return null;
  }
  if (resource === "ingredient_calc") {
    if (action === "generate") return { servings: 0, hasMenu: false, menu: null, rows: [], totalCost: 0 };
    return {};
  }
  if (resource === "kitchen_report") {
    if (action === "cost") return { purchaseValue: 0, consumptionValue: 0, wasteValue: 0, currentStockValue: 0 };
    return [];
  }
  // Phase 3 — store / purchase / market / dashboard
  if (resource === "store") {
    if (action === "summary") return { itemCount: 0, lowCount: 0, totalValue: 0, txnCount: 0 };
    if (action === "add") return payload || {};
    if (action === "remove") return { id: payload };
    return []; // balances / low / transactions
  }
  if (resource === "purchase") {
    if (action === "list") return [];
    if (action === "get") return null;
    if (action === "create") return payload || {};
    if (action === "delete") return { id: payload };
    return null;
  }
  if (resource === "market") {
    if (action === "plan") return { rows: [], totalCost: 0, buyCount: 0 };
    return {};
  }
  if (resource === "kitchen_dash") {
    if (action === "overview") return { today: "", tomorrow: "", todayMenus: [], tomorrowMenus: [], low: [], store: { itemCount: 0, lowCount: 0, totalValue: 0, txnCount: 0 }, recentPurchases: [], recentTxns: [], counts: { dishes: 0, ingredients: 0, suppliers: 0, menus: 0 } };
    return {};
  }
  // Phase 4 — meal attendance / approval (guest_meal uses generic CRUD below)
  if (resource === "meal_attendance") {
    if (action === "get") return [];
    return { present: 0, absent: 0, leave: 0, total: 0 }; // save / summary
  }
  if (resource === "meal_approval") {
    return { approval: null, status: "draft", present: 0, absent: 0, leave: 0, guest: 0, total: 0, hasMenu: false, menuTitle: null, consumption: [] };
  }

  // বোর্ডিং বাজার (custom — header + items)
  if (resource === "boarding_bazar") {
    const b = bazarStore;
    const withSub = (items) => (items || []).map((it) => ({ ...it, subtotal: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) }));
    const totalOf = (items) => withSub(items).reduce((sum, i) => sum + i.subtotal, 0);
    const deco = (r) => ({ ...r, item_count: (r.items || []).length, summary: (r.items || []).map((i) => i.item_name).filter(Boolean).join(", ") });
    if (action === "list") return b.rows.slice().reverse().map(deco);
    if (action === "get") return b.rows.find((r) => r.id === payload) || null;
    if (action === "create") {
      const { header = {}, items = [] } = payload || {};
      const row = { id: ++b.seq, ...header, total: totalOf(items), items: withSub(items) };
      b.rows.push(row);
      return deco(row);
    }
    if (action === "update") {
      const { id, data = {} } = payload || {};
      const i = b.rows.findIndex((r) => r.id === id);
      if (i >= 0) b.rows[i] = { id, ...(data.header || {}), total: totalOf(data.items), items: withSub(data.items) };
      return i >= 0 ? deco(b.rows[i]) : null;
    }
    if (action === "delete") {
      const i = b.rows.findIndex((r) => r.id === payload);
      if (i >= 0) b.rows.splice(i, 1);
      return { id: payload };
    }
    return [];
  }

  const s = store(resource);

  switch (action) {
    case "list":
      return s.rows.slice();
    case "get":
      return s.rows.find((r) => r.id === payload) ?? null;
    case "create": {
      const row = { ...payload, id: ++s.seq };
      s.rows.push(row);
      return row;
    }
    case "update": {
      const { id, data } = payload;
      const i = s.rows.findIndex((r) => r.id === id);
      if (i >= 0) s.rows[i] = { ...s.rows[i], ...data, id };
      return i >= 0 ? s.rows[i] : null;
    }
    case "delete": {
      const i = s.rows.findIndex((r) => r.id === payload);
      if (i >= 0) s.rows.splice(i, 1);
      return { id: payload };
    }
    default:
      throw new Error("Unknown channel: " + channel);
  }
}
