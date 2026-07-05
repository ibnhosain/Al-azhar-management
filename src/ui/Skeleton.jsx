export function Skeleton({ width = "100%", height = 14, radius = 6, style }) {
  return <span className="uk-skeleton" style={{ display: "block", width, height, borderRadius: radius, ...style }} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div style={{ padding: "4px 2px" }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: 14, padding: "12px 8px", borderBottom: "1px solid #F0F2F3" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={12} width={c === 0 ? 36 : `${Math.floor(90 / cols)}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}
