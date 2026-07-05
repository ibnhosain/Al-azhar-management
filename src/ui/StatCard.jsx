import { colors, radius, shadow, font } from "./theme";

export function StatCard({ icon, label, value, color = colors.primary, hint }) {
  return (
    <div
      style={{
        background: colors.surface, border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.lg, boxShadow: shadow.xs, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 13,
      }}
    >
      <div
        style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: color + "14",
          color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: font.size.xxl, fontWeight: font.weight.bold, color: colors.text,
            lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: font.size.sm, color: colors.textSoft, marginTop: 2 }}>{label}</div>
        {hint && <div style={{ fontSize: font.size.xs, color: colors.textMuted, marginTop: 1 }}>{hint}</div>}
      </div>
    </div>
  );
}

export function StatRow({ children, min = 190 }) {
  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))`,
        gap: 12, marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}
