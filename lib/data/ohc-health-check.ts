/**
 * Sample data for the "Annual Health Check – Chronic Disease Report" view.
 *
 * Everything here is made up for demonstration: 6,000 employees generated
 * from a fixed seed, so the numbers are the same on every load. It is to be
 * replaced with the client's Annual Health Check results.
 */

export const HC_LOCATIONS = ["Mumbai", "Delhi NCR", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata"];
const LOC_W = [1150, 1050, 1000, 800, 750, 700, 550];
const LOC_RISK: Record<string, number> = { Mumbai: 1, "Delhi NCR": 1.1, Bengaluru: 0.93, Chennai: 1.05, Hyderabad: 1, Pune: 0.9, Kolkata: 1.15 };
const LOC_SEV: Record<string, number> = { Mumbai: 0, "Delhi NCR": 0.02, Bengaluru: -0.01, Chennai: 0.01, Hyderabad: 0, Pune: -0.02, Kolkata: 0.04 };

export const HC_DEPARTMENTS = [
  "Operations",
  "Manufacturing",
  "Technology",
  "Sales & Marketing",
  "Customer Support",
  "Finance",
  "Human Resources",
  "Administration",
];
const DEPT_W = [1100, 1000, 1100, 900, 800, 500, 300, 300];
const DEPT_MALE: Record<string, number> = { Operations: 0.7, Manufacturing: 0.86, Technology: 0.64, "Sales & Marketing": 0.68, "Customer Support": 0.5, Finance: 0.56, "Human Resources": 0.4, Administration: 0.6 };
const DEPT_SEV: Record<string, number> = { Operations: 0.01, Manufacturing: 0.04, Technology: -0.01, "Sales & Marketing": 0.02, "Customer Support": 0, Finance: -0.01, "Human Resources": -0.02, Administration: 0 };

export const HC_AGES = ["20–29", "30–39", "40–49", "50–59", "60+"];
const AGE_W = [28, 34, 22, 13, 3];
export const HC_GENDERS = ["Male", "Female"];

interface DiseaseDef {
  n: string;
  sub: string;
  base: number;
  age: number[];
  m: number;
  dept: Record<string, number>;
  loc?: Record<string, number>;
  hard?: boolean;
}

export const HC_DISEASES: DiseaseDef[] = [
  { n: "High Blood Pressure", sub: "Hypertension", base: 0.13, age: [0.3, 0.7, 1.4, 2.3, 3], m: 1.25, dept: { "Sales & Marketing": 1.15, Manufacturing: 1.1 } },
  { n: "High Cholesterol", sub: "Dyslipidemia", base: 0.15, age: [0.5, 0.9, 1.3, 1.6, 1.7], m: 1.15, dept: { "Sales & Marketing": 1.15, Technology: 1.1 } },
  { n: "Obesity", sub: "BMI 30 or above", base: 0.11, age: [0.7, 1, 1.2, 1.2, 1], m: 1, dept: { Technology: 1.3, Finance: 1.15, "Customer Support": 1.15 } },
  { n: "Fatty Liver", sub: "Non-alcoholic fatty liver", base: 0.09, age: [0.6, 1, 1.3, 1.3, 1.1], m: 1.3, dept: { Technology: 1.25, "Sales & Marketing": 1.1 } },
  { n: "Diabetes", sub: "Type 2 diabetes", base: 0.075, age: [0.2, 0.6, 1.5, 2.6, 3.2], m: 1.1, dept: {}, loc: { Chennai: 1.3, Hyderabad: 1.15 } },
  { n: "Thyroid Disorder", sub: "Hypothyroidism", base: 0.06, age: [0.7, 1, 1.2, 1.3, 1.3], m: 0.35, dept: {} },
  { n: "Asthma / Lung Disease", sub: "Asthma, COPD", base: 0.035, age: [1, 0.9, 1, 1.3, 1.8], m: 1.1, dept: { Manufacturing: 1.7 }, loc: { "Delhi NCR": 1.4, Kolkata: 1.2 } },
  { n: "Heart Disease", sub: "Coronary artery disease", base: 0.014, age: [0.1, 0.4, 1.3, 3.2, 5], m: 1.8, dept: {}, hard: true },
  { n: "Kidney Disease", sub: "Chronic kidney disease", base: 0.011, age: [0.2, 0.5, 1.2, 2.6, 4], m: 1.2, dept: {}, hard: true },
];

/** Severity index: 0 mild, 1 moderate, 2 severe. */
export interface HcPerson {
  location: string;
  department: string;
  ageGroup: string;
  gender: string;
  conds: { d: number; s: number }[];
  /** Most serious condition's severity; -1 when there is no condition. */
  worst: number;
}

function generate(count: number): HcPerson[] {
  let s = 20261120;
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
  const out: HcPerson[] = [];
  for (let i = 0; i < count; i++) {
    const loc = HC_LOCATIONS[pick(LOC_W)];
    const dept = HC_DEPARTMENTS[pick(DEPT_W)];
    const ai = pick(AGE_W);
    const gender = R() < DEPT_MALE[dept] ? "Male" : "Female";
    const conds: { d: number; s: number }[] = [];
    HC_DISEASES.forEach((d, di) => {
      const p = d.base * d.age[ai] * (gender === "Male" ? d.m : 1 / d.m) * (d.dept[dept] || 1) * ((d.loc && d.loc[loc]) || 1) * LOC_RISK[loc];
      if (R() < p) {
        let w = d.hard ? [0.3, 0.45, 0.25] : [0.62, 0.31, 0.07];
        const shift = 0.025 * ai + 0.7 * (LOC_SEV[loc] + DEPT_SEV[dept]) + (gender === "Male" ? 0.008 : 0);
        w = [Math.max(0.05, w[0] - shift * 1.4), w[1] + shift * 0.4, w[2] + shift];
        conds.push({ d: di, s: pick(w) });
      }
    });
    out.push({
      location: loc,
      department: dept,
      ageGroup: HC_AGES[ai],
      gender,
      conds,
      worst: conds.length ? Math.max(...conds.map((c) => c.s)) : -1,
    });
  }
  return out;
}

export const HC_DATA: HcPerson[] = generate(6000);
