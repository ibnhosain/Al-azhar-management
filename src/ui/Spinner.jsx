export default function Spinner({ size = 16, color = "#2E7D32", thickness = 2 }) {
  return (
    <span
      className="uk-spin"
      style={{
        display: "inline-block", width: size, height: size, borderRadius: "50%",
        border: `${thickness}px solid ${color}33`, borderTopColor: color, flexShrink: 0,
      }}
    />
  );
}
