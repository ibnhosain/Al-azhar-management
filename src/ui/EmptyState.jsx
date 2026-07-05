import { colors, font } from "./theme";

export default function EmptyState({ icon = "📭", title = "কোনো তথ্য পাওয়া যায়নি", description, action }) {
  return (
    <div style={{ textAlign: "center", padding: "46px 20px", color: colors.textMuted }}>
      <div style={{ fontSize: 42, marginBottom: 10, opacity: 0.85 }}>{icon}</div>
      <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textSoft }}>{title}</div>
      {description && (
        <div style={{ fontSize: font.size.sm, marginTop: 5, maxWidth: 340, margin: "5px auto 0" }}>{description}</div>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
