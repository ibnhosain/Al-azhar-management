import { useState, useRef, useEffect } from "react";
import { colors, radius, font } from "./theme";

// IME-নিরাপদ ইনপুট: অভ্র/বিজয়/ইউনিকোড বাংলা কীবোর্ডে টাইপ করার সময়
// composition (যুক্তাক্ষর গঠন) ভেঙে যায় না। composition চলাকালীন controlled value
// ফেরত চাপিয়ে দিই না; composition শেষ হলে upstream-এ পাঠাই।
function useImeInput(value, onChange) {
  const [inner, setInner] = useState(value ?? "");
  const composing = useRef(false);
  useEffect(() => { if (!composing.current) setInner(value ?? ""); }, [value]);
  return {
    value: inner,
    onChange: (e) => { const v = e.target.value; setInner(v); if (!composing.current && onChange) onChange(v); },
    onCompositionStart: () => { composing.current = true; },
    onCompositionEnd: (e) => { composing.current = false; const v = e.target.value; setInner(v); if (onChange) onChange(v); },
  };
}

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
  const ime = useImeInput(value, onChange);
  return (
    <Wrapper label={label} required={required} error={error} filled={!!String(ime.value ?? "").length}>
      <input
        className={"uk-input" + (error ? " uk-invalid" : "")} type={type}
        {...ime} autoFocus={autoFocus} disabled={disabled}
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
  const ime = useImeInput(value, onChange);
  return (
    <Wrapper label={label} required={required} error={error} filled={!!String(ime.value ?? "").length}>
      <textarea
        className={"uk-input" + (error ? " uk-invalid" : "")} rows={rows} disabled={disabled}
        {...ime} placeholder=" "
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
