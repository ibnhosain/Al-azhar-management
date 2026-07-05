import { useMemo, useState, useRef, useEffect } from "react";
import { colors, radius, shadow, font } from "./theme";
import Button from "./Button";
import { TableSkeleton } from "./Skeleton";
import EmptyState from "./EmptyState";

const thStyle = {
  padding: "11px 14px", textAlign: "left", color: colors.textSoft,
  fontWeight: font.weight.semibold, fontSize: font.size.sm,
  borderBottom: `1px solid ${colors.border}`, whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "11px 14px", color: colors.text, fontSize: font.size.base,
  borderBottom: `1px solid ${colors.borderSoft}`, verticalAlign: "middle",
};

const toBn = (n) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

function cellText(col, row) {
  if (col.exportValue) return String(col.exportValue(row) ?? "");
  const v = row[col.key];
  return v == null ? "" : String(v);
}

function pageNumbers(cur, count) {
  const out = [];
  if (count <= 7) { for (let i = 1; i <= count; i++) out.push(i); return out; }
  out.push(1);
  if (cur > 3) out.push("…");
  for (let i = Math.max(2, cur - 1); i <= Math.min(count - 1, cur + 1); i++) out.push(i);
  if (cur < count - 2) out.push("…");
  out.push(count);
  return out;
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button
      onClick={onClick} disabled={disabled} className="uk-btn"
      style={{
        height: 32, padding: "0 10px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
        border: `1px solid ${colors.border}`, background: "#fff", color: colors.textSoft,
        fontFamily: font.family, fontSize: font.size.sm, opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function DataTable({
  columns, rows = [], loading = false, rowKey,
  searchable = true, searchPlaceholder = "খুঁজুন...",
  pagination = true, pageSize: initialPageSize = 10, pageSizeOptions = [10, 25, 50, 100],
  exportName = "data", enableExport = true, columnToggle = true,
  title, actions, onRowClick, empty,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hidden, setHidden] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => { setPage(1); }, [query, pageSize]);

  const visibleCols = columns.filter((c) => !hidden[c.key]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) => columns.some((c) => cellText(c, row).toLowerCase().includes(q)));
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    return [...filtered].sort((a, b) => {
      const av = col && col.sortValue ? col.sortValue(a) : a[sort.key];
      const bv = col && col.sortValue ? col.sortValue(b) : b[sort.key];
      const an = parseFloat(String(av).replace(/[^\d.-]/g, ""));
      const bn = parseFloat(String(bv).replace(/[^\d.-]/g, ""));
      if (!isNaN(an) && !isNaN(bn) && /\d/.test(String(av)) && /\d/.test(String(bv))) return (an - bn) * sort.dir;
      return String(av ?? "").localeCompare(String(bv ?? ""), "bn") * sort.dir;
    });
  }, [filtered, sort, columns]);

  const total = sorted.length;
  const pageCount = pagination ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const curPage = Math.min(page, pageCount);
  const start = pagination ? (curPage - 1) * pageSize : 0;
  const pageRows = pagination ? sorted.slice(start, start + pageSize) : sorted;

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));
  const keyOf = (row, i) => (rowKey ? (typeof rowKey === "function" ? rowKey(row) : row[rowKey]) : row.id ?? i);

  // ── Export ──
  const matrix = () => {
    const cols = visibleCols.filter((c) => c.key !== "__actions");
    return { head: cols.map((c) => c.label), body: sorted.map((row) => cols.map((c) => cellText(c, row))) };
  };
  const doCopy = async () => {
    const { head, body } = matrix();
    const tsv = [head.join("\t"), ...body.map((r) => r.join("\t"))].join("\n");
    try { await navigator.clipboard.writeText(tsv); } catch { /* ignore */ }
  };
  const doExcel = () => {
    const { head, body } = matrix();
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = "﻿" + [head.map(esc).join(","), ...body.map((r) => r.map(esc).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${exportName}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const doPrint = () => {
    const { head, body } = matrix();
    const w = window.open("", "_blank");
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${exportName}</title>` +
      `<style>@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');` +
      `*{font-family:'Hind Siliguri',sans-serif}body{padding:20px;color:#243B40}h3{margin:0 0 12px}` +
      `table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:7px 9px;text-align:left}` +
      `thead{background:#E8F5E9}@media print{.np{display:none}}</style></head><body>` +
      `<h3>${title || exportName}</h3><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>` +
      `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>` +
      `<div class="np" style="margin-top:16px;text-align:center"><button onclick="window.print()" ` +
      `style="background:#2E7D32;color:#fff;border:none;padding:9px 22px;border-radius:8px;cursor:pointer;font-family:inherit">🖨️ প্রিন্ট</button></div>` +
      `</body></html>`
    );
    w.document.close();
  };

  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${colors.borderSoft}`, flexWrap: "wrap" }}>
        {title && <div style={{ fontWeight: font.weight.semibold, color: colors.text, fontSize: font.size.md }}>{title}</div>}
        {pagination && (
          <select
            value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="uk-input"
            style={{ padding: "6px 8px", borderRadius: radius.sm, border: `1px solid ${colors.border}`, fontSize: font.size.sm, cursor: "pointer", fontFamily: font.family }}
          >
            {pageSizeOptions.map((n) => <option key={n} value={n}>{toBn(n)} / পৃষ্ঠা</option>)}
          </select>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {enableExport && (
            <>
              <Button size="sm" variant="secondary" onClick={doCopy}>⧉ কপি</Button>
              <Button size="sm" variant="secondary" onClick={doExcel}>⤓ Excel</Button>
              <Button size="sm" variant="secondary" onClick={doPrint}>🖨 প্রিন্ট</Button>
            </>
          )}
          {columnToggle && (
            <div ref={menuRef} style={{ position: "relative" }}>
              <Button size="sm" variant="secondary" onClick={() => setMenuOpen((o) => !o)}>▤ কলাম</Button>
              {menuOpen && (
                <div
                  className="uk-scroll"
                  style={{
                    position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff",
                    border: `1px solid ${colors.border}`, borderRadius: radius.md, boxShadow: shadow.lg,
                    padding: 6, zIndex: 40, minWidth: 180, maxHeight: 260, overflowY: "auto",
                  }}
                >
                  {columns.filter((c) => c.key !== "__actions").map((c) => (
                    <label key={c.key} className="uk-menu-item" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, cursor: "pointer", fontSize: font.size.sm, color: colors.text }}>
                      <input type="checkbox" checked={!hidden[c.key]} onChange={() => setHidden((h) => ({ ...h, [c.key]: !h[c.key] }))} />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {actions}
          {searchable && (
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className="uk-input"
              style={{ padding: "7px 12px", border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: font.size.sm, width: 200, fontFamily: font.family }}
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="uk-scroll" style={{ overflowX: "auto", maxHeight: "62vh", overflowY: "auto" }}>
        {loading ? (
          <TableSkeleton rows={pageSize > 8 ? 8 : pageSize} cols={visibleCols.length} />
        ) : (
          <table className="uk-table">
            <thead>
              <tr>
                {visibleCols.map((c) => (
                  <th
                    key={c.key} className={c.sortable ? "uk-sort" : undefined}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                    style={{ ...thStyle, textAlign: c.align || "left", width: c.width }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {c.label}
                      {c.sortable && (
                        <span style={{ opacity: sort.key === c.key ? 1 : 0.3, fontSize: 10 }}>
                          {sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "↕"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length} style={{ padding: 0 }}>
                    <EmptyState {...(empty || {})} />
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr key={keyOf(row, i)} onClick={onRowClick ? () => onRowClick(row) : undefined} style={{ cursor: onRowClick ? "pointer" : "default" }}>
                    {visibleCols.map((c) => (
                      <td key={c.key} style={{ ...tdStyle, textAlign: c.align || "left" }}>
                        {c.render ? c.render(row, start + i) : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / pagination */}
      {pagination && !loading && total > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderTop: `1px solid ${colors.borderSoft}`, flexWrap: "wrap" }}>
          <div style={{ fontSize: font.size.sm, color: colors.textSoft }}>
            {toBn(total)} টির মধ্যে {toBn(start + 1)}–{toBn(Math.min(start + pageSize, total))} দেখানো হচ্ছে
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <PageBtn disabled={curPage === 1} onClick={() => setPage(1)}>« প্রথম</PageBtn>
            <PageBtn disabled={curPage === 1} onClick={() => setPage(curPage - 1)}>‹</PageBtn>
            {pageNumbers(curPage, pageCount).map((p, idx) =>
              p === "…" ? (
                <span key={"e" + idx} style={{ padding: "0 6px", color: colors.textMuted }}>…</span>
              ) : (
                <button
                  key={p} onClick={() => setPage(p)} className="uk-btn"
                  style={{
                    minWidth: 32, height: 32, borderRadius: 8, cursor: "pointer", fontFamily: font.family, fontSize: font.size.sm,
                    border: `1px solid ${p === curPage ? colors.primary : colors.border}`,
                    background: p === curPage ? colors.primary : "#fff", color: p === curPage ? "#fff" : colors.textSoft, fontWeight: 600,
                  }}
                >
                  {toBn(p)}
                </button>
              )
            )}
            <PageBtn disabled={curPage === pageCount} onClick={() => setPage(curPage + 1)}>›</PageBtn>
            <PageBtn disabled={curPage === pageCount} onClick={() => setPage(pageCount)}>শেষ »</PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}
