import { colors, radius, font } from "./theme";

const baseInput = {
  width: "100%", padding: "12px 12px", border: `1px solid ${colors.border}`,
  borderRadius: radius.md, fontSize: font.size.base, fontFamily: font.family,
  color: colors.text, background: "#fff", boxSizing: "border-box", outline: "none",
};

// Floating-label wrapper: value থাকলে/focus করলে label উপরে ভাসে
function Wrapper({ label, required, error, filled, children }) {
  return (
    <div style={{ marginBottom: error ? 6 : 16 }}>
      <div className={"uk-ff" + (filled ? " uk-filled" : "") + (error ? " uk-invalid" : "")}>
        {children}
        {label && (
          <label>
            {label}
            {required && <span style={{ color: colors.danger }}> *</span>}
          </label>
        )}
      </div>
      {error && <div style={{ color: colors.danger, fontSize: font.size.xs, marginTop: 4, marginBottom: 10 }}>{error}</div>}
    </div>
  );
}

export function TextField({ label, value = "", onChange, required, error, type = "text", autoFocus, disabled, ...rest }) {
  return (
    <Wrapper label={label} required={required} error={error} filled={!!String(value ?? "").length}>
      <input
        className={"uk-input" + (error ? " uk-invalid" : "")} type={type} value={value ?? ""}
        onChange={(e) => onChange && onChange(e.target.value)} autoFocus={autoFocus} disabled={disabled}
        placeholder=" " style={baseInput} {...rest}
      />
    </Wrapper>
  );
}

// শুধু সংখ্যা/দশমিক; ঋণাত্মক নয় → auto-total-এ নিরাপদ
export function MoneyField({ label, value = "", onChange, required, error, autoFocus, disabled }) {
  const handle = (v) => onChange && onChange(v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"));
  return (
    <Wrapper label={label} required={required} error={error} filled={!!String(value ?? "").length}>
      <input
        className={"uk-input" + (error ? " uk-invalid" : "")} inputMode="decimal" value={value ?? ""}
        onChange={(e) => handle(e.target.value)} autoFocus={autoFocus} disabled={disabled}
        placeholder=" " style={{ ...baseInput, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
      />
    </Wrapper>
  );
}

export function SelectField({ label, value = "", onChange, required, error, options = [], disabled, autoFocus }) {
  return (
    <Wrapper label={label} required={required} error={error} filled={!!String(value ?? "").length}>
      <select
        className={"uk-input" + (error ? " uk-invalid" : "")} value={value ?? ""} disabled={disabled} autoFocus={autoFocus}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{ ...baseInput, appearance: "none", cursor: "pointer" }}
      >
        <option value="" disabled hidden></option>
        {options.map((o) => {
          const val = typeof o === "object" ? o.value : o;
          const lab = typeof o === "object" ? o.label : o;
          return <option key={val} value={val}>{lab}</option>;
        })}
      </select>
      <span style={{ position: "absolute", right: 12, top: 13, pointerEvents: "none", color: colors.textMuted }}>▾</span>
    </Wrapper>
  );
}

export function TextareaField({ label, value = "", onChange, required, error, rows = 3, disabled }) {
  return (
    <Wrapper label={label} required={required} error={error} filled={!!String(value ?? "").length}>
      <textarea
        className={"uk-input" + (error ? " uk-invalid" : "")} value={value ?? ""} rows={rows} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)} placeholder=" "
        style={{ ...baseInput, resize: "vertical", minHeight: 66 }}
      />
    </Wrapper>
  );
}

export function DateField({ label, value = "", onChange, required, error, disabled }) {
  // date input-এর native placeholder থাকে → label সবসময় ভাসানো
  return (
    <Wrapper label={label} required={required} error={error} filled>
      <input
        className={"uk-input" + (error ? " uk-invalid" : "")} type="date" value={value ?? ""} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)} style={baseInput}
      />
    </Wrapper>
  );
}
