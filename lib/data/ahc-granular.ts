/**
 * Sample data for the "AHC Granular Insights" view.
 *
 * Everything here is made up for layout review: 1,251 eligible employees
 * generated from a fixed seed, so the numbers are the same on every load.
 * Lab values are kept as positions on a 0–1 track (no clinical units), so
 * nothing here states a real reference range.
 */

export const G_DIMS = {
  department: ["Engineering", "Operations", "Customer Support", "Sales", "Finance", "HR & Admin", "Marketing", "Legal & Compliance"],
  location: ["Noida", "Bengaluru", "Chennai", "Hyderabad"],
  ageGroup: ["Under 30 yrs", "30–39 yrs", "40–49 yrs", "50–59 yrs"],
  gender: ["Male", "Female"],
};
export type GKey = keyof typeof G_DIMS;
export const G_LABEL: Record<GKey, string> = { department: "Department", location: "Location", ageGroup: "Age group", gender: "Gender" };

const ELIGIBLE = [380, 240, 150, 170, 95, 76, 80, 60];
const COMPLETED = [248, 139, 104, 96, 66, 58, 46, 28];
const DIGITIZED = [222, 134, 95, 92, 64, 52, 41, 26];
const DEPT_MALE = [0.72, 0.7, 0.5, 0.66, 0.55, 0.38, 0.45, 0.5];
const LOC_W = [0.35, 0.3, 0.18, 0.17];
const AGE_W = [0.3, 0.38, 0.22, 0.1];

/** Health checks done on each weekday of the cycle (6 Jul – 14 Aug 2026). */
const DAILY = [13, 19, 27, 24, 20, 30, 38, 33, 32, 27, 36, 38, 50, 42, 30, 30, 41, 36, 29, 22, 20, 25, 24, 23, 18, 16, 14, 12, 9, 7];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const G_DAYS = DAILY.map((_, i) => {
  const date = 6 + Math.floor(i / 5) * 7 + (i % 5);
  return { label: date > 31 ? `${date - 31} Aug` : `${date} Jul`, dow: DOW[i % 5], week: Math.floor(i / 5) };
});

/**
 * Lab parameters. `lo`–`hi` is the healthy band and `mean`/`sd` the spread of
 * results, all as positions on a 0–1 track.
 */
export const G_PARAMS = [
  { key: "ldl", label: "LDL cholesterol", group: "Cholesterol", lo: 0, hi: 0.4, mean: 0.44, sd: 0.18 },
  { key: "hdl", label: "HDL cholesterol", group: "Cholesterol", lo: 0.33, hi: 0.67, mean: 0.373, sd: 0.12 },
  { key: "tc", label: "Total cholesterol", group: "Cholesterol", lo: 0, hi: 0.57, mean: 0.4, sd: 0.24 },
  { key: "tg", label: "Triglycerides", group: "Cholesterol", lo: 0, hi: 0.5, mean: 0.4, sd: 0.18 },
  { key: "fbs", label: "Fasting glucose", group: "Blood sugar", lo: 0.12, hi: 0.5, mean: 0.34, sd: 0.15 },
  { key: "hba1c", label: "HbA1c", group: "Blood sugar", lo: 0, hi: 0.4, mean: 0.33, sd: 0.17 },
  { key: "hb", label: "Haemoglobin", group: "Blood, liver, thyroid and uric acid", lo: 0.3, hi: 0.8, mean: 0.42, sd: 0.14 },
  { key: "sgpt", label: "SGPT (liver)", group: "Blood, liver, thyroid and uric acid", lo: 0, hi: 0.5, mean: 0.34, sd: 0.16 },
  { key: "sgot", label: "SGOT (liver)", group: "Blood, liver, thyroid and uric acid", lo: 0, hi: 0.5, mean: 0.33, sd: 0.165 },
  { key: "tsh", label: "TSH (thyroid)", group: "Blood, liver, thyroid and uric acid", lo: 0.05, hi: 0.62, mean: 0.33, sd: 0.2 },
  { key: "uric", label: "Uric acid", group: "Blood, liver, thyroid and uric acid", lo: 0.17, hi: 0.72, mean: 0.43, sd: 0.16 },
];
const PI = Object.fromEntries(G_PARAMS.map((p, i) => [p.key, i])) as Record<string, number>;

export interface GPerson {
  department: string;
  location: string;
  ageGroup: string;
  gender: string;
  /** Index into G_DAYS of the health check; -1 if not done yet. */
  day: number;
  digitized: boolean;
  /** Index into G_DAYS of the doctor consultation; -1 if none. */
  consultDay: number;
  /** One value per G_PARAMS entry (only meaningful when the check is done). */
  v: number[];
  /** Predicted high risk: heart disease, hypertension, diabetes. */
  risk: boolean[];
  bilirubinOk: boolean;
  plateletOk: boolean;
}

const above = (k: string) => (p: GPerson) => p.v[PI[k]] > G_PARAMS[PI[k]].hi;
const below = (k: string) => (p: GPerson) => p.v[PI[k]] < G_PARAMS[PI[k]].lo;

