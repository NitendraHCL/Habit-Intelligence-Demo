/**
 * Chronic Risk Cohorts — dummy data for the corporate HR view.
 *
 * Rather than hand-typing every cross-tab, this file builds one synthetic
 * workforce (function, age band, gender, location) from a fixed seed, marks
 * which employees live with which chronic conditions and at what risk level,
 * and every number on the page is counted from it. That keeps the condition
 * view, the function view and every demographic split in agreement, and the
 * output is identical on every load because the generator is seeded.
 *
 * The whole workforce is generated — not only the affected employees — so
 * every figure can be shown as a share of the people in that group. Without
 * the denominators a "who is affected" chart only mirrors who works there.
 *
 * Headline figures follow the Health Insights page: 3,720 employees with a
 * chronic condition, and the unique-patient count of each of the ten largest
 * conditions (Dyslipidemia 2,142, Chronic Liver Disease 752 …). Age bands
 * match that page too.
 */

/* ─── Dimensions ───────────────────────────────────────────────────────── */

export const AGE_BANDS = ["20–35", "36–40", "41–60", "61+"] as const;
export const GENDERS = ["Male", "Female"] as const;
export const LOCATIONS = ["Bengaluru", "Chennai", "Pune", "Gurugram", "Mumbai"] as const;

export type AgeBand = (typeof AGE_BANDS)[number];
export type Gender = (typeof GENDERS)[number];
export type Location = (typeof LOCATIONS)[number];

export type TierKey = "high" | "moderate" | "early" | "stable";

/**
 * Plain-language risk levels for an HR reader. "means" and "coverage" are
 * placeholder copy — the clinical cut-offs belong to the medical officers and
 * should be confirmed with them. Indigo is left out on purpose: it is the
 * portal's brand and selection colour.
 */
export const TIERS: {
  key: TierKey;
  label: string;
  color: string;
  wash: string;
  means: string;
  /** What "reached by the care team" is called for this level; null where it doesn't apply. */
  coverage: string | null;
}[] = [
  {
    key: "high",
    label: "High Risk",
    color: "#BE123C",
    wash: "#FFF1F3",
    means: "Needs a doctor's follow-up now",
    coverage: "followed up in the last 90 days",
  },
  {
    key: "moderate",
    label: "Moderate Risk",
    color: "#F59E0B",
    wash: "#FFF8EB",
    means: "Needs regular check-ins",
    coverage: "followed up in the last 90 days",
  },
  {
    key: "early",
    label: "Early Intervention",
    color: "#0D9488",
    wash: "#ECFDF8",
    means: "Early signs — easiest to turn around",
    coverage: "joined a wellness programme",
  },
  {
    key: "stable",
    label: "Stable",
    color: "#94A3B8",
    wash: "#F4F6F9",
    means: "Under control — routine annual check",
    coverage: null,
  },
];

export const TIER_BY_KEY = Object.fromEntries(TIERS.map((t) => [t.key, t])) as Record<
  TierKey,
  (typeof TIERS)[number]
>;

/* ─── Functions ────────────────────────────────────────────────────────── */

type AgeProfile = "young" | "mid" | "older";

interface FunctionDef {
  key: string;
  name: string;
  headcount: number;
  /** Relative chronic burden; scales how many of the 3,720 land here. */
  burden: number;
  age: AgeProfile;
  femaleShare: number;
  /** Weights in LOCATIONS order. */
  locations: number[];
}

