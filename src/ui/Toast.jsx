import { useState, useCallback, useRef } from "react";
import { colors, radius, shadow, font, zIndex } from "./theme";
import { ToastCtx } from "./ToastContext";

const TYPES = {
  success: { color: colors.success, icon: "✅" },
  error: { color: colors.danger, icon: "⚠️" },
  info: { color: colors.info, icon: "ℹ️" },
  warning: { color: colors.warning, icon: "🔔" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 180);
  }, []);

  const push = useCallback(
    (message, type = "success", duration = 2800) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration) setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const api = {
    show: push,
    success: (m, d) => push(m, "success", d),
    error: (m, d) => push(m, "error", d),
    info: (m, d) => push(m, "info", d),
    warning: (m, d) => push(m, "warning", d),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        style={{
          position: "fixed", top: 16, right: 16, zIndex: zIndex.toast,
          display: "flex", flexDirection: "column", gap: 10, maxWidth: "92vw",
        }}
      >
        {toasts.map((t) => {
          const cfg = TYPES[t.type] || TYPES.info;
          return (
            <div
              key={t.id}
              className={"uk-toast" + (t.leaving ? " uk-leaving" : "")}
              style={{
                display: "flex", alignItems: "center", gap: 10, minWidth: 260, maxWidth: 400,
                background: colors.surface, borderLeft: `4px solid ${cfg.color}`,
                borderRadius: radius.md, boxShadow: shadow.lg, padding: "12px 14px",
                fontFamily: font.family, fontSize: font.size.base, color: colors.text,
              }}
            >
              <span style={{ fontSize: 16 }}>{cfg.icon}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <span onClick={() => remove(t.id)} style={{ cursor: "pointer", color: colors.textMuted, fontSize: 15 }}>✕</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
