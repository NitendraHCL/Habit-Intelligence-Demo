/**
 * OPD Wallet — User Feedback dataset.
 *
 * Grievances raised against orders and claims, per service vertical.
 *
 * Orders come from the build spec (OPD_Wallet_User_Feedback_Build_Prompt).
 * Grievance counts are scaled to 754 raised (about a tenth of the spec's
 * 7,545), with turnaround tuned to a 12-hour average and a 25-minute first
 * action, at the client's direction.
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
  /** Average order-level turnaround time, in hours */
  tatHours: number;
  /** First time to act, in minutes */
  firstActionMinutes: number;
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
    raised: 89,
    resolved: 81,
    open: 8,
    tatHours: 8.4,
    firstActionMinutes: 13,
    note: "Covers in-clinic medical consultation and dental consultation — a dental visit is physically an in-clinic consult.",
    reasons: [
      { reason: "Doctor was not available", count: 28 },
      { reason: "Consultation quality", count: 20 },
      { reason: "Cashless letter not accepted at the clinic", count: 18 },
      { reason: "Wrong doctor attended", count: 9 },
      { reason: "Prescription not provided", count: 7 },
      { reason: "Consultation cut short", count: 6 },
      { reason: "Other", count: 1 },
    ],
  },
  {
    key: "tele",
    label: "Tele Consultations",
    orders: 68_500,
    raised: 72,
    resolved: 69,
    open: 3,
    tatHours: 6.3,
    firstActionMinutes: 9,
    reasons: [
      { reason: "Doctor did not join in time", count: 27 },
      { reason: "Consultation quality", count: 18 },
      { reason: "Poor call quality or connectivity issue", count: 9 },
      { reason: "Wrong doctor joined", count: 7 },
      { reason: "Prescription not provided", count: 6 },
      { reason: "Session ended abruptly", count: 4 },
      { reason: "Other", count: 1 },
    ],
  },
  {
    key: "ahc",
    label: "Annual Health Check",
    orders: 18_900,
    raised: 41,
    resolved: 37,
    open: 4,
    tatHours: 10.2,
    firstActionMinutes: 20,
    reasons: [
      { reason: "Part of the package not completed", count: 17 },
      { reason: "Report has errors", count: 12 },
      { reason: "Report delayed or not received", count: 6 },
      { reason: "Other", count: 4 },
      { reason: "Phlebotomist did not arrive for home collection", count: 1 },
      { reason: "Wrong package or test given", count: 1 },
    ],
  },
  {
    key: "diagnostics",
    label: "Diagnostics",
    orders: 51_200,
    raised: 154,
    resolved: 141,
    open: 13,
    tatHours: 11.7,
    firstActionMinutes: 24,
    reasons: [
      { reason: "Appointment cancelled by the lab", count: 51 },
      { reason: "Report delayed or not received", count: 31 },
      { reason: "Report has errors", count: 31 },
      { reason: "Phlebotomist did not arrive for home collection", count: 18 },
      { reason: "Disagree with items removed during adjudication", count: 18 },
      { reason: "Wrong test conducted", count: 3 },
      { reason: "Other", count: 2 },
    ],
  },
  {
    key: "pharmacy",
    label: "Pharmacy",
    orders: 94_000,
    raised: 282,
    resolved: 259,
    open: 23,
    tatHours: 13.6,
    firstActionMinutes: 31,
    reasons: [
      { reason: "Wrong medicine delivered", count: 116 },
      { reason: "Disagree with items removed during adjudication", count: 51 },
      { reason: "Order not delivered or delayed", count: 51 },
      { reason: "Prescription rejected incorrectly", count: 42 },
      { reason: "Other", count: 10 },
      { reason: "Delivered to the wrong address", count: 6 },
      { reason: "Items missing from the order", count: 6 },
    ],
  },
  {
    key: "vaccination",
    label: "Vaccination",
    orders: 12_600,
    raised: 10,
    resolved: 9,
    open: 1,
    tatHours: 5.7,
    firstActionMinutes: 11,
    reasons: [
      { reason: "Vaccinator did not arrive or show up", count: 4 },
      { reason: "Wrong vaccine or wrong dose administered", count: 2 },
      { reason: "Appointment cancelled by the clinic or vendor", count: 1 },
      { reason: "Cashless letter not accepted", count: 1 },
      { reason: "Other", count: 1 },
      { reason: "Wrong vaccine or dose selected at booking", count: 1 },
    ],
  },
  {
    key: "vision",
    label: "Vision",
    orders: 15_400,
    raised: 38,
    resolved: 34,
    open: 4,
    tatHours: 12.6,
    firstActionMinutes: 22,
    reasons: [
      { reason: "Delivery took too long", count: 13 },
      { reason: "Wrong product received", count: 9 },
      { reason: "Coupon not accepted at the partner", count: 8 },
      { reason: "Order cancelled incorrectly", count: 5 },
      { reason: "Amount charged does not match the coupon value", count: 2 },
      { reason: "Other", count: 1 },
    ],
  },
  {
    key: "reimbursement",
    label: "Reimbursement Claim",
    orders: 9_800,
    raised: 68,
    resolved: 58,
    open: 10,
    tatHours: 18.6,
    firstActionMinutes: 40,
    reasons: [
      { reason: "Issue with the reimbursement amount", count: 26 },
      { reason: "Issue with documents requested", count: 17 },
      { reason: "Claim rejected incorrectly", count: 14 },
      { reason: "No update for too long", count: 7 },
      { reason: "Approved but payment not received", count: 3 },
      { reason: "Other", count: 1 },
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
  lastFullMonth: 65,
  previousMonth: 61,
  twoMonthsBack: 63,
};

export const ticketStatus = [
  { name: "Resolved, never reopened", value: 558 },
  { name: "Resolved after reopen", value: 130 },
  { name: "Currently open", value: 66 },
];

export interface ValueBand {
  band: string;
  grievances: number;
  resolved: number;
  open: number;
  /** Average turnaround time, in hours */
  tatHours: number;
}

export const valueBands: ValueBand[] = [
  { band: "Under ₹500", grievances: 191, resolved: 180, open: 11, tatHours: 6.3 },
  { band: "₹500 – ₹2,000", grievances: 273, resolved: 248, open: 25, tatHours: 9.6 },
  { band: "₹2,000 – ₹10,000", grievances: 209, resolved: 181, open: 28, tatHours: 13.2 },
  { band: "Above ₹10,000", grievances: 81, resolved: 79, open: 2, tatHours: 17.4 },
];

/* ─── Derivations ──────────────────────────────────────────────────────── */

export interface FeedbackTotals {
  label: string;
  orders: number;
  raised: number;
  resolved: number;
  open: number;
  /** Grievances as a share of orders, to two decimals — every rate is under 1% */
  rate: number;
  /** Grievance-weighted across verticals; a vertical's own figure when scoped */
  tatHours: number;
  firstActionMinutes: number;
}

const sum = (pick: (v: Vertical) => number) => verticals.reduce((a, v) => a + pick(v), 0);

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Totals for one vertical, or the weighted roll-up across all eight.
 *
 * Turnaround time and first-time-to-act roll up weighted by each vertical's
 * grievance count, not by a plain average — a straight mean would let
 * Vaccination's 10 grievances pull as hard as Pharmacy's 282.
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
        rate: v.orders > 0 ? round2((v.raised / v.orders) * 100) : 0,
        tatHours: v.tatHours,
        firstActionMinutes: v.firstActionMinutes,
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
    rate: orders > 0 ? round2((raised / orders) * 100) : 0,
    tatHours: round1(sum((v) => v.raised * v.tatHours) / raised),
    firstActionMinutes: Math.round(sum((v) => v.raised * v.firstActionMinutes) / raised),
  };
}

/** Vertical with the highest grievance rate — the headline risk on the page. */
export function worstRateVertical(): { vertical: Vertical; rate: number } {
  const scored = verticals.map((v) => ({ vertical: v, rate: (v.raised / v.orders) * 100 }));
  scored.sort((a, b) => b.rate - a.rate);
  return { vertical: scored[0].vertical, rate: round2(scored[0].rate) };
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
