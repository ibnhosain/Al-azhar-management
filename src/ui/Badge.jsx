import { font } from "./theme";

export default function Badge({ children, color = "#2E7D32", soft = true, dot = false, style }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: soft ? color + "1A" : color, color: soft ? color : "#fff",
        padding: "3px 10px", borderRadius: 999, fontSize: font.size.xs,
        fontWeight: font.weight.semibold, lineHeight: 1.7, whiteSpace: "nowrap", ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
      {children}
    </span>
  );
}
