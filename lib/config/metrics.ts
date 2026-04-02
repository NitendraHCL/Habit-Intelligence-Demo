// ── Metric & Chart Definitions ──
// Previously split across metric_definitions + metric_placements DB tables.
// Now type-safe, version-controlled, and zero API calls needed.

export type ChartType =
  | "KPI"
  | "BAR"
  | "STACKED_BAR"
  | "LINE"
  | "AREA"
  | "PIE"
  | "TREEMAP"
  | "HEATMAP"
  | "RADAR"
  | "BUBBLE"
  | "SANKEY"
  | "TABLE"
  | "SUNBURST";

export type MetricCategory = "OHC" | "AHC" | "NPS" | "LSMP" | "ENGAGEMENT" | "EMOTIONAL_WELLBEING";

export interface MetricDefinition {
  metricKey: string;
  name: string;
  description: string;
  category: MetricCategory;
  chartType: ChartType;
  derivedTable: string;
  unit: string;
  whyItMatters: string;
  supportedFilters: string[];
}

export interface MetricPlacement {
  metricKey: string;
  pageSlug: string;
  section: "kpi_row" | "chart_grid";
  sortOrder: number;
  colSpan: number;
}

// ── Metric Catalog ──

export const metrics: Record<string, MetricDefinition> = {
  // OHC Utilization KPIs
  ohc_total_consults: {
    metricKey: "ohc_total_consults",
    name: "Total Consultations",
    description: "Total completed OHC consultations in the selected period",
    category: "OHC",
    chartType: "KPI",
    derivedTable: "dv_monthly_consult_summary",
    unit: "count",
    whyItMatters: "Shows overall OHC utilization and demand",
    supportedFilters: ["date_range", "facility", "specialty"],
  },
  ohc_unique_patients: {
    metricKey: "ohc_unique_patients",
    name: "Unique Patients",
    description: "Number of distinct patients who visited OHC",
    category: "OHC",
    chartType: "KPI",
    derivedTable: "dv_monthly_consult_summary",
    unit: "count",
    whyItMatters: "Indicates reach and penetration of OHC services",
    supportedFilters: ["date_range", "facility"],
  },
  ohc_repeat_rate: {
    metricKey: "ohc_repeat_rate",
    name: "Repeat Visit Rate",
    description: "Percentage of patients with multiple visits in a month",
    category: "OHC",
    chartType: "KPI",
    derivedTable: "dv_repeat_visit_analysis",
    unit: "%",
    whyItMatters: "High repeat rates may indicate chronic conditions or inadequate first-visit resolution",
    supportedFilters: ["date_range"],
  },

  // OHC Utilization Charts
  ohc_visit_trends: {
    metricKey: "ohc_visit_trends",
    name: "Visit Trends",
    description: "Monthly consultation volume over time",
    category: "OHC",
    chartType: "LINE",
    derivedTable: "dv_monthly_consult_summary",
    unit: "count",
    whyItMatters: "Reveals seasonal patterns and capacity planning needs",
    supportedFilters: ["date_range", "facility", "specialty"],
  },
  ohc_specialty_treemap: {
    metricKey: "ohc_specialty_treemap",
    name: "Visits by Specialty",
    description: "Distribution of consultations across medical specialties",
    category: "OHC",
    chartType: "TREEMAP",
    derivedTable: "dv_monthly_consult_summary",
    unit: "count",
    whyItMatters: "Shows which specialties are most utilized",
    supportedFilters: ["date_range", "facility"],
  },
  ohc_location_bar: {
    metricKey: "ohc_location_bar",
    name: "Clinic Utilization by Location",
    description: "Consultation volume by facility and specialty",
    category: "OHC",
    chartType: "STACKED_BAR",
    derivedTable: "dv_monthly_consult_summary",
    unit: "count",
    whyItMatters: "Identifies high/low performing locations",
    supportedFilters: ["date_range", "specialty"],
  },
  ohc_demographic_sunburst: {
    metricKey: "ohc_demographic_sunburst",
    name: "Demographic Breakdown",
    description: "Age and gender distribution of OHC patients",
    category: "OHC",
    chartType: "BAR",
    derivedTable: "dv_demographic_consult",
    unit: "count",
    whyItMatters: "Helps tailor health programs to demographic needs",
    supportedFilters: ["date_range", "facility"],
  },
  ohc_peak_hours: {
    metricKey: "ohc_peak_hours",
    name: "Peak Consultation Hours",
    description: "Heatmap of consultation volume by day and hour",
    category: "OHC",
    chartType: "HEATMAP",
    derivedTable: "dv_daily_consult_summary",
    unit: "count",
    whyItMatters: "Optimizes staffing and scheduling",
    supportedFilters: ["date_range", "facility"],
  },
  ohc_status_pie: {
    metricKey: "ohc_status_pie",
    name: "Appointment Status",
    description: "Breakdown of appointment outcomes",
    category: "OHC",
    chartType: "PIE",
    derivedTable: "dv_monthly_consult_summary",
    unit: "count",
    whyItMatters: "Shows no-show and cancellation rates",
    supportedFilters: ["date_range", "facility"],
  },

  // Referral Metrics
  ref_total_referrals: {
    metricKey: "ref_total_referrals",
    name: "Total Referrals",
    description: "Total referrals generated from OHC",
    category: "OHC",
    chartType: "KPI",
    derivedTable: "dv_referral_summary",
    unit: "count",
    whyItMatters: "Measures care continuity and specialist utilization",
    supportedFilters: ["date_range"],
  },
  ref_referral_trends: {
    metricKey: "ref_referral_trends",
    name: "Referral Trends",
    description: "Monthly referral volume over time",
    category: "OHC",
    chartType: "AREA",
    derivedTable: "dv_referral_summary",
    unit: "count",
    whyItMatters: "Reveals referral pattern changes",
    supportedFilters: ["date_range"],
  },
  ref_specialty_flow: {
    metricKey: "ref_specialty_flow",
    name: "Referral Specialty Flow",
    description: "Which specialties refer to which",
    category: "OHC",
    chartType: "TABLE",
    derivedTable: "dv_referral_summary",
    unit: "count",
    whyItMatters: "Identifies common referral pathways",
    supportedFilters: ["date_range"],
  },

  // Health Insights
  hi_disease_treemap: {
    metricKey: "hi_disease_treemap",
    name: "Disease Distribution",
    description: "Top diagnoses across the population",
    category: "OHC",
    chartType: "TREEMAP",
    derivedTable: "dv_diagnosis_summary",
    unit: "count",
    whyItMatters: "Identifies prevalent conditions for targeted interventions",
    supportedFilters: ["date_range", "specialty"],
  },
  hi_disease_trends: {
    metricKey: "hi_disease_trends",
    name: "Disease Trends",
    description: "Top diagnosis trends over time",
    category: "OHC",
    chartType: "LINE",
    derivedTable: "dv_diagnosis_summary",
    unit: "count",
    whyItMatters: "Tracks emerging health issues",
    supportedFilters: ["date_range", "specialty"],
  },
  hi_vitals_distribution: {
    metricKey: "hi_vitals_distribution",
    name: "Vitals Distribution",
    description: "Distribution of vital readings (BP, BMI, etc.)",
    category: "OHC",
    chartType: "BAR",
    derivedTable: "dv_vitals_summary",
    unit: "count",
    whyItMatters: "Highlights population health risk areas",
    supportedFilters: ["date_range"],
  },
};

