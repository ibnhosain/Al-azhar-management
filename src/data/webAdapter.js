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