const FUNCTION_DEFS: FunctionDef[] = [
  { key: "eng", name: "Engineering", headcount: 5200, burden: 0.85, age: "young", femaleShare: 0.28, locations: [0.55, 0.12, 0.13, 0.14, 0.06] },
  { key: "support", name: "Customer Support", headcount: 2400, burden: 1.15, age: "young", femaleShare: 0.42, locations: [0.3, 0.32, 0.25, 0.08, 0.05] },
  { key: "sales", name: "Sales", headcount: 1650, burden: 1.4, age: "mid", femaleShare: 0.22, locations: [0.28, 0.08, 0.06, 0.3, 0.28] },
  { key: "infra", name: "IT Infrastructure", headcount: 1300, burden: 0.95, age: "mid", femaleShare: 0.2, locations: [0.5, 0.18, 0.12, 0.12, 0.08] },
  { key: "ops", name: "Operations & Supply Chain", headcount: 1100, burden: 1.1, age: "mid", femaleShare: 0.25, locations: [0.4, 0.2, 0.15, 0.15, 0.1] },
  { key: "finance", name: "Finance", headcount: 700, burden: 1.0, age: "mid", femaleShare: 0.4, locations: [0.5, 0.1, 0.1, 0.15, 0.15] },
  { key: "facilities", name: "Facilities & Security", headcount: 650, burden: 1.65, age: "older", femaleShare: 0.12, locations: [0.45, 0.18, 0.12, 0.15, 0.1] },
  { key: "marketing", name: "Marketing", headcount: 520, burden: 0.9, age: "young", femaleShare: 0.5, locations: [0.45, 0.05, 0.05, 0.2, 0.25] },
  { key: "hr", name: "HR & Admin", headcount: 480, burden: 0.85, age: "mid", femaleShare: 0.62, locations: [0.5, 0.12, 0.1, 0.16, 0.12] },
  { key: "legal", name: "Legal & Compliance", headcount: 200, burden: 0.95, age: "older", femaleShare: 0.45, locations: [0.5, 0.05, 0.05, 0.2, 0.2] },
];

export const FUNCTIONS = FUNCTION_DEFS.map(({ key, name, headcount }) => ({ key, name, headcount }));
export const CHRONIC_EMPLOYEES = 3720;

/** A working-age population: almost nobody past 60. */
const AGE_WEIGHTS: Record<AgeProfile, number[]> = {
  young: [0.6, 0.2, 0.198, 0.002],
  mid: [0.45, 0.24, 0.305, 0.005],
  older: [0.25, 0.2, 0.535, 0.015],
};

/** Older employees are more likely to be among the chronic cohort at all. */
const AGE_CHRONIC_LEAN = [0.75, 1.05, 1.5, 1.8];

/* ─── Conditions ───────────────────────────────────────────────────────── */

interface DiseaseDef {
  key: string;
  /** Name as the medical officers classify it — matches Health Insights. */
  name: string;
  /** Everyday wording shown beside the official name. */
  plain?: string;
  /** Unique patients, as on the Health Insights page. */
  patients: number;
  /** Share at [High, Moderate, Early Intervention, Stable] before age and co-conditions shift it. */
  mix: [number, number, number, number];
  /** Lean per function key (1 = no lean). */
  fn?: Record<string, number>;
  /** Lean per age band, in AGE_BANDS order. */
  age: number[];
  /** Lean for [Male, Female]. */
  sex: [number, number];
  /** A person can't carry both this and the named condition. */
  excludes?: string;
}