// ── Page Layouts (which metrics go where) ──

export const placements: MetricPlacement[] = [
  // OHC Utilization page
  { metricKey: "ohc_total_consults", pageSlug: "ohc-utilization", section: "kpi_row", sortOrder: 1, colSpan: 1 },
  { metricKey: "ohc_unique_patients", pageSlug: "ohc-utilization", section: "kpi_row", sortOrder: 2, colSpan: 1 },
  { metricKey: "ohc_repeat_rate", pageSlug: "ohc-utilization", section: "kpi_row", sortOrder: 3, colSpan: 1 },
  { metricKey: "ohc_visit_trends", pageSlug: "ohc-utilization", section: "chart_grid", sortOrder: 1, colSpan: 4 },
  { metricKey: "ohc_specialty_treemap", pageSlug: "ohc-utilization", section: "chart_grid", sortOrder: 2, colSpan: 2 },
  { metricKey: "ohc_location_bar", pageSlug: "ohc-utilization", section: "chart_grid", sortOrder: 3, colSpan: 2 },
  { metricKey: "ohc_demographic_sunburst", pageSlug: "ohc-utilization", section: "chart_grid", sortOrder: 4, colSpan: 2 },
  { metricKey: "ohc_peak_hours", pageSlug: "ohc-utilization", section: "chart_grid", sortOrder: 5, colSpan: 2 },
  { metricKey: "ohc_status_pie", pageSlug: "ohc-utilization", section: "chart_grid", sortOrder: 6, colSpan: 2 },

  // OHC Referral page
  { metricKey: "ref_total_referrals", pageSlug: "ohc-referral", section: "kpi_row", sortOrder: 1, colSpan: 1 },
  { metricKey: "ref_referral_trends", pageSlug: "ohc-referral", section: "chart_grid", sortOrder: 1, colSpan: 4 },
  { metricKey: "ref_specialty_flow", pageSlug: "ohc-referral", section: "chart_grid", sortOrder: 2, colSpan: 4 },

  // Health Insights page
  { metricKey: "hi_disease_treemap", pageSlug: "ohc-health-insights", section: "chart_grid", sortOrder: 1, colSpan: 2 },
  { metricKey: "hi_disease_trends", pageSlug: "ohc-health-insights", section: "chart_grid", sortOrder: 2, colSpan: 2 },
  { metricKey: "hi_vitals_distribution", pageSlug: "ohc-health-insights", section: "chart_grid", sortOrder: 3, colSpan: 4 },
];

// ── Helpers ──

export function getMetric(key: string): MetricDefinition | undefined {
  return metrics[key];
}

export function getPlacementsForPage(pageSlug: string): (MetricPlacement & { metric: MetricDefinition })[] {
  return placements
    .filter((p) => p.pageSlug === pageSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => ({ ...p, metric: metrics[p.metricKey] }))
    .filter((p) => p.metric != null);
}

export function getKpiMetrics(pageSlug: string) {
  return getPlacementsForPage(pageSlug).filter((p) => p.section === "kpi_row");
}

export function getChartMetrics(pageSlug: string) {
  return getPlacementsForPage(pageSlug).filter((p) => p.section === "chart_grid");
}
