import { colors, radius, font } from "./theme";
import Spinner from "./Spinner";

const VARIANTS = {
  primary:   { bg: colors.primary, color: "#fff", border: colors.primary },
  secondary: { bg: "#fff", color: colors.text, border: colors.border },
  danger:    { bg: colors.danger, color: "#fff", border: colors.danger },
  dangerSoft:{ bg: colors.dangerSoft, color: colors.danger, border: "transparent" },
  subtle:    { bg: colors.primarySoft, color: colors.primaryDark, border: "transparent" },
  ghost:     { bg: "transparent", color: colors.textSoft, border: "transparent" },
};

const SIZES = {
  sm: { padding: "6px 12px", fontSize: font.size.sm, height: 32 },
  md: { padding: "9px 18px", fontSize: font.size.base, height: 38 },
  lg: { padding: "11px 22px", fontSize: font.size.md, height: 44 },
};

export default function Button({
  children, variant = "primary", size = "md", icon, iconRight,
  loading = false, disabled = false, block = false, style, ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      className="uk-btn"
      disabled={disabled || loading}
      style={{
        display: block ? "flex" : "inline-flex", width: block ? "100%" : undefined,
        alignItems: "center", justifyContent: "center", gap: 7,
        background: v.bg, color: v.color, border: `1px solid ${v.border}`,
        borderRadius: radius.md, cursor: "pointer", fontFamily: font.family,
        fontWeight: font.weight.semibold, whiteSpace: "nowrap", ...s, ...style,
      }}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 13 : 15} color={v.color} /> : icon}
      {children}
      {iconRight}
    </button>
  );
}
