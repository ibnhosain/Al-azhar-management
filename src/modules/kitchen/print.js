// ────────────────────────────────────────────────────────────────
//  print.js — রান্নাঘরের পেশাদার প্রিন্ট লেআউট (এক জায়গায়)।
//  compact=true → Kitchen/Compact কপি (ঘন); নাহলে A4 কপি।
//  ব্রাউজারের প্রিন্ট ডায়ালগে "Save as PDF" দিয়ে PDF-ও হয়।
// ────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// headers: [string]; rows: [[cell,...]]; align: optional per-col ("right"/"center")
export function tableHtml(headers, rows, align = []) {
  const th = headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows.map((r) => "<tr>" + r.map((c, i) => `<td style="text-align:${align[i] || "left"}">${esc(c)}</td>`).join("") + "</tr>").join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
}

export function printDoc(title, innerHtml, opts = {}) {
  const compact = !!opts.compact;
  const org = opts.org || "আল-আযহার মাদরাসা";
  const pad = compact ? "10mm" : "16mm";
  const fs = compact ? "11px" : "13px";
  const html = `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Noto Sans Bengali','Hind Siliguri','SolaimanLipi',sans-serif;padding:${pad};color:#152615;margin:0}
    .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #2E7D32;padding-bottom:8px;margin-bottom:${compact ? "10px" : "16px"}}
    .brand{font-weight:700;color:#2E7D32;font-size:${compact ? "15px" : "18px"}}
    h1{font-size:${compact ? "15px" : "19px"};margin:0}
    .meta{color:#5a6b5a;font-size:${compact ? "10px" : "12px"};margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:${fs};margin-top:6px}
    th,td{border:1px solid #b9c9b9;padding:${compact ? "4px 6px" : "7px 9px"}}
    th{background:#E8F5E9;color:#1b5e20;text-align:left}
    tr:nth-child(even) td{background:#f6faf6}
    .tot td{font-weight:700;background:#eef7ee}
    .foot{margin-top:14px;color:#6a7a6a;font-size:11px;display:flex;justify-content:space-between}
    @media print{ .noprint{display:none} @page{margin:0} }
  </style></head><body onload="setTimeout(()=>window.print(),120)">
    <div class="head"><div><div class="brand">🍳 ${esc(org)}</div><div class="meta">রান্নাঘর ও মিল ব্যবস্থাপনা</div></div>
      <div style="text-align:right"><h1>${esc(title)}</h1><div class="meta">${esc(opts.subtitle || "")}</div></div></div>
    ${innerHtml}
    <div class="foot"><span>মুদ্রণ: ${new Date().toLocaleString("bn-BD")}</span><span>Madrasa Management ERP</span></div>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html); w.document.close(); w.focus();
  return true;
}
