/**
 * Premium Design System — Single source of truth for the dashboard.
 * Every page imports from here instead of defining local tokens.
 */

// ─── Core Design Tokens ───────────────────────────────────────────────────────
export const T = {
  // Backgrounds
  pageBg:        "#F5F6FA",
  warmBg:        "#f3f1ee",
  warmBorder:    "#F0EBE4",
  white:         "#FFFFFF",

  // Typography (WCAG AAA)
  textPrimary:   "#111827",
  textSecondary: "#4B5563",
  textMuted:     "#9CA3AF",

  // Borders
  border:        "#E5E7EB",
  borderLight:   "#F3F4F6",

  // Card styling
  cardShadow:      "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
  cardShadowHover: "0 4px 12px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.10)",
  cardRadius:      20,

  // Brand accent palette
  coral:       "#F06050",
  coralLight:  "#FEF0EE",
  teal:        "#0AB59E",
  tealLight:   "#EEFBF8",
  blue:        "#1E4088",
  blueLight:   "#EEF3FF",
  purple:      "#3B82F6",
  purpleLight: "#EFF6FF",
  deepPurple:  "#5B4A9E",
  midPurple:   "#8B7BBF",
  lightPurple: "#B8ADE0",
  amber:       "#F5A623",
  amberLight:  "#FFF8ED",
  green:       "#22C55E",
  greenLight:  "#F0FDF4",
  indigo:      "#6366F1",
  indigoLight: "#EEF2FF",
};

// ─── Unified Chart Palette (indigo / teal / violet family) ──────────────────
export const CHART_PALETTE = [
  "#4f46e5", // Indigo
  "#0d9488", // Teal
  "#6366f1", // Indigo-medium
  "#14b8a6", // Teal-light
  "#7c3aed", // Violet-deep
  "#8b5cf6", // Violet-medium
  "#a78bfa", // Violet-light
  "#818cf8", // Indigo-light
  "#06b6d4", // Cyan
  "#34d399", // Emerald
];

// Extended for treemaps / pages with >10 categories
export const CHART_PALETTE_EXTENDED = [
  "#3730a3", // Indigo-darkest
  "#4f46e5", // Indigo
  "#6366f1", // Indigo-medium
  "#818cf8", // Indigo-light
  "#a5b4fc", // Indigo-pale
  "#c7d2fe", // Indigo-lightest
  "#0f766e", // Teal-dark
  "#0d9488", // Teal
  "#14b8a6", // Teal-medium
  "#2dd4bf", // Teal-light
  "#5eead4", // Teal-pale
  "#4338ca", // Violet-dark
  "#7c3aed", // Violet-deep
  "#8b5cf6", // Violet-medium
  "#a78bfa", // Violet-light
  "#c4b5fd", // Violet-pale
  "#0891b2", // Cyan-dark
  "#06b6d4", // Cyan
  "#67e8f9", // Cyan-light
  "#34d399", // Emerald
  "#a1a1aa", // Neutral
];

// ─── Semantic Color Mappings ──────────────────────────────────────────────────

export const GENDER_COLORS: Record<string, string> = {
  Male: "#0d9488",    Female: "#a78bfa",   Other: "#a1a1aa",
  M: "#0d9488",       F: "#a78bfa",        O: "#a1a1aa",
  MALE: "#0d9488",    FEMALE: "#a78bfa",
};

export const AGE_GROUP_COLORS: Record<string, string> = {
  "18-25": "#818cf8",  "<=25": "#818cf8",
  "26-35": "#0d9488",
  "36-44": "#6366f1",  "36-45": "#6366f1",
  "45-59": "#a78bfa",  "46-60": "#a78bfa",
  "60+":   "#4f46e5",
};

// Heatmap gradient — indigo-tinted for brand consistency
export const HEATMAP_GRADIENT = [
  "#F0F4FF", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8",
  "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81",
];

// Status / severity
export const STATUS_COLORS = {
  good:     "#22C55E",
  warning:  "#F5A623",
  critical: "#F06050",
  neutral:  "#9399AB",
  info:     "#3B82F6",
} as const;

export const STATUS_BG = {
  good:     "#22C55E15",
  warning:  "#F5A62315",
  critical: "#F0605015",
  neutral:  "#9399AB15",
  info:     "#3B82F615",
} as const;
