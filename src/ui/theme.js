// ────────────────────────────────────────────────────────────────
//  theme.js — Design Tokens (single source of truth)।
//  বিদ্যমান green theme হুবহু বজায়; শুধু shadow/spacing/type পরিশীলিত।
//  ভবিষ্যতে Dark Mode এখান থেকেই যোগ করা যাবে।
// ────────────────────────────────────────────────────────────────
export const colors = {
  // Brand (green — অপরিবর্তিত)
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primaryLight: "#388E3C",
  primarySoft: "#E8F5E9",
  primaryTint: "#F1F8F2",

  // Text
  text: "#243B40",
  textSoft: "#546E7A",
  textMuted: "#90A4AE",
  textOnPrimary: "#FFFFFF",

  // Surfaces & borders
  bg: "#EEF1F4",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E4E8EB",
  borderSoft: "#EEF1F3",

  // Status
  success: "#2E7D32",
  successSoft: "#E8F5E9",
  danger: "#E53935",
  dangerSoft: "#FDECEA",
  warning: "#F59E0B",
  warningSoft: "#FFF7E6",
  info: "#0288D1",
  infoSoft: "#E3F2FD",

  // Accents (module icons ইত্যাদি)
  cyan: "#00BCD4",
  purple: "#9C27B0",
  pink: "#E91E63",
  orange: "#FB8C00",
  indigo: "#3F51B5",
  brown: "#795548",
};

export const radius = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };

export const shadow = {
  xs: "0 1px 2px rgba(16,24,40,0.05)",
  sm: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)",
  md: "0 4px 12px rgba(16,24,40,0.08)",
  lg: "0 10px 28px rgba(16,24,40,0.12)",
  focus: "0 0 0 3px rgba(46,125,50,0.15)",
};

// space(2) => 8px  (4px ভিত্তিক স্কেল)
export const space = (n) => n * 4;

export const font = {
  family: "'Hind Siliguri','Noto Sans Bengali',system-ui,sans-serif",
  size: { xs: 11, sm: 12, base: 13, md: 14, lg: 16, xl: 18, xxl: 22, display: 26 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
};

export const zIndex = { header: 20, sticky: 30, fab: 100, modal: 500, toast: 700 };

const theme = { colors, radius, shadow, space, font, zIndex };
export default theme;
