/**
 * OPD Wallet — User Feedback dataset.
 *
 * Grievances raised against orders and claims, per service vertical.
 *
 * Figures come from the build spec (OPD_Wallet_User_Feedback_Build_Prompt).
 * Only the leaf numbers are stored — counts, orders, turnaround times — and
 * every total, rate and percentage on the page is derived from them, so the
 * dashboard cannot drift out of agreement with its own tables.
 *
 * Like the rest of the OPD Wallet section this is demo data, not a live feed.
 */

export interface ReasonRow {
  reason: string;
  count: number;
}

export interface Vertical {
  key: string;
  /** Tab label */
  label: string;
  orders: number;
  raised: number;
  resolved: number;
  open: number;
  /** Average order-level turnaround time, in days */
  tatDays: number;
  /** First time to act, in hours */
  firstActionHours: number;
  /** Reason list is per vertical — the labels do not carry across verticals. */
  reasons: ReasonRow[];
  /** Shown as a note on the tab where the vertical's scope isn't obvious. */
  note?: string;
}

export const verticals: Vertical[] = [
  {
    key: "offline",
    label: "Offline Consultation",
    orders: 42_300,
    raised: 890,
    resolved: 810,
    open: 80,
    tatDays: 2.8,
    firstActionHours: 6,
    note: "Covers in-clinic medical consultation and dental consultation — a dental visit is physically an in-clinic consult.",
    reasons: [
      { reason: "Doctor was not available", count: 285 },
      { reason: "Consultation quality", count: 196 },
      { reason: "Cashless letter not accepted at the clinic", count: 178 },
      { reason: "Wrong doctor attended", count: 89 },
      { reason: "Prescription not provided", count: 71 },
      { reason: "Consultation cut short", count: 62 },
      { reason: "Other", count: 9 },
    ],
  },
  {
    key: "tele",
    label: "Tele Consultations",
    orders: 68_500,
    raised: 720,
    resolved: 690,
    open: 30,
    tatDays: 2.1,
    firstActionHours: 4,
    reasons: [
      { reason: "Doctor did not join in time", count: 274 },
      { reason: "Consultation quality", count: 180 },
      { reason: "Poor call quality or connectivity issue", count: 86 },
      { reason: "Wrong doctor joined", count: 72 },
      { reason: "Prescription not provided", count: 65 },
      { reason: "Session ended abruptly", count: 36 },
      { reason: "Other", count: 7 },
    ],
  },
  {
    key: "ahc",
    label: "Annual Health Check",
    orders: 18_900,
    raised: 410,
    resolved: 375,
    open: 35,
    tatDays: 3.4,
    firstActionHours: 9,
    reasons: [
      { reason: "Part of the package not completed", count: 173 },
      { reason: "Report has errors", count: 115 },
      { reason: "Report delayed or not received", count: 61 },
      { reason: "Other", count: 41 },
      { reason: "Phlebotomist did not arrive for home collection", count: 12 },
      { reason: "Wrong package or test given", count: 8 },
    ],
  },
  {
    key: "diagnostics",
    label: "Diagnostics",
    orders: 51_200,
    raised: 1_540,
    resolved: 1_410,
    open: 130,
    tatDays: 3.9,
    firstActionHours: 11,
    reasons: [
      { reason: "Appointment cancelled by the lab", count: 508 },
      { reason: "Report delayed or not received", count: 308 },
      { reason: "Report has errors", count: 308 },
      { reason: "Phlebotomist did not arrive for home collection", count: 185 },
      { reason: "Disagree with items removed during adjudication", count: 185 },
      { reason: "Wrong test conducted", count: 31 },
      { reason: "Other", count: 15 },
    ],
  },
  {
    key: "pharmacy",
    label: "Pharmacy",
    orders: 94_000,
    raised: 2_820,
    resolved: 2_590,
    open: 230,
    tatDays: 4.6,
    firstActionHours: 14,
    reasons: [
      { reason: "Wrong medicine delivered", count: 1_157 },
      { reason: "Disagree with items removed during adjudication", count: 508 },
      { reason: "Order not delivered or delayed", count: 508 },
      { reason: "Prescription rejected incorrectly", count: 423 },
      { reason: "Other", count: 112 },
      { reason: "Delivered to the wrong address", count: 56 },
      { reason: "Items missing from the order", count: 56 },
    ],
  },
  {
    key: "vaccination",
    label: "Vaccination",
    orders: 12_600,
    raised: 95,
    resolved: 90,
    open: 5,
    tatDays: 1.9,
    firstActionHours: 5,
    reasons: [
      { reason: "Vaccinator did not arrive or show up", count: 54 },
      { reason: "Wrong vaccine or wrong dose administered", count: 19 },
      { reason: "Appointment cancelled by the clinic or vendor", count: 10 },
      { reason: "Cashless letter not accepted", count: 5 },
      { reason: "Other", count: 4 },
      { reason: "Wrong vaccine or dose selected at booking", count: 3 },
    ],
  },
  {
    key: "vision",
    label: "Vision",
    orders: 15_400,
    raised: 385,
    resolved: 350,
    open: 35,
    tatDays: 4.2,
    firstActionHours: 10,
    reasons: [
      { reason: "Delivery took too long", count: 135 },
      { reason: "Wrong product received", count: 96 },
      { reason: "Coupon not accepted at the partner", count: 77 },
      { reason: "Order cancelled incorrectly", count: 46 },
      { reason: "Amount charged does not match the coupon value", count: 23 },
      { reason: "Other", count: 8 },
    ],
  },
  {
    key: "reimbursement",
    label: "Reimbursement Claim",
    orders: 9_800,
    raised: 685,
    resolved: 590,
    open: 95,
    tatDays: 6.2,
    firstActionHours: 18,
    reasons: [
      { reason: "Issue with the reimbursement amount", count: 267 },
      { reason: "Issue with documents requested", count: 171 },
      { reason: "Claim rejected incorrectly", count: 137 },
      { reason: "No update for too long", count: 69 },
      { reason: "Approved but payment not received", count: 34 },
      { reason: "Other", count: 7 },
    ],
  },
];