const DISEASE_DEFS: DiseaseDef[] = [
  { key: "dys", name: "Dyslipidemia", plain: "high cholesterol", patients: 2142, mix: [0.03, 0.2, 0.45, 0.32], fn: { sales: 1.3, eng: 1.1, finance: 1.1 }, age: [0.8, 1, 1.3, 1.4], sex: [1.25, 0.8] },
  { key: "cld", name: "Chronic Liver Disease", plain: "long-term liver problems", patients: 752, mix: [0.09, 0.28, 0.41, 0.22], fn: { sales: 1.6, ops: 1.2, facilities: 1.3 }, age: [0.7, 1, 1.3, 1.2], sex: [1.5, 0.55] },
  { key: "anaemia", name: "Anaemia", plain: "low haemoglobin", patients: 661, mix: [0.02, 0.13, 0.45, 0.4], fn: { support: 1.2, hr: 1.2 }, age: [1.3, 1, 0.8, 0.8], sex: [0.35, 2.6] },
  { key: "obesity", name: "Obesity", patients: 648, mix: [0.05, 0.24, 0.45, 0.26], fn: { support: 1.5, sales: 1.3, eng: 1.1 }, age: [1, 1.1, 1.1, 0.9], sex: [1, 1] },
  { key: "prediab", name: "Pre-Diabetes", plain: "borderline blood sugar", patients: 637, mix: [0, 0.07, 0.83, 0.1], fn: { support: 1.3, sales: 1.2, infra: 1.1 }, age: [0.9, 1.1, 1.2, 1.1], sex: [1.1, 0.9], excludes: "dm" },
  { key: "htn", name: "Hypertension", plain: "high blood pressure", patients: 524, mix: [0.2, 0.32, 0.26, 0.22], fn: { facilities: 1.7, sales: 1.3, ops: 1.2 }, age: [0.45, 0.9, 1.7, 2.2], sex: [1.25, 0.8] },
  { key: "msk", name: "Musculoskeletal", plain: "back, neck and joint problems", patients: 357, mix: [0.02, 0.14, 0.44, 0.4], fn: { eng: 1.3, support: 1.3, facilities: 1.5 }, age: [0.9, 1, 1.2, 1.2], sex: [1, 1] },
  { key: "thyroid", name: "Hypothyroidism", plain: "underactive thyroid", patients: 332, mix: [0.02, 0.1, 0.38, 0.5], fn: { hr: 1.2, marketing: 1.2 }, age: [0.9, 1.1, 1.1, 1], sex: [0.35, 2.6] },
  { key: "dm", name: "Diabetes (DM)", plain: "high blood sugar", patients: 279, mix: [0.26, 0.34, 0.22, 0.18], fn: { facilities: 1.8, ops: 1.2, sales: 1.2 }, age: [0.3, 0.8, 1.8, 2.4], sex: [1.2, 0.85], excludes: "prediab" },
  { key: "pcos", name: "PCOS", plain: "a hormonal condition in women", patients: 236, mix: [0.01, 0.1, 0.5, 0.39], fn: {}, age: [1.6, 0.9, 0.3, 0], sex: [0, 1] },
];

export const DISEASES = DISEASE_DEFS.map(({ key, name, plain, patients, sex }) => ({
  key,
  name,
  plain,
  patients,
  /** Women-only conditions are measured against women, not the whole team. */
  womenOnly: sex[0] === 0,
}));
export type DiseaseInfo = (typeof DISEASES)[number];

/* ─── Seeded generator ─────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261120);

function pick(weights: number[]): number {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** Splits `total` across weights so the parts sum exactly (largest remainder). */
function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((s, n) => s + n, 0);
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (left > 0) {
        out[i]++;
        left--;
      }
    });
  return out;
}

/** Weighted sample without replacement (Efraimidis–Spirakis). */
function sample<X>(items: X[], weightOf: (x: X) => number, n: number): X[] {
  return items
    .map((x) => {
      const w = weightOf(x);
      return { x, k: w > 0 ? Math.pow(rand(), 1 / w) : -1 };
    })
    .filter((e) => e.k >= 0)
    .sort((a, b) => b.k - a.k)
    .slice(0, n)
    .map((e) => e.x);
}

/* ─── Build the workforce ──────────────────────────────────────────────── */

/** Anyone on the payroll — the denominator for every share on the page. */
export interface Person {
  fn: string;
  age: AgeBand;
  gender: Gender;
  location: Location;
}

/** An employee living with at least one chronic condition. */
export interface Employee extends Person {
  /** Condition key → risk level for that condition. */
  conditions: Record<string, TierKey>;
  /** Highest risk level across all of this employee's conditions. */
  tier: TierKey;
  /** Reached by the care team — see TIERS[].coverage for what that means per level. */
  followedUp: boolean;
  /** Was at High Risk at the previous quarter's review. */
  wasHigh: boolean;
}

interface Draft {
  fn: string;
  ageIdx: number;
  sexIdx: number;
  locIdx: number;
  diseases: string[];
}

