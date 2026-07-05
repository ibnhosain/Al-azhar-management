import { useEffect } from "react";
import { colors, radius, shadow, font, zIndex } from "./theme";

export default function Modal({ title, icon, onClose, children, footer, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="uk-overlay"
      onMouseDown={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,26,0.45)", zIndex: zIndex.modal,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        className="uk-modal uk-scroll"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: colors.surface, borderRadius: radius.lg, boxShadow: shadow.lg,
          width, maxWidth: "96vw", maxHeight: "88vh", overflowY: "auto", fontFamily: font.family,
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            padding: "15px 20px", borderBottom: `1px solid ${colors.borderSoft}`,
            position: "sticky", top: 0, background: colors.surface, zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: font.weight.bold, fontSize: font.size.lg, color: colors.text }}>
            {icon && <span>{icon}</span>}
            {title}
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", color: colors.textMuted, fontSize: 20, lineHeight: 1 }}>✕</span>
        </div>

        <div style={{ padding: 20 }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: "14px 20px", borderTop: `1px solid ${colors.borderSoft}`,
              display: "flex", justifyContent: "flex-end", gap: 10,
              position: "sticky", bottom: 0, background: colors.surface,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
