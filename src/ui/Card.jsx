import { colors, radius, shadow } from "./theme";

export default function Card({ children, pad = 20, hover = false, style, ...rest }) {
  return (
    <div
      className={hover ? "uk-card-hover" : undefined}
      style={{
        background: colors.surface, border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.lg, boxShadow: shadow.sm, padding: pad, ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