function affinity(d: DiseaseDef, e: Draft): number {
  if (d.excludes && e.diseases.includes(d.excludes)) return 0;
  return (d.fn?.[e.fn] ?? 1) * d.age[e.ageIdx] * d.sex[e.sexIdx];
}

function build(): { workforce: Person[]; cohort: Employee[] } {
  // 1. Everyone on the payroll, function by function.
  const everyone: Draft[][] = FUNCTION_DEFS.map((f) =>
    Array.from({ length: f.headcount }, () => ({
      fn: f.key,
      ageIdx: pick(AGE_WEIGHTS[f.age]),
      sexIdx: rand() < f.femaleShare ? 1 : 0,
      locIdx: pick(f.locations),
      diseases: [],
    }))
  );

  // 2. Who lives with a chronic condition: a share of each function in
  //    proportion to headcount × burden, leaning towards its older employees.
  const perFn = apportion(
    CHRONIC_EMPLOYEES,
    FUNCTION_DEFS.map((f) => f.headcount * f.burden)
  );
  const drafts = everyone.flatMap((team, fi) =>
    sample(team, (e) => AGE_CHRONIC_LEAN[e.ageIdx], perFn[fi])
  );

  // 3. Everyone in the cohort gets one condition first, drawn against what is
  //    left of each condition's patient count so no condition overshoots.
  const remaining = Object.fromEntries(DISEASE_DEFS.map((d) => [d.key, d.patients]));
  const order = [...drafts];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (const e of order) {
    const i = pick(DISEASE_DEFS.map((d) => remaining[d.key] * affinity(d, e)));
    e.diseases.push(DISEASE_DEFS[i].key);
    remaining[DISEASE_DEFS[i].key]--;
  }

  // 4. The rest of each condition's patients go to people who don't have it
  //    yet. Carrying one condition makes another slightly more likely.
  for (const d of DISEASE_DEFS) {
    const need = remaining[d.key];
    if (need <= 0) continue;
    sample(
      drafts.filter((e) => !e.diseases.includes(d.key)),
      (e) => affinity(d, e) * (1 + 0.25 * (e.diseases.length - 1)),
      need
    ).forEach((e) => e.diseases.push(d.key));
  }

  // 5. A risk level per condition: the condition's own mix, pushed towards the
  //    serious end by age and by how many conditions the person carries.
  const AGE_PUSH = [0, 0.04, 0.14, 0.24];
  const ORDER: TierKey[] = ["high", "moderate", "early", "stable"];
  const rank: Record<TierKey, number> = { stable: 0, early: 1, moderate: 2, high: 3 };
  const byKey = Object.fromEntries(DISEASE_DEFS.map((d) => [d.key, d]));
  const FOLLOW_UP: Record<TierKey, number> = { high: 0.66, moderate: 0.46, early: 0.25, stable: 0 };
  /** Chance of having been High last quarter, given today's level. */
  const WAS_HIGH: Record<TierKey, number> = { high: 0.78, moderate: 0.13, early: 0.012, stable: 0 };

  const cohort = drafts.map((e): Employee => {
    const conditions: Record<string, TierKey> = {};
    let worst: TierKey = "stable";
    const push = Math.min(0.6, AGE_PUSH[e.ageIdx] + 0.03 * (e.diseases.length - 1));
    for (const key of e.diseases) {
      const u = rand() * (1 - push);
      let cum = 0;
      let tier: TierKey = "stable";
      for (let i = 0; i < ORDER.length; i++) {
        cum += byKey[key].mix[i];
        if (u < cum) {
          tier = ORDER[i];
          break;
        }
      }
      conditions[key] = tier;
      if (rank[tier] > rank[worst]) worst = tier;
    }
    return {
      fn: e.fn,
      age: AGE_BANDS[e.ageIdx],
      gender: GENDERS[e.sexIdx],
      location: LOCATIONS[e.locIdx],
      conditions,
      tier: worst,
      followedUp: rand() < FOLLOW_UP[worst],
      wasHigh: rand() < WAS_HIGH[worst],
    };
  });

  const workforce = everyone.flat().map(
    (e): Person => ({
      fn: e.fn,
      age: AGE_BANDS[e.ageIdx],
      gender: GENDERS[e.sexIdx],
      location: LOCATIONS[e.locIdx],
    })
  );

  return { workforce, cohort };
}

