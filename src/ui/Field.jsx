import { useState, useRef, useEffect } from "react";
import { colors, radius, font } from "./theme";

const baseInput = {
  width: "100%", padding: "11px 12px", border: `1px solid ${colors.border}`,
  borderRadius: radius.md, fontSize: font.size.base, fontFamily: font.family,
  color: colors.text, background: "#fff", boxSizing: "border-box", outline: "none",
  lineHeight: 1.6,   // বাংলা যুক্তাক্ষর/মাত্রার জন্য পর্যাপ্ত উচ্চতা
};

// IME-নিরাপদ ইনপুট: অভ্র/বিজয়/ইউনিকোড বাংলা কীবোর্ডে composition ভাঙে না।
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

// লেবেল ইনপুটের উপরে (static) — floating নয় → বাংলার সাথে সংঘর্ষ হয় না।
function Wrapper({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: error ? 6 : 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: error ? colors.danger : "#5a6a72", marginBottom: 5 }}>
          {label}{required && <span style={{ color: colors.danger }}> *</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>{children}</div>
      {error && <div style={{ color: colors.danger, fontSize: font.size.xs, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export function TextField({ label, value = "", onChange, required, error, type = "text", autoFocus, disabled, ...rest }) {
  const ime = useImeInput(value, onChange);
  return (
    <Wrapper label={label} required={required} error={error}>
      <input
        className={"uk-input" + (error ? " uk-invalid" : "")} type={type}
        {...ime} autoFocus={autoFocus} disabled={disabled} style={baseInput} {...rest}
      />
    </Wrapper>
  );
}

// শুধু সংখ্যা/দশমিক; ঋণাত্মক নয় → auto-total-এ নিরাপদ
export function MoneyField({ label, value = "", onChange, required, error, autoFocus, disabled }) {
  const handle = (v) => onChange && onChange(v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"));
  return (
    <Wrapper label={label} required={required} error={error}>
      <input
        className={"uk-input" + (error ? " uk-invalid" : "")} inputMode="decimal" value={value ?? ""}
        onChange={(e) => handle(e.target.value)} autoFocus={autoFocus} disabled={disabled}
        style={{ ...baseInput, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
      />
    </Wrapper>
  );
}

export function SelectField({ label, value = "", onChange, required, error, options = [], disabled, autoFocus }) {
  const hasEmpty = options.some((o) => (typeof o === "object" ? o.value : o) === "");
  return (
    <Wrapper label={label} required={required} error={error}>
      <select
        className={"uk-input" + (error ? " uk-invalid" : "")} value={value ?? ""} disabled={disabled} autoFocus={autoFocus}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{ ...baseInput, appearance: "none", cursor: "pointer", paddingRight: 30 }}
      >
        {!hasEmpty && <option value="">—</option>}
        {options.map((o) => {
          const val = typeof o === "object" ? o.value : o;
          const lab = typeof o === "object" ? o.label : o;
          return <option key={val} value={val}>{lab}</option>;
        })}
      </select>
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: colors.textMuted }}>▾</span>
    </Wrapper>
  );
}

export function TextareaField({ label, value = "", onChange, required, error, rows = 3, disabled }) {
  const ime = useImeInput(value, onChange);
  return (
    <Wrapper label={label} required={required} error={error}>
      <textarea
        className={"uk-input" + (error ? " uk-invalid" : "")} rows={rows} disabled={disabled}
        {...ime} style={{ ...baseInput, resize: "vertical", minHeight: 66 }}
      />
    </Wrapper>
  );
}

export function DateField({ label, value = "", onChange, required, error, disabled }) {
  return (
    <Wrapper label={label} required={required} error={error}>
      <input
        className={"uk-input" + (error ? " uk-invalid" : "")} type="date" value={value ?? ""} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)} style={baseInput}
      />
    </Wrapper>
  );
}