/* ─── Programme-wide series ────────────────────────────────────────────── */

/**
 * The three cards below are only published at programme level — the spec
 * carries no per-vertical breakdown for the reopen split, the month series or
 * the claim value bands, so they stay unscoped rather than being invented.
 */

export const monthOnMonth = {
  lastFullMonth: 645,
  previousMonth: 609,
  twoMonthsBack: 633,
};

export const ticketStatus = [
  { name: "Resolved, never reopened", value: 5_605 },
  { name: "Resolved after reopen", value: 1_300 },
  { name: "Currently open", value: 640 },
];

export interface ValueBand {
  band: string;
  grievances: number;
  resolved: number;
  open: number;
  tatDays: number;
}

export const valueBands: ValueBand[] = [
  { band: "Under ₹500", grievances: 1_910, resolved: 1_798, open: 112, tatDays: 2.1 },
  { band: "₹500 – ₹2,000", grievances: 2_735, resolved: 2_490, open: 245, tatDays: 3.2 },
  { band: "₹2,000 – ₹10,000", grievances: 2_090, resolved: 1_824, open: 266, tatDays: 4.4 },
  { band: "Above ₹10,000", grievances: 810, resolved: 793, open: 17, tatDays: 5.8 },
];

/* ─── Derivations ──────────────────────────────────────────────────────── */

export interface FeedbackTotals {
  label: string;
  orders: number;
  raised: number;
  resolved: number;
  open: number;
  /** Grievances as a share of orders */
  rate: number;
  /** Grievance-weighted across verticals; a vertical's own figure when scoped */
  tatDays: number;
  firstActionHours: number;
}

const sum = (pick: (v: Vertical) => number) => verticals.reduce((a, v) => a + pick(v), 0);

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Totals for one vertical, or the weighted roll-up across all eight.
 *
 * Turnaround time and first-time-to-act roll up weighted by each vertical's
 * grievance count, not by a plain average — a straight mean would let
 * Vaccination's 95 grievances pull as hard as Pharmacy's 2,820.
 */
export function totalsFor(key: string | null): FeedbackTotals {
  if (key) {
    const v = verticals.find((x) => x.key === key);
    if (v) {
      return {
        label: v.label,
        orders: v.orders,
        raised: v.raised,
        resolved: v.resolved,
        open: v.open,
        rate: v.orders > 0 ? Math.round((v.raised / v.orders) * 1000) / 10 : 0,
        tatDays: v.tatDays,
        firstActionHours: v.firstActionHours,
      };
    }
  }

  const orders = sum((v) => v.orders);
  const raised = sum((v) => v.raised);
  return {
    label: "All Verticals",
    orders,
    raised,
    resolved: sum((v) => v.resolved),
    open: sum((v) => v.open),
    rate: orders > 0 ? Math.round((raised / orders) * 1000) / 10 : 0,
    tatDays: round1(sum((v) => v.raised * v.tatDays) / raised),
    firstActionHours: Math.round(sum((v) => v.raised * v.firstActionHours) / raised),
  };
}

/** Vertical with the highest grievance rate — the headline risk on the page. */
export function worstRateVertical(): { vertical: Vertical; rate: number } {
  const scored = verticals.map((v) => ({ vertical: v, rate: (v.raised / v.orders) * 100 }));
  scored.sort((a, b) => b.rate - a.rate);
  return { vertical: scored[0].vertical, rate: round1(scored[0].rate) };
}

/** Vertical carrying the most grievances by volume. */
export function largestVolumeVertical(): Vertical {
  return [...verticals].sort((a, b) => b.raised - a.raised)[0];
}

export const monthChangePct =
  Math.round(
    ((monthOnMonth.lastFullMonth - monthOnMonth.previousMonth) / monthOnMonth.previousMonth) * 1000
  ) / 10;

export const POLICY_YEARS = ["2025-26", "2024-25"] as const;
