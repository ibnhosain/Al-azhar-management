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
