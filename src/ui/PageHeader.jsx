import { colors, radius, shadow, font } from "./theme";

// Compact ERP header: back · icon · breadcrumb · title · description · actions — এক লাইনে
export default function PageHeader({ icon, title, breadcrumb = [], description, actions, onBack }) {
  return (
    <div
      style={{
        background: `linear-gradient(100deg, ${colors.primaryDark}, ${colors.primary})`,
        borderRadius: radius.lg, boxShadow: shadow.sm, color: "#fff",
        padding: "13px 18px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}
    >
      {onBack && (
        <button
          className="uk-btn"
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: radius.md, padding: "7px 12px", cursor: "pointer",
            fontFamily: font.family, fontSize: font.size.sm, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ← ফিরে যান
        </button>
      )}

      {icon && (
        <div
          style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}
        >
          {icon}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 200 }}>
        {breadcrumb.length > 0 && (
          <div style={{ fontSize: font.size.xs, opacity: 0.85, marginBottom: 3, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {breadcrumb.map((b, i) => (
              <span key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {i > 0 && <span style={{ opacity: 0.6 }}>›</span>}
                <span onClick={b.onClick} style={{ cursor: b.onClick ? "pointer" : "default", textDecoration: b.onClick ? "none" : "none" }}>
                  {b.label}
                </span>
              </span>
            ))}
          </div>
        )}
        <div style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, lineHeight: 1.2 }}>{title}</div>
        {description && <div style={{ fontSize: font.size.sm, opacity: 0.9, marginTop: 2 }}>{description}</div>}
      </div>

      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}
