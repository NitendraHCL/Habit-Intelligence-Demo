// Re-export the unified palette from the premium theme
// (Legacy file — kept for backward compatibility with chart renderers)
import { CHART_PALETTE as _CP, STATUS_COLORS, STATUS_BG, T } from "@/lib/ui/theme";

export const CHART_PALETTE = _CP;

export const SEVERITY = {
  good: STATUS_COLORS.good,
  warning: STATUS_COLORS.warning,
  critical: STATUS_COLORS.critical,
  neutral: T.purple,
  info: STATUS_COLORS.info,
} as const;

export const SEVERITY_BG = {
  good: STATUS_BG.good,
  warning: STATUS_BG.warning,
  critical: STATUS_BG.critical,
  neutral: `${T.purple}15`,
  info: STATUS_BG.info,
} as const;

export const AI_THEME = {
  primary: T.amber,
  bg: '#FEF3C7',
  border: '#FCD34D',
} as const;

// Locations are fetched from /api/filters (real facility_master data per client)
export const LOCATIONS = [] as const;

export const SPECIALTIES = [
  'General Physician', 'Cardiology', 'Dermatology', 'ENT',
  'Ophthalmology', 'Dental', 'Physiotherapy', 'Nutrition',
  'Psychology', 'Gynecology', 'Orthopedics', 'Internal Medicine',
] as const;

export const AGE_GROUPS = [
  '<20', '20-35', '36-40', '41-60', '61+',
] as const;

export const GENDERS = ['Male', 'Female', 'Others'] as const;

export type SeverityLevel = keyof typeof SEVERITY;