/** Results that need attention. `heat` marks the ones shown in the group heat map. */
export const G_FINDINGS: { label: string; short: string; heat: boolean; test: (p: GPerson) => boolean }[] = [
  { label: "High LDL cholesterol", short: "High LDL cholesterol", heat: true, test: above("ldl") },
  { label: "Low HDL cholesterol", short: "Low HDL cholesterol", heat: true, test: below("hdl") },
  { label: "Diabetic or pre-diabetic", short: "Diabetic / pre-diabetic", heat: true, test: above("hba1c") },
  { label: "High total cholesterol", short: "High total cholesterol", heat: false, test: above("tc") },
  { label: "High triglycerides", short: "High triglycerides", heat: true, test: above("tg") },
  { label: "Anaemia / low haemoglobin", short: "Anaemia / low Hb", heat: true, test: below("hb") },
  { label: "High SGPT (liver)", short: "High SGPT (liver)", heat: true, test: above("sgpt") },
  { label: "Probable thyroid issue", short: "Probable thyroid issue", heat: true, test: (p) => above("tsh")(p) || below("tsh")(p) },
  { label: "High SGOT (liver)", short: "High SGOT (liver)", heat: false, test: above("sgot") },
  { label: "High uric acid", short: "High uric acid", heat: false, test: above("uric") },
];

export const G_RISKS = [
  { label: "Heart disease (CVD)", horizon: "High risk within 5 years" },
  { label: "Hypertension", horizon: "High risk within 10 years" },
  { label: "Diabetes", horizon: "High risk within 10 years" },
];

function build(): GPerson[] {
  let s = 20260706;
  const R = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (w: number[]) => {
    let r = R() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) {
      r -= w[i];
      if (r <= 0) return i;
    }
    return w.length - 1;
  };
  /* Roughly bell-shaped, using only + and × so every browser gets the same value. */
  const z = () => (R() + R() + R() + R() - 2) * 1.7320508;

  /* One slot per completed check, in shuffled order. */
  const slots: number[] = [];
  DAILY.forEach((n, d) => {
    for (let i = 0; i < n; i++) slots.push(d);
  });
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  let slot = 0;

  const out: GPerson[] = [];
  G_DIMS.department.forEach((department, di) => {
    for (let i = 0; i < ELIGIBLE[di]; i++) {
      const li = pick(LOC_W);
      const ai = pick(AGE_W);
      const male = R() < DEPT_MALE[di];
      const done = i < COMPLETED[di];
      const day = done ? slots[slot++] : -1;

      /* Shifts, in standard deviations, that make groups differ from each other. */
      const shift: Record<string, number> = {
        ldl: -0.22 + 0.12 * ai + (department === "Finance" ? 0.4 : 0) + (department === "Sales" ? 0.3 : 0),
        hdl: (male ? -0.1 : 0.35) - (department === "Finance" ? 0.9 : 0) + (department === "Sales" ? 0.3 : 0),
        tc: -0.1 + 0.1 * ai,
        tg: -0.2 + 0.1 * ai + (department === "Sales" ? 0.5 : 0) + (li === 2 ? 0.2 : 0),
        fbs: 0.15 * ai,
        hba1c: -0.3 + 0.2 * ai + (department === "Engineering" ? 0.2 : 0) - (department === "Operations" ? 0.3 : 0) + (li === 2 ? 0.25 : 0),
        hb: (male ? 0.45 : -0.45) - (department === "HR & Admin" ? 0.4 : 0),
        sgpt: (male ? 0.1 : -0.15) + (department === "HR & Admin" ? 0.5 : 0),
        sgot: male ? 0.05 : -0.15,
        tsh: (male ? -0.25 : 0.05) + (department === "Marketing" ? 0.6 : 0),
        uric: male ? 0.5 : -0.1,
      };
      const v = G_PARAMS.map((p) => Math.min(0.98, Math.max(0.02, p.mean + p.sd * (z() + shift[p.key]))));
      const consulted = done && R() < 0.52;
      const person: GPerson = {
        department,
        location: G_DIMS.location[li],
        ageGroup: G_DIMS.ageGroup[ai],
        gender: male ? "Male" : "Female",
        day,
        digitized: i < DIGITIZED[di],
        consultDay: consulted ? Math.min(DAILY.length - 1, day + 2 + Math.floor(R() * 5)) : -1,
        v,
        risk: [],
        bilirubinOk: R() < 0.92,
        plateletOk: R() < 0.9,
      };
      person.risk = [
        R() < 0.22 + 0.08 * ai + (above("ldl")(person) ? 0.08 : 0),
        R() < 0.1 + 0.045 * ai,
        R() < 0.12 + 0.06 * ai + (above("hba1c")(person) ? 0.15 : 0),
      ];
      out.push(person);
    }
  });
  return out;
}

export const G_PEOPLE: GPerson[] = build();
