/**
 * OPD Wallet Analytics — demo dataset.
 *
 * Everything here is synthetic. Names, emails, policy numbers and centres are
 * invented for a fictitious "Demo Corp" so the section can be shown to anyone
 * without exposing a real client's register.
 *
 * Row-level tables are generated from a fixed seed rather than Math.random so
 * the server and client renders agree (otherwise every table would hydrate
 * with different rows).
 */

/* ─── Seeded generator ─────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260915);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

/* ─── Formatters ───────────────────────────────────────────────────────── */

export const nf = (n: number) => n.toLocaleString("en-IN");

/** 63238 → "63.24K", 1250000 → "1.25M" */
export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return String(n);
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const inrCompact = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} lac`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return inr(n);
};

export const pctOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0;

export interface Slice {
  name: string;
  value: number;
}

/* ─── Shared reference lists ───────────────────────────────────────────── */

const FIRST_NAMES = [
  "Aarav", "Diya", "Kabir", "Meera", "Rohan", "Ananya", "Vikram", "Sneha",
  "Arjun", "Priya", "Nikhil", "Kavya", "Rahul", "Ishita", "Manish", "Tara",
  "Siddharth", "Nandini", "Varun", "Pooja", "Aditya", "Shruti", "Karan", "Riya",
] as const;

const LAST_NAMES = [
  "Sharma", "Iyer", "Nair", "Reddy", "Kulkarni", "Banerjee", "Chauhan", "Menon",
  "Deshpande", "Rao", "Kapoor", "Bhatt", "Sinha", "Pillai", "Joshi", "Verma",
] as const;

export const RELATIONS = [
  "self", "wife", "husband", "son", "daughter", "father", "mother",
  "mother in law", "father in law", "brother", "sister",
] as const;

export const ENTITIES = [
  "Demo Corp Technologies",
  "Demo Corp Foundation",
  "Demo Corp Services",
  "Demo Corp Infra",
] as const;

const email = (first: string, last: string) =>
  `${first.toLowerCase()}.${last.toLowerCase()}@democorp.in`;

/* ══════════════════════════════════════════════════════════════════════════
   1. REGISTRATION STATUS
   ══════════════════════════════════════════════════════════════════════════ */

export const registration = {
  activeLives: 63_238,
  totalSignup: 16_087,
  employeesOnRoll: 18_640,
  asOf: "2026-09-14T07:30:00Z",

  ageSplit: [
    { name: "30-39", value: 15_970 },
    { name: "40-49", value: 11_300 },
    { name: "60+", value: 10_870 },
    { name: "0-10", value: 9_400 },
    { name: "10-19", value: 6_050 },
    { name: "50-59", value: 5_380 },
    { name: "20-29", value: 4_268 },
  ] as Slice[],

  relationSplit: [
    { name: "self", value: 18_540 },
    { name: "wife", value: 12_010 },
    { name: "son", value: 8_840 },
    { name: "daughter", value: 8_210 },
    { name: "mother", value: 7_310 },
    { name: "father", value: 5_680 },
    { name: "husband", value: 1_630 },
    { name: "mother in law", value: 550 },
    { name: "sister", value: 250 },
    { name: "brother", value: 180 },
    { name: "unknown", value: 38 },
  ] as Slice[],

  genderSplit: [
    { name: "Male", value: 31_780 },
    { name: "Female", value: 31_450 },
    { name: "Other", value: 8 },
  ] as Slice[],

  /** Sign-up curve since the policy went live */
  signupTrend: [
    { month: "Oct 25", signups: 4_120, cumulative: 4_120 },
    { month: "Nov 25", signups: 2_460, cumulative: 6_580 },
    { month: "Dec 25", signups: 1_780, cumulative: 8_360 },
    { month: "Jan 26", signups: 1_540, cumulative: 9_900 },
    { month: "Feb 26", signups: 1_190, cumulative: 11_090 },
    { month: "Mar 26", signups: 1_060, cumulative: 12_150 },
    { month: "Apr 26", signups: 890, cumulative: 13_040 },
    { month: "May 26", signups: 740, cumulative: 13_780 },
    { month: "Jun 26", signups: 660, cumulative: 14_440 },
    { month: "Jul 26", signups: 610, cumulative: 15_050 },
    { month: "Aug 26", signups: 570, cumulative: 15_620 },
    { month: "Sep 26", signups: 467, cumulative: 16_087 },
  ],

  /** Enrolment completeness per entity */
  entityStatus: ENTITIES.map((entity, i) => {
    const eligible = [8_940, 4_610, 3_280, 1_810][i];
    const registered = [8_120, 3_940, 2_610, 1_417][i];
    return {
      entity,
      eligible,
      registered,
      pending: eligible - registered,
      pct: pctOf(registered, eligible),
    };
  }),
};

export interface MemberRow {
  memberId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: "Male" | "Female";
  relation: string;
  policyNumber: string;
  policyStart: string;
  entity: string;
}

export const memberRows: MemberRow[] = Array.from({ length: 64 }, (_, i) => {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const relation = pick(RELATIONS);
  const gender: "Male" | "Female" =
    ["wife", "daughter", "mother", "mother in law", "sister"].includes(relation)
      ? "Female"
      : ["husband", "son", "father", "father in law", "brother"].includes(relation)
      ? "Male"
      : rnd() > 0.5
      ? "Male"
      : "Female";
  const entity = pick(ENTITIES);
  return {
    memberId: `DC${String(100_000 + i * 37 + int(1, 30)).slice(0, 6)}`,
    name: `${first} ${last}`,
    email: email(first, last),
    phone: `9${int(100_000_000, 899_999_999)}`,
    dob: `${pick(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])} ${int(1, 28)}, ${int(1950, 2020)}`,
    gender,
    relation,
    policyNumber: `${entity.split(" ")[2] ?? "Corp"}-${relation === "self" ? "Emp" : "Dep"}-OPD-B-O${int(1, 3)}`,
    policyStart: "Oct 1, 2025",
    entity,
  };
});

/* ══════════════════════════════════════════════════════════════════════════
   2. UTILISATION — one tab per consumption type
   ══════════════════════════════════════════════════════════════════════════ */

export interface UtilKpi {
  label: string;
  value: string;
  sub?: string;
}

export interface UtilTab {
  key: string;
  label: string;
  /** Page heading inside the tab */
  title: string;
  subtitle: string;
  kpis: UtilKpi[];
  mom: { previous: number; twoBack: number; unit: string };
  gauge: { title: string; value: number; caption: string };
  status: { title: string; data: Slice[] };
  /** Specialisation / test / therapy area / vaccine — varies by tab */
  category: { title: string; data: Slice[] };
  age: Slice[];
  gender: Slice[];
  relation: Slice[];
  centres: Slice[];
  centresTitle: string;
  locations: Slice[];
  trend: { month: string; value: number }[];
  insight: string;
}

const AGE_BUCKETS = ["0-10", "10-19", "20-29", "30-39", "40-49", "50-59", "60+"] as const;

/** Spread a total across the age buckets using a fixed profile. */
function ageProfile(total: number, weights: number[]): Slice[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  return AGE_BUCKETS.map((name, i) => ({
    name,
    value: Math.round((total * weights[i]) / sum),
  }));
}

function months(values: number[]): { month: string; value: number }[] {
  const labels = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return labels.map((month, i) => ({ month, value: values[i] }));
}

export const utilisationTabs: UtilTab[] = [
  /* ── Offline Consultation ── */
  {
    key: "offline",
    label: "Offline Consultation",
    title: "Offline Consultations",
    subtitle:
      "In-centre doctor visits booked through the wallet — volumes, where they happen and who is using them.",
    kpis: [
      { label: "Unique Users", value: "634" },
      { label: "Total Consultations", value: "1,382" },
      { label: "Monthly Average Consultations", value: "138" },
      { label: "Consultations per Family", value: "2" },
      { label: "Consultations per User", value: "2" },
      { label: "% Confirmed (within 4 hours)", value: "92%" },
    ],
    mom: { previous: 108, twoBack: 243, unit: "consultations" },
    gauge: { title: "User Rating (4 & 5 star)", value: 100, caption: "of rated consultations scored 4 or 5" },
    status: {
      title: "Request Status",
      data: [
        { name: "confirmed", value: 1_093 },
        { name: "cancelled", value: 289 },
      ],
    },
    category: {
      title: "Specialisation Split",
      data: [
        { name: "Dermatology", value: 56 },
        { name: "Gynaecology", value: 46 },
        { name: "Ophthalmology", value: 36 },
        { name: "Orthopaedics", value: 28 },
        { name: "Paediatrics", value: 26 },
        { name: "General Physician", value: 23 },
        { name: "Dentistry", value: 18 },
        { name: "Gastroenterology", value: 13 },
        { name: "Neurology", value: 9 },
      ],
    },
    age: ageProfile(1_361, [12, 3, 17, 45, 11, 6, 7]),
    gender: [
      { name: "Female", value: 480 },
      { name: "Male", value: 357 },
      { name: "Other", value: 1 },
    ],
    relation: [
      { name: "Others", value: 535 },
      { name: "Spouse", value: 412 },
      { name: "Children", value: 231 },
      { name: "Parent", value: 171 },
      { name: "In-laws", value: 9 },
    ],
    centresTitle: "Top 5 Centres",
    centres: [
      { name: "Central Care Hospital", value: 67 },
      { name: "Metro Care Clinic", value: 64 },
      { name: "Lakeview Multispeciality", value: 60 },
      { name: "Green Park Clinic", value: 48 },
      { name: "Sunrise Health Centre", value: 39 },
    ],
    locations: [
      { name: "Bengaluru", value: 308 },
      { name: "Hyderabad", value: 144 },
      { name: "Noida", value: 140 },
      { name: "Chennai", value: 107 },
      { name: "Greater Noida", value: 83 },
      { name: "New Delhi", value: 79 },
      { name: "Lucknow", value: 77 },
      { name: "Pune", value: 74 },
      { name: "Ghaziabad", value: 47 },
      { name: "Delhi", value: 36 },
    ],
    trend: months([96, 124, 151, 168, 143, 139, 122, 118, 106, 243, 108, 64]),
    insight:
      "Bengaluru alone drives 22% of offline consultations, and dermatology plus gynaecology together account for 40% of all specialisation demand. The 56% month-on-month drop is a seasonal dip, not a drop in registered users.",
  },

  /* ── Tele Consultation ── */
  {
    key: "tele",
    label: "Tele Consultations",
    title: "Tele Consultations",
    subtitle:
      "Audio and video consultations delivered through the app — the fastest-growing consumption line in the wallet.",
    kpis: [
      { label: "Unique Users", value: "1,207" },
      { label: "Total Consultations", value: "3,164" },
      { label: "Monthly Average Consultations", value: "264" },
      { label: "Median Wait Time", value: "3.4 min" },
      { label: "Consultations per User", value: "3" },
      { label: "% Completed", value: "88%" },
    ],
    mom: { previous: 286, twoBack: 231, unit: "consultations" },
    gauge: { title: "User Rating (4 & 5 star)", value: 94, caption: "of rated tele consultations scored 4 or 5" },
    status: {
      title: "Request Status",
      data: [
        { name: "completed", value: 2_784 },
        { name: "cancelled", value: 243 },
        { name: "no-show", value: 137 },
      ],
    },
    category: {
      title: "Specialisation Split",
      data: [
        { name: "General Physician", value: 1_086 },
        { name: "Dermatology", value: 512 },
        { name: "Paediatrics", value: 438 },
        { name: "Psychology", value: 330 },
        { name: "Gynaecology", value: 284 },
        { name: "Nutrition", value: 245 },
        { name: "ENT", value: 156 },
        { name: "Orthopaedics", value: 113 },
      ],
    },
    age: ageProfile(3_164, [14, 5, 21, 38, 12, 5, 5]),
    gender: [
      { name: "Female", value: 1_740 },
      { name: "Male", value: 1_418 },
      { name: "Other", value: 6 },
    ],
    relation: [
      { name: "Self", value: 1_402 },
      { name: "Spouse", value: 764 },
      { name: "Children", value: 618 },
      { name: "Parent", value: 349 },
      { name: "In-laws", value: 31 },
    ],
    centresTitle: "Top 5 Consultation Modes",
    centres: [
      { name: "Video — app", value: 1_842 },
      { name: "Audio — app", value: 731 },
      { name: "Chat follow-up", value: 318 },
      { name: "Video — web", value: 187 },
      { name: "Call-back", value: 86 },
    ],
    locations: [
      { name: "Bengaluru", value: 684 },
      { name: "Hyderabad", value: 402 },
      { name: "Noida", value: 361 },
      { name: "Chennai", value: 298 },
      { name: "Pune", value: 264 },
      { name: "New Delhi", value: 241 },
      { name: "Greater Noida", value: 218 },
      { name: "Lucknow", value: 197 },
      { name: "Ghaziabad", value: 156 },
      { name: "Delhi", value: 143 },
    ],
    trend: months([118, 164, 201, 243, 268, 294, 311, 286, 279, 231, 286, 483]),
    insight:
      "Tele consultations have more than doubled since October and now outnumber offline visits 2:1. General physician demand carries a third of the volume, and the 3.4 minute median wait is the single biggest driver of the 94% satisfaction score.",
  },

  /* ── AHC ── */
  {
    key: "ahc",
    label: "AHC",
    title: "Annual Health Check-ups",
    subtitle:
      "Preventive health check packages consumed against the wallet, from booking through to report delivery.",
    kpis: [
      { label: "Eligible Employees", value: "18,640" },
      { label: "AHCs Booked", value: "9,412" },
      { label: "AHCs Completed", value: "8,106" },
      { label: "Utilisation Rate", value: "43%" },
      { label: "Avg Report TAT", value: "2.6 days" },
      { label: "% With Abnormal Finding", value: "61%" },
    ],
    mom: { previous: 742, twoBack: 638, unit: "health checks" },
    gauge: { title: "Report Delivered within SLA", value: 91, caption: "reports released inside the 3-day SLA" },
    status: {
      title: "Booking Status",
      data: [
        { name: "completed", value: 8_106 },
        { name: "scheduled", value: 764 },
        { name: "cancelled", value: 542 },
      ],
    },
    category: {
      title: "Package Split",
      data: [
        { name: "Executive Health Check", value: 3_284 },
        { name: "Basic Health Check", value: 2_611 },
        { name: "Cardiac Screening", value: 1_042 },
        { name: "Women's Wellness", value: 684 },
        { name: "Diabetic Profile", value: 289 },
        { name: "Senior Citizen Panel", value: 196 },
      ],
    },
    age: ageProfile(8_106, [2, 3, 14, 41, 24, 10, 6]),
    gender: [
      { name: "Male", value: 4_620 },
      { name: "Female", value: 3_478 },
      { name: "Other", value: 8 },
    ],
    relation: [
      { name: "Self", value: 6_214 },
      { name: "Spouse", value: 1_218 },
      { name: "Parent", value: 502 },
      { name: "Children", value: 143 },
      { name: "In-laws", value: 29 },
    ],
    centresTitle: "Top 5 Centres",
    centres: [
      { name: "Central Care Hospital", value: 1_984 },
      { name: "Lakeview Multispeciality", value: 1_612 },
      { name: "Sunrise Health Centre", value: 1_204 },
      { name: "Metro Care Clinic", value: 986 },
      { name: "Green Park Clinic", value: 742 },
    ],
    locations: [
      { name: "Bengaluru", value: 2_104 },
      { name: "Hyderabad", value: 1_186 },
      { name: "Noida", value: 942 },
      { name: "Chennai", value: 806 },
      { name: "Pune", value: 684 },
      { name: "New Delhi", value: 562 },
      { name: "Greater Noida", value: 498 },
      { name: "Lucknow", value: 431 },
      { name: "Ghaziabad", value: 396 },
      { name: "Delhi", value: 297 },
    ],
    trend: months([412, 486, 604, 812, 906, 1_014, 884, 762, 698, 638, 742, 148]),
    insight:
      "43% of eligible employees have completed an AHC this policy year. 61% of completed checks flagged at least one abnormal parameter — predominantly lipid profile and HbA1c — which is what feeds the follow-up consultation volume.",
  },

  /* ── Diagnostics ── */
  {
    key: "diagnostics",
    label: "Diagnostics",
    title: "Diagnostics",
    subtitle:
      "Prescribed lab tests and imaging drawn from the wallet, split between home collection and walk-in centres.",
    kpis: [
      { label: "Unique Users", value: "4,286" },
      { label: "Total Tests Booked", value: "11,742" },
      { label: "Monthly Average Tests", value: "979" },
      { label: "Home Collections", value: "64%" },
      { label: "Avg Report TAT", value: "18 hrs" },
      { label: "Tests per User", value: "3" },
    ],
    mom: { previous: 1_024, twoBack: 908, unit: "tests" },
    gauge: { title: "Reports Inside SLA", value: 96, caption: "of reports released within 24 hours" },
    status: {
      title: "Booking Status",
      data: [
        { name: "completed", value: 10_684 },
        { name: "sample rejected", value: 412 },
        { name: "cancelled", value: 646 },
      ],
    },
    category: {
      title: "Top Test Categories",
      data: [
        { name: "Pathology Profiles", value: 4_212 },
        { name: "Blood Sugar / HbA1c", value: 2_106 },
        { name: "Lipid Profile", value: 1_684 },
        { name: "Thyroid Panel", value: 1_248 },
        { name: "Vitamin D & B12", value: 986 },
        { name: "X-Ray", value: 742 },
        { name: "Ultrasound", value: 486 },
        { name: "ECG", value: 278 },
      ],
    },
    age: ageProfile(11_742, [8, 4, 16, 38, 17, 9, 8]),
    gender: [
      { name: "Female", value: 6_184 },
      { name: "Male", value: 5_542 },
      { name: "Other", value: 16 },
    ],
    relation: [
      { name: "Self", value: 5_806 },
      { name: "Spouse", value: 2_684 },
      { name: "Parent", value: 2_012 },
      { name: "Children", value: 1_142 },
      { name: "In-laws", value: 98 },
    ],
    centresTitle: "Top 5 Collection Partners",
    centres: [
      { name: "Home collection — city A", value: 3_142 },
      { name: "Home collection — city B", value: 2_486 },
      { name: "Lakeview Diagnostics", value: 1_842 },
      { name: "Metro Path Labs", value: 1_286 },
      { name: "Sunrise Imaging", value: 864 },
    ],
    locations: [
      { name: "Bengaluru", value: 2_842 },
      { name: "Hyderabad", value: 1_684 },
      { name: "Noida", value: 1_412 },
      { name: "Chennai", value: 1_186 },
      { name: "Pune", value: 964 },
      { name: "New Delhi", value: 842 },
      { name: "Greater Noida", value: 706 },
      { name: "Lucknow", value: 612 },
      { name: "Ghaziabad", value: 514 },
      { name: "Delhi", value: 428 },
    ],
    trend: months([684, 742, 886, 1_042, 1_118, 1_204, 1_086, 964, 942, 908, 1_024, 142]),
    insight:
      "Two thirds of diagnostics now run through home collection, which is what pulled the average report TAT down to 18 hours. Routine pathology and sugar panels make up half of all tests — largely AHC follow-ups.",
  },

  /* ── Pharmacy ── */
  {
    key: "pharmacy",
    label: "Pharmacy",
    title: "Pharmacy",
    subtitle:
      "Prescribed medicine orders fulfilled against the wallet, including chronic-care refills.",
    kpis: [
      { label: "Unique Users", value: "5,914" },
      { label: "Total Orders", value: "18,406" },
      { label: "Monthly Average Orders", value: "1,534" },
      { label: "Avg Order Value", value: "₹842" },
      { label: "Avg Delivery TAT", value: "22 hrs" },
      { label: "Refill Rate", value: "38%" },
    ],
    mom: { previous: 1_612, twoBack: 1_486, unit: "orders" },
    gauge: { title: "Orders Delivered On Time", value: 93, caption: "of orders delivered inside the 24-hour promise" },
    status: {
      title: "Order Status",
      data: [
        { name: "delivered", value: 16_842 },
        { name: "in transit", value: 684 },
        { name: "cancelled", value: 880 },
      ],
    },
    category: {
      title: "Therapy Area Split",
      data: [
        { name: "Anti-infectives", value: 4_612 },
        { name: "Cardiac & BP", value: 3_842 },
        { name: "Diabetes", value: 3_186 },
        { name: "Pain & Inflammation", value: 2_484 },
        { name: "Gastro", value: 1_842 },
        { name: "Respiratory", value: 1_286 },
        { name: "Dermatology", value: 786 },
        { name: "Supplements", value: 368 },
      ],
    },
    age: ageProfile(18_406, [7, 4, 14, 33, 19, 11, 12]),
    gender: [
      { name: "Male", value: 9_614 },
      { name: "Female", value: 8_776 },
      { name: "Other", value: 16 },
    ],
    relation: [
      { name: "Self", value: 8_142 },
      { name: "Parent", value: 4_684 },
      { name: "Spouse", value: 3_612 },
      { name: "Children", value: 1_842 },
      { name: "In-laws", value: 126 },
    ],
    centresTitle: "Top 5 Fulfilment Partners",
    centres: [
      { name: "Partner pharmacy — North", value: 5_842 },
      { name: "Partner pharmacy — South", value: 4_986 },
      { name: "Partner pharmacy — West", value: 3_412 },
      { name: "Chronic care desk", value: 2_684 },
      { name: "Walk-in counters", value: 1_482 },
    ],
    locations: [
      { name: "Bengaluru", value: 4_286 },
      { name: "Hyderabad", value: 2_684 },
      { name: "Noida", value: 2_142 },
      { name: "Chennai", value: 1_842 },
      { name: "Pune", value: 1_614 },
      { name: "New Delhi", value: 1_386 },
      { name: "Greater Noida", value: 1_142 },
      { name: "Lucknow", value: 986 },
      { name: "Ghaziabad", value: 842 },
      { name: "Delhi", value: 684 },
    ],
    trend: months([1_042, 1_186, 1_412, 1_684, 1_742, 1_806, 1_684, 1_542, 1_508, 1_486, 1_612, 702]),
    insight:
      "Chronic therapy areas — cardiac, diabetes and respiratory — account for 45% of orders and virtually all of the 38% refill rate. Parents are the single largest consuming relation, which is unusual against the other service lines.",
  },

  /* ── Vaccination ── */
  {
    key: "vaccination",
    label: "Vaccination",
    title: "Vaccination",
    subtitle:
      "Doses administered under the wallet — adult boosters, paediatric schedules and seasonal drives.",
    kpis: [
      { label: "Unique Users", value: "2,486" },
      { label: "Doses Administered", value: "4,128" },
      { label: "Monthly Average Doses", value: "344" },
      { label: "Doses per User", value: "2" },
      { label: "Schedule Adherence", value: "84%" },
      { label: "Doses Overdue", value: "612" },
    ],
    mom: { previous: 386, twoBack: 412, unit: "doses" },
    gauge: { title: "Schedule Adherence", value: 84, caption: "of due doses taken within the recommended window" },
    status: {
      title: "Dose Status",
      data: [
        { name: "administered", value: 4_128 },
        { name: "due", value: 486 },
        { name: "overdue", value: 612 },
      ],
    },
    category: {
      title: "Vaccine Split",
      data: [
        { name: "Influenza", value: 1_486 },
        { name: "Hepatitis B", value: 742 },
        { name: "Typhoid", value: 614 },
        { name: "Tetanus (Td)", value: 486 },
        { name: "Hepatitis A", value: 386 },
        { name: "HPV", value: 242 },
        { name: "Pneumococcal", value: 172 },
      ],
    },
    age: ageProfile(4_128, [26, 9, 11, 24, 13, 8, 9]),
    gender: [
      { name: "Female", value: 2_164 },
      { name: "Male", value: 1_960 },
      { name: "Other", value: 4 },
    ],
    relation: [
      { name: "Children", value: 1_486 },
      { name: "Self", value: 1_284 },
      { name: "Spouse", value: 742 },
      { name: "Parent", value: 584 },
      { name: "In-laws", value: 32 },
    ],
    centresTitle: "Top 5 Centres",
    centres: [
      { name: "Central Care Hospital", value: 1_042 },
      { name: "Sunrise Health Centre", value: 886 },
      { name: "On-site camps", value: 764 },
      { name: "Green Park Clinic", value: 742 },
      { name: "Metro Care Clinic", value: 694 },
    ],
    locations: [
      { name: "Bengaluru", value: 986 },
      { name: "Hyderabad", value: 612 },
      { name: "Noida", value: 486 },
      { name: "Chennai", value: 412 },
      { name: "Pune", value: 386 },
      { name: "New Delhi", value: 342 },
      { name: "Greater Noida", value: 286 },
      { name: "Lucknow", value: 242 },
      { name: "Ghaziabad", value: 198 },
      { name: "Delhi", value: 178 },
    ],
    trend: months([612, 486, 312, 268, 242, 286, 342, 386, 412, 412, 386, 184]),
    insight:
      "Influenza carries 36% of all doses and spikes with the October drive. 612 doses are already past their recommended window — almost all of them second and third doses in the Hepatitis B course.",
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   3. REIMBURSEMENT
   ══════════════════════════════════════════════════════════════════════════ */

export const reimbursement = {
  asOf: "2026-09-14T07:30:00Z",
  kpis: {
    uniqueUsers: 13_554,
    totalClaims: 287_463,
    totalClaimAmount: 505_367_873,
    approvedAmount: 289_990_452,
    outstandingAmount: 21_207_477,
    rejectedAmount: 139_052_251,
    avgClaimsPerEmployee: 21,
    avgAmountPerEmployee: 21_395,
  },

  statusSplit: [
    { name: "SETTLED", value: 228_000 },
    { name: "REJECTED", value: 38_000 },
    { name: "CLOSED", value: 10_000 },
    { name: "PENDING(DD)", value: 6_800 },
    { name: "QC CHECK", value: 3_100 },
    { name: "SENT IN DEBIT NOTE", value: 1_563 },
  ] as Slice[],

  relationSplit: [
    { name: "Others", value: 91_000 },
    { name: "Spouse", value: 71_000 },
    { name: "Children", value: 67_000 },
    { name: "Parent", value: 55_000 },
    { name: "In-laws", value: 3_463 },
  ] as Slice[],

  amountByStatus: [
    { name: "SETTLED", value: 334_900_000 },
    { name: "REJECTED", value: 117_200_000 },
    { name: "CLOSED", value: 21_900_000 },
    { name: "QC CHECK", value: 2_800_000 },
    { name: "PENDING(DD)", value: 28_567_873 },
  ] as Slice[],

  amountByRelation: [
    { name: "Others", value: 172_000_000 },
    { name: "Parent", value: 132_000_000 },
    { name: "Spouse", value: 112_000_000 },
    { name: "Children", value: 82_000_000 },
    { name: "In-laws", value: 7_367_873 },
  ] as Slice[],

  /** Claim count by age band, stacked by relation */
  ageRelation: [
    { age: "0-10", Self: 200, Spouse: 230, Children: 18_520, Parent: 0, "In-laws": 21_390 },
    { age: "10-20", Self: 120, Spouse: 160, Children: 4_830, Parent: 80, "In-laws": 5_640 },
    { age: "20-30", Self: 110, Spouse: 130, Children: 7_400, Parent: 0, "In-laws": 11_080 },
    { age: "30-40", Self: 550, Spouse: 860, Children: 21_820, Parent: 30, "In-laws": 34_040 },
    { age: "40-50", Self: 390, Spouse: 720, Children: 11_890, Parent: 20, "In-laws": 21_740 },
    { age: "50-60", Self: 100, Spouse: 160, Children: 5_070, Parent: 0, "In-laws": 11_240 },
    { age: "60+", Self: 140, Spouse: 290, Children: 8_860, Parent: 0, "In-laws": 21_610 },
  ],

  /** Monthly claim counts per procedure category */
  procedureTrend: (() => {
    const labels = ["Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26"];
    const series = [
      { key: "Consultation", base: 420, swing: 120 },
      { key: "Medicine", base: 560, swing: 90 },
      { key: "Diagnostics", base: 310, swing: 80 },
      { key: "Dental", base: 140, swing: 40 },
      { key: "Optical", base: 120, swing: 30 },
      { key: "Health Check", base: 96, swing: 34 },
      { key: "AYUSH", base: 64, swing: 22 },
    ];
    return labels.map((month, i) => {
      const row: Record<string, string | number> = { month };
      for (const s of series) {
        row[s.key] = Math.round(s.base + Math.sin((i + 1) * 1.7) * s.swing + int(-18, 18));
      }
      return row;
    });
  })(),

  procedureSeries: ["Consultation", "Medicine", "Diagnostics", "Dental", "Optical", "Health Check", "AYUSH"],

  /** Claimed vs approved amount by procedure */
  amountByProcedure: [
    { name: "Prescribed Medicines", claimed: 179_208_000, approved: 127_000_000 },
    { name: "Prescribed Diagnostics", claimed: 63_570_000, approved: 29_000_000 },
    { name: "Consultation", claimed: 63_365_000, approved: 39_000_000 },
    { name: "Powered & Prescribed Glasses", claimed: 58_773_000, approved: 10_000_000 },
    { name: "OPD Procedures Reimbursement", claimed: 16_270_000, approved: 8_000_000 },
    { name: "Dental Treatment", claimed: 14_820_000, approved: 7_400_000 },
    { name: "Physiotherapy", claimed: 9_640_000, approved: 5_100_000 },
  ],

  rejectionReasons: [
    { reason: "Benefit is not covered in policy — OTC products are not admissible under your OPD policy", claims: 517 },
    { reason: "Date does not match the uploaded documents. Upload the prescription corresponding to the invoice", claims: 456 },
    { reason: "Benefit is not covered in policy — Unprescribed medicines are not admissible", claims: 351 },
    { reason: "Benefit is not covered in policy — Day care procedures are not admissible under your OPD policy", claims: 297 },
    { reason: "Upload the prescription where the availed diagnostics tests were advised", claims: 242 },
    { reason: "Patient does not have proper documents, hence the claim is denied", claims: 239 },
    { reason: "Upload the prescription that includes the medicines listed in the invoice", claims: 216 },
    { reason: "Prescription is missing", claims: 208 },
    { reason: "Upload the prescription with the diagnosis / chief complaint", claims: 206 },
    { reason: "Benefit is not covered in policy — Sunglasses and powered sunglasses are not admissible", claims: 183 },
    { reason: "Benefit is not covered in policy — Cataract / Lasik surgery is not admissible", claims: 173 },
    { reason: "Upload the pharmacy invoice with GST No., batch No. and expiry date", claims: 167 },
  ],
};

export interface ClaimRow {
  sapId: string;
  claimId: string;
  status: string;
  claimDate: string;
  requestDate: string;
  procedure: string;
  reason: string;
  gender: string;
  relation: string;
  age: number;
  claimAmount: number;
  approvedAmount: number;
}

const CLAIM_STATUSES = [
  "SETTLED", "REJECTED", "CLOSED", "PENDING(DD)", "DOCUMENTS DEFICIENT", "QC CHECK",
] as const;

const PROCEDURES = [
  "PRESCRIBED MEDICINES", "PRESCRIBED DIAGNOSTICS", "CONSULTATION",
  "POWERED & PRESCRIBED GLASSES", "OPD PROCEDURES REIMBURSEMENT",
  "VISION CHECK-UP", "PHYSIOTHERAPY", "AYUSH MEDICINES", "X-RAY", "PRESCRIPTION LENS",
] as const;

export const BROAD_PROCEDURE: Record<string, string> = {
  "PRESCRIBED MEDICINES": "MEDICINE",
  "PRESCRIBED DIAGNOSTICS": "LABS",
  CONSULTATION: "CONSULTATION",
  "POWERED & PRESCRIBED GLASSES": "OPTICAL",
  "OPD PROCEDURES REIMBURSEMENT": "OPD PROCEDURES",
  "VISION CHECK-UP": "OPTICAL",
  PHYSIOTHERAPY: "OPD PROCEDURES",
  "AYUSH MEDICINES": "MEDICINE",
  "X-RAY": "DENTAL",
  "PRESCRIPTION LENS": "OPTICAL",
};

const CLAIM_REASONS = [
  "Sub-limit for respective benefit category is exhausted",
  "Upload an itemised invoice showing the medicines dispensed",
  "Benefit is not covered in policy — Unprescribed medicines",
  "Date does not match in the uploaded documents",
  "Upload a valid prescription with doctor registration number",
  "Upload the pharmacy invoice with GST No. and batch No.",
  "Claim settled in full as per policy terms",
  "Invoice already submitted in another claim",
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const someDate = (yearFrom = 2025) => `${pick(MONTHS)} ${int(1, 28)}, ${int(yearFrom, 2026)}`;

export const claimRows: ClaimRow[] = Array.from({ length: 70 }, (_, i) => {
  const status = pick(CLAIM_STATUSES);
  const claimAmount = int(200, 34_000) + Math.round(rnd() * 100) / 100;
  return {
    sapId: `10${int(100_000, 999_999)}`,
    claimId: `r-${4_000_000 + i * 173 + int(1, 160)}`,
    status,
    claimDate: someDate(),
    requestDate: someDate(2026),
    procedure: pick(PROCEDURES),
    reason: status === "SETTLED" ? "Claim settled in full as per policy terms" : pick(CLAIM_REASONS),
    gender: pick(["Male", "Female", "Unknown"]),
    relation: pick(["Self", "Wife", "Husband", "Son", "Daughter", "Mother", "Father", "Unknown"]),
    age: int(2, 78),
    claimAmount,
    approvedAmount: status === "SETTLED" ? Math.round(claimAmount * (0.7 + rnd() * 0.3)) : 0,
  };
});

/* ══════════════════════════════════════════════════════════════════════════
   4. CLAIMS MIS — TAT summary + claim dump
   ══════════════════════════════════════════════════════════════════════════ */

export interface TatBucket {
  bucket: string;
  count: number;
}

export interface TatTable {
  id: string;
  title: string;
  note: string;
  buckets: TatBucket[];
}

function withTotals(buckets: TatBucket[]) {
  const total = buckets.reduce((a, b) => a + b.count, 0);
  return {
    rows: buckets.map((b) => ({ ...b, pct: pctOf(b.count, total) })),
    total,
  };
}

export const claimsMis = {
  window: { from: "2026-04-01", to: "2026-08-31" },
  asOf: "2026-09-14T15:00:00Z",

  headline: {
    totalClaims: 114_211,
    approvedClaims: 93_558,
    approvedAmount: 123_126_611.65,
    settledAmount: 121_446_783.33,
  },

  tatTables: [
    {
      id: "visit-processing",
      title: "1. HCL Healthcare Processing TAT (Settled & Sent in DN)",
      note: "Days from claim receipt to the claim leaving processing.",
      buckets: [
        { bucket: "a. 0-3 days", count: 87_712 },
        { bucket: "b. 3-5 days", count: 4_820 },
        { bucket: "c. 5-10 days", count: 781 },
        { bucket: "d. 10-20 days", count: 625 },
        { bucket: "e. 20-30 days", count: 161 },
        { bucket: "f. 30-60 days", count: 100 },
        { bucket: "g. 60+ days", count: 12 },
      ],
    },
    {
      id: "abhi-pending",
      title: "2. Pending Settlement TAT (Sent in Debit Note)",
      note: "Ageing of claims that have been sent in a debit note but not yet settled.",
      buckets: [
        { bucket: "a. 0-3 days", count: 117 },
        { bucket: "b. 3-5 days", count: 411 },
        { bucket: "c. 5-7 days", count: 7 },
        { bucket: "e. 10-20 days", count: 33 },
        { bucket: "f. 20-30 days", count: 25 },
        { bucket: "g. 30-60 days", count: 6 },
      ],
    },
    {
      id: "overall-settlement",
      title: "3. Overall Claim Settlement TAT",
      note: "End-to-end: claim received through to money settled.",
      buckets: [
        { bucket: "a. 0-6 days", count: 85_622 },
        { bucket: "b. 6-9 days", count: 4_132 },
        { bucket: "c. 9-15 days", count: 1_761 },
        { bucket: "d. 15-30 days", count: 678 },
        { bucket: "e. 30-60 days", count: 502 },
        { bucket: "f. 60+ days", count: 208 },
      ],
    },
    {
      id: "visit-approval",
      title: "4. HCL Healthcare Approval TAT (Approved Claims)",
      note: "Days taken to approve claims routed for manual approval.",
      buckets: [
        { bucket: "a. 0-3 days", count: 50 },
        { bucket: "b. 3-5 days", count: 2 },
        { bucket: "c. 5-10 days", count: 2 },
        { bucket: "d. 10-20 days", count: 2 },
      ],
    },
    {
      id: "settlement",
      title: "5. Settlement TAT (Settled Claims)",
      note: "Days from approval to settlement in the member's account.",
      buckets: [
        { bucket: "a. 0-3 days", count: 88_189 },
        { bucket: "b. 3-5 days", count: 1_969 },
        { bucket: "c. 5-10 days", count: 2_274 },
        { bucket: "d. 10-20 days", count: 455 },
        { bucket: "e. 20-30 days", count: 5 },
        { bucket: "f. 30-60 days", count: 11 },
      ],
    },
    {
      id: "rejection",
      title: "6. HCL Healthcare Rejection TAT (Rejected Claims)",
      note: "Days taken to communicate a rejection back to the member.",
      buckets: [
        { bucket: "a. 0-3 days", count: 5_583 },
        { bucket: "b. 3-5 days", count: 5_111 },
        { bucket: "c. 5-10 days", count: 3_500 },
        { bucket: "d. 10-20 days", count: 450 },
        { bucket: "e. 20-30 days", count: 47 },
        { bucket: "f. 30-60 days", count: 51 },
      ],
    },
    {
      id: "first-action",
      title: "7. HCL Healthcare First Action TAT",
      note: "Time to the first action of any kind on a newly received claim.",
      buckets: [
        { bucket: "a. 0-3 days", count: 111_679 },
        { bucket: "b. 3-5 days", count: 1_682 },
        { bucket: "c. 5-7 days", count: 362 },
        { bucket: "d. 7-10 days", count: 241 },
        { bucket: "e. 10-20 days", count: 225 },
        { bucket: "f. 20-30 days", count: 11 },
        { bucket: "g. 30-60 days", count: 11 },
      ],
    },
    {
      id: "pending-processing",
      title: "8. HCL Healthcare Processing TAT (Pending / Pending DD)",
      note: "Ageing of claims still sitting in processing.",
      buckets: [
        { bucket: "0-3 days", count: 55 },
        { bucket: "3-5 days", count: 30 },
        { bucket: "5+ days", count: 8 },
      ],
    },
    {
      id: "dd-ageing",
      title: "9. Document Deficient Ageing (User Pendency)",
      note: "How long members have been sitting on a document request.",
      buckets: [
        { bucket: "0-10 days", count: 161 },
        { bucket: "10-20 days", count: 361 },
        { bucket: "20-30 days", count: 466 },
        { bucket: "30+ days", count: 82 },
      ],
    },
  ].map((t) => ({ ...t, ...withTotals(t.buckets) })) as (TatTable & {
    rows: (TatBucket & { pct: number })[];
    total: number;
  })[],

  benefitSummary: [
    {
      benefit: "Dental, Hearing Aids",
      claims: 13_363,
      approvedAmount: 38_673_587.14,
      disallowedAmount: 21_383_536.76,
    },
    {
      benefit: "Health Check & Investigation",
      claims: 13_633,
      approvedAmount: 14_770_558.68,
      disallowedAmount: 15_611_944.51,
    },
    {
      benefit: "Medication, Investigation",
      claims: 87_215,
      approvedAmount: 69_696_367.32,
      disallowedAmount: 39_448_276.28,
    },
  ],

  statusSummary: [
    { status: "APPROVED", claims: 56, claimed: 87_815.56, approved: 78_008.57, disallowed: 9_806.99 },
    { status: "CLOSED", claims: 4_707, claimed: 10_993_387.47, approved: 4_350, disallowed: 10_989_037.47 },
    { status: "DOCUMENTS DEFICIENT", claims: 1_070, claimed: 2_931_353.26, approved: 0, disallowed: 2_931_353.26 },
    { status: "NEFT REJECTED", claims: 9, claimed: 11_418.79, approved: 9_551.49, disallowed: 1_867.3 },
    { status: "PENDING(DD)", claims: 93, claimed: 470_335.11, approved: 0, disallowed: 470_335.11 },
    { status: "QC CHECK", claims: 32, claimed: 344_245.92, approved: 0, disallowed: 344_245.92 },
    { status: "REJECTED", claims: 14_742, claimed: 44_523_954.54, approved: 0, disallowed: 44_523_954.54 },
    { status: "SENT IN DEBIT NOTE", claims: 599, claimed: 1_959_312.91, approved: 1_601_819.75, disallowed: 357_493.16 },
    { status: "SETTLED", claims: 92_903, claimed: 138_262_447.13, approved: 121_446_783.33, disallowed: 16_815_663.8 },
  ],

  rejectionSummary: [
    { reason: "Patient does not have proper documents, hence the claim is denied", claims: 164 },
    { reason: "Consumables / disposable charges are not admissible under your OPD policy", claims: 279 },
    { reason: "Cosmetic procedures / treatments are not admissible under your OPD policy", claims: 930 },
    { reason: "Cross-pathy is not admissible under your OPD policy", claims: 260 },
    { reason: "Day care procedures are not admissible under your OPD policy", claims: 140 },
    { reason: "IPD / pre & post hospitalisation related claims are not admissible under your OPD policy", claims: 424 },
    { reason: "Non-medical expenses are not admissible under your OPD policy", claims: 688 },
    { reason: "OTC (over the counter) products are not admissible under your OPD policy", claims: 195 },
    { reason: "Only WHO-approved vaccines for children up to 5 years of age are covered", claims: 613 },
    { reason: "The 45-day window for claim submission has lapsed", claims: 2_492 },
    { reason: "Treatment related to infertility is not admissible under your OPD policy", claims: 455 },
    { reason: "Invoice already submitted in another claim", claims: 1_397 },
    { reason: "Prescription has crossed its validity period", claims: 205 },
    { reason: "Sub-limit for respective benefit category is exhausted", claims: 4_409 },
    { reason: "Sum insured exhausted", claims: 814 },
  ],
};

export interface MisRow {
  claimNo: string;
  email: string;
  employeeId: string;
  procedure: string;
  broadProcedure: string;
  status: string;
  claimedAmount: number;
  approvedAmount: number;
  utr: string;
  invoiceDate: string;
  receivedDate: string;
  ldr: string;
}

const MIS_STATUSES = ["SETTLED", "REJECTED", "CLOSED", "PENDING(DD)", "QC CHECK"] as const;

export const misRows: MisRow[] = Array.from({ length: 80 }, (_, i) => {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const procedure = pick(PROCEDURES);
  const status = pick(MIS_STATUSES);
  const claimed = int(200, 34_000);
  return {
    claimNo: `r-${4_015_000 + i * 23 + int(1, 20)}`,
    email: email(first, last),
    employeeId: String(int(51_000_000, 52_999_999)),
    procedure,
    broadProcedure: BROAD_PROCEDURE[procedure] ?? "OTHER",
    status,
    claimedAmount: claimed,
    approvedAmount: status === "SETTLED" ? Math.round(claimed * (0.65 + rnd() * 0.35)) : 0,
    utr: status === "SETTLED" ? `UTR${int(100_000_000, 999_999_999)}` : "null",
    invoiceDate: someDate(),
    receivedDate: `${pick(["Mar", "Apr", "May", "Jun", "Jul", "Aug"])} ${int(1, 28)}, 2026`,
    ldr: `${pick(["Apr", "May", "Jun", "Jul", "Aug", "Sep"])} ${int(1, 28)}, 2026`,
  };
});