const built = build();
export const WORKFORCE: Person[] = built.workforce;
export const COHORT: Employee[] = built.cohort;

/* ─── Counting helpers ─────────────────────────────────────────────────── */

export type TierCounts = Record<TierKey, number> & { total: number };

export function emptyCounts(): TierCounts {
  return { high: 0, moderate: 0, early: 0, stable: 0, total: 0 };
}

/**
 * The risk level an employee carries for the scope in view: for one condition
 * it's that condition's level, for all conditions it's their highest level.
 * Null when the employee doesn't have the condition.
 */
export function tierFor(e: Employee, disease: string | null): TierKey | null {
  if (disease === null) return e.tier;
  return e.conditions[disease] ?? null;
}

export function countBy<K extends string>(
  people: Employee[],
  disease: string | null,
  keyOf: (e: Employee) => K
): Map<K, TierCounts> {
  const out = new Map<K, TierCounts>();
  for (const e of people) {
    const tier = tierFor(e, disease);
    if (!tier) continue;
    const k = keyOf(e);
    let c = out.get(k);
    if (!c) out.set(k, (c = emptyCounts()));
    c[tier]++;
    c.total++;
  }
  return out;
}

export function totalCounts(people: Employee[], disease: string | null): TierCounts {
  return countBy(people, disease, () => "all").get("all") ?? emptyCounts();
}

/** Headcount per key; women-only conditions are measured against women. */
export function headcountBy<K extends string>(
  workforce: Person[],
  keyOf: (p: Person) => K,
  womenOnly = false
): Map<K, number> {
  const out = new Map<K, number>();
  for (const p of workforce) {
    if (womenOnly && p.gender !== "Female") continue;
    const k = keyOf(p);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

/**
 * How many people each function would have with a condition if every age and
 * gender group in it were affected at the company's rate for that group. The
 * gap between this and the real count is what the team itself adds — an older
 * or mostly-male team is not marked up just for its make-up.
 */
export function expectedByFunction(
  workforce: Person[],
  people: Employee[],
  disease: string | null
): Map<string, number> {
  const stratum = (p: Person) => `${p.age}|${p.gender}`;
  const heads = headcountBy(workforce, stratum);
  const cases = new Map<string, number>();
  for (const e of people) {
    if (!tierFor(e, disease)) continue;
    cases.set(stratum(e), (cases.get(stratum(e)) ?? 0) + 1);
  }
  const out = new Map<string, number>();
  for (const p of workforce) {
    const s = stratum(p);
    const rate = (cases.get(s) ?? 0) / (heads.get(s) ?? 1);
    out.set(p.fn, (out.get(p.fn) ?? 0) + rate);
  }
  return out;
}

export type Standing = "higher" | "similar" | "lower" | "few";

/** Fewer cases than this and a comparison is mostly noise. */
export const MIN_CASES_TO_COMPARE = 20;
/** Groups smaller than this are not broken down, so no one can be singled out. */
export const MIN_GROUP_TO_SHOW = 10;

/**
 * A team is only called out when the gap is large in both relative and
 * absolute terms — a quarter above what its make-up predicts and at least ten
 * people — so a small team can't be flagged on a handful of cases.
 */
export function standing(observed: number, expected: number): Standing {
  if (observed < MIN_CASES_TO_COMPARE) return "few";
  const gap = observed - expected;
  if (expected > 0 && observed / expected >= 1.25 && gap >= 10) return "higher";
  if (expected > 0 && observed / expected <= 0.8 && gap <= -10) return "lower";
  return "similar";
}

export const fnName = (key: string) => FUNCTIONS.find((f) => f.key === key)?.name ?? key;
export const diseaseByKey = (key: string) => DISEASES.find((d) => d.key === key);
export const diseaseName = (key: string) => diseaseByKey(key)?.name ?? key;
