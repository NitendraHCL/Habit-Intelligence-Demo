/**
 * Deterministic visit data generator for Habit Intelligence.
 * Generates consistent patient visit data from 2024-01-01 to 2026-04-10
 * using a seeded PRNG so output is identical every run.
 */

// ── Seeded PRNG (Mulberry32) ──

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wpick<T>(rng: () => number, items: T[], w: number[]): T {
  const r = rng();
  let s = 0;
  for (let i = 0; i < items.length; i++) {
    s += w[i];
    if (r < s) return items[i];
  }
  return items[items.length - 1];
}

// ── Date Constants ──

const START = new Date(2024, 0, 1);
const END = new Date(2026, 3, 10);

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function fmtQuarter(d: Date): string {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

// ── Demographics ──

const AGE_GROUPS = ["<20", "20-35", "36-40", "41-60", "61+"];
const AGE_W = [0.03, 0.45, 0.25, 0.22, 0.05];
const AGE_RANGE: Record<string, [number, number]> = {
  "<20": [16, 19],
  "20-35": [20, 35],
  "36-40": [36, 40],
  "41-60": [41, 60],
  "61+": [61, 75],
};
const GENDERS = ["Male", "Female", "Others"];
const GENDER_W = [0.6, 0.38, 0.02];

// ── Specialties & Conditions ──

export const CISCO_SPECIALTIES = [
  "General Physician",
  "Physiotherapist",
  "Psychologist",
  "Dentist",
  "Ophthalmologist",
  "ENT Specialist",
];
const CISCO_SPEC_W = [0.32, 0.18, 0.12, 0.16, 0.13, 0.09];

export const HCL_SPECIALTIES = [
  "General Physician",
  "Physiotherapist",
  "Psychologist",
  "Dentist",
  "Ophthalmologist",
  "Dermatologist",
  "Gynecologist",
  "Cardiologist",
];
const HCL_SPEC_W = [0.26, 0.14, 0.10, 0.12, 0.10, 0.11, 0.09, 0.08];

const CONDITIONS: Record<string, string[]> = {
  "General Physician": ["Upper RTI", "Viral Fever", "Hypertension", "Diabetes Follow-up", "Headache", "Acid Reflux", "General Check-up"],
  Physiotherapist: ["Back Pain", "Neck Strain", "Joint Pain", "Shoulder Pain", "Knee Pain", "Sprain"],
  Psychologist: ["Anxiety", "Depression", "Stress", "Insomnia", "Relationship Issues", "Work Burnout"],
  Dentist: ["Dental Check-up", "Cavity", "Gum Disease", "Root Canal", "Teeth Cleaning"],
  Ophthalmologist: ["Eye Strain", "Vision Check", "Dry Eyes", "Conjunctivitis", "Myopia"],
  "ENT Specialist": ["Allergic Rhinitis", "Sinusitis", "Ear Infection", "Tonsillitis", "Vertigo"],
  Dermatologist: ["Acne", "Eczema", "Fungal Infection", "Rash", "Psoriasis"],
  Gynecologist: ["Routine Check-up", "PCOS", "Menstrual Issues", "Pregnancy Follow-up"],
  Cardiologist: ["Hypertension", "Chest Pain", "ECG Check", "Palpitations", "Cholesterol Review"],
};

export const HEALTH_CAT: Record<string, string> = {
  "Back Pain": "Musculoskeletal", "Neck Strain": "Musculoskeletal", "Joint Pain": "Musculoskeletal",
  "Shoulder Pain": "Musculoskeletal", "Knee Pain": "Musculoskeletal", Sprain: "Musculoskeletal",
  "Upper RTI": "Respiratory", "Allergic Rhinitis": "Respiratory", Sinusitis: "Respiratory", Tonsillitis: "Respiratory",
  Acne: "Dermatological", Eczema: "Dermatological", "Fungal Infection": "Dermatological", Rash: "Dermatological", Psoriasis: "Dermatological",
  "Acid Reflux": "Gastrointestinal",
  "Ear Infection": "ENT", Vertigo: "ENT",
  "Eye Strain": "Ophthalmological", "Vision Check": "Ophthalmological", "Dry Eyes": "Ophthalmological",
  Conjunctivitis: "Ophthalmological", Myopia: "Ophthalmological",
  Anxiety: "Mental Health", Depression: "Mental Health", Stress: "Mental Health",
  Insomnia: "Mental Health", "Relationship Issues": "Mental Health", "Work Burnout": "Mental Health",
  "Dental Check-up": "Dental", Cavity: "Dental", "Gum Disease": "Dental", "Root Canal": "Dental", "Teeth Cleaning": "Dental",
  Hypertension: "Cardiovascular", "Chest Pain": "Cardiovascular", "ECG Check": "Cardiovascular",
  Palpitations: "Cardiovascular", "Cholesterol Review": "Cardiovascular",
  "Diabetes Follow-up": "Metabolic",
  Headache: "General", "Viral Fever": "General", "General Check-up": "General",
  "Routine Check-up": "Gynecological", PCOS: "Gynecological", "Menstrual Issues": "Gynecological", "Pregnancy Follow-up": "Gynecological",
};

export const CHRONIC_CONDITIONS = new Set([
  "Hypertension", "Diabetes Follow-up", "Back Pain", "Anxiety", "Depression",
  "Insomnia", "PCOS", "Psoriasis", "Knee Pain",
]);

// ── CUG Configs ──

interface CugConfig {
  seed: number;
  poolSize: number;
  dailyMin: number;
  dailyMax: number;
  specialties: string[];
  specWeights: number[];
  facilities: string[];
}

const CONFIGS: Record<string, CugConfig> = {
  CISCO: {
    seed: 42,
    poolSize: 6000,
    dailyMin: 50,
    dailyMax: 55,
    specialties: CISCO_SPECIALTIES,
    specWeights: CISCO_SPEC_W,
    facilities: ["Cisco LHLC Bangalore"],
  },
  HCLTECH: {
    seed: 137,
    poolSize: 16000,
    dailyMin: 135,
    dailyMax: 150,
    specialties: HCL_SPECIALTIES,
    specWeights: HCL_SPEC_W,
    facilities: ["Noida SEC-126", "Lucknow MRC", "Chennai OMR", "Bangalore Manyata", "Hyderabad Madhapur"],
  },
};

// ── Patient ──

interface Patient {
  id: string;
  gender: string;
  ageGroup: string;
  age: number;
  relationship: string;
  weight: number;
}

function genPatients(rng: () => number, n: number, prefix: string): Patient[] {
  const out: Patient[] = [];
  for (let i = 0; i < n; i++) {
    const ag = wpick(rng, AGE_GROUPS, AGE_W);
    const [lo, hi] = AGE_RANGE[ag];
    const gender = wpick(rng, GENDERS, GENDER_W);
    const r = rng();
    const weight = r < 0.05 ? 8 : r < 0.15 ? 5 : r < 0.30 ? 3 : r < 0.50 ? 2 : 1;
    out.push({
      id: `${prefix}${String(i + 1).padStart(5, "0")}`,
      gender,
      ageGroup: ag,
      age: lo + Math.floor(rng() * (hi - lo + 1)),
      relationship: wpick(rng, ["Employee", "Dependant"], [0.75, 0.25]),
      weight,
    });
  }
  return out;
}

// ── Appointment Row ──

export interface AppointmentRow {
  slotdate: string;
  dow: number;
  hour: number;
  uhid: string;
  facility_name: string;
  speciality_name: string;
  patient_gender: string;
  age_years: number;
  relationship: string;
  condition: string;
}

// ── Aggregated Data ──

export interface CugData {
  config: CugConfig;
  totalVisits: number;
  uniquePatients: number;
  repeatPatients: number;

  bySpec: Record<string, number>;
  bySpecUnique: Record<string, number>;
  byCondition: Record<string, number>;
  byCategory: Record<string, number>;
  byFacility: Record<string, number>;
  byGender: Record<string, number>;
  byAgeGroup: Record<string, number>;
  byRelationship: Record<string, number>;

  // ageGroup|gender → count
  byAgeGender: Record<string, number>;
  // facility|specialty → count
  byFacSpec: Record<string, number>;

  byMonth: Record<string, number>;
  byMonthUnique: Record<string, number>;
  byQuarter: Record<string, number>;
  byYear: Record<string, number>;
  byYearUnique: Record<string, number>;

  // "2024-Q1|Musculoskeletal" → count
  byQuarterCat: Record<string, number>;
  // "2024|condition" → count
  byYearCondition: Record<string, number>;

  // Peak hours [dow 0-6][hour 0-23]
  dowHour: number[][];

  // Patient visit frequency distribution: visitCount → numPatients
  freqDist: Record<number, number>;

  // Chronic vs Acute
  chronicVisits: number;
  acuteVisits: number;
  chronicPatients: number;
  acutePatients: number;

  // Top condition pairs (co-occurrence across patient history)
  conditionPairs: Array<{ name: string; total: number; male: number; female: number }>;

  // Psychologist-specific
  psych: {
    visits: number;
    unique: number;
    repeat: number;
    byMonth: Record<string, number>;
    byMonthUnique: Record<string, number>;
    byCondition: Record<string, number>;
    byGender: Record<string, number>;
    byAgeGroup: Record<string, number>;
    byFacility: Record<string, number>;
  };

  // Monthly stages (completed / cancelled / noShow)
  monthlyStages: Record<string, { completed: number; cancelled: number; noShow: number; unique: number }>;

  // Monthly repeat visit data
  monthlyRepeat: Record<string, { repeatVisits: number; repeatPatients: number }>;

  // Referral data (from GP to specialist)
  referralBySpec: Record<string, number>;
  referralMonthly: Record<string, number>;
  referralByAgeGender: Array<{ ageGroup: string; gender: string; count: number }>;

  // Appointment rows
  appointments: AppointmentRow[];

  // All unique months in order
  months: string[];
  // All unique years
  years: string[];
}

// ── Increment helpers ──

function inc(obj: Record<string, number>, key: string, v = 1) {
  obj[key] = (obj[key] || 0) + v;
}
function addToSet(obj: Record<string, Set<string>>, key: string, val: string) {
  if (!obj[key]) obj[key] = new Set();
  obj[key].add(val);
}

// ── Generator ──

function generate(cugCode: string): CugData {
  const cfg = CONFIGS[cugCode] || CONFIGS.CISCO;
  const rng = mulberry32(cfg.seed);

  // Generate patient pool
  const prefix = cugCode === "CISCO" ? "CS" : "HC";
  const patients = genPatients(rng, cfg.poolSize, prefix);

  // Build weighted selection pool
  const wPool: number[] = [];
  for (let i = 0; i < patients.length; i++) {
    for (let w = 0; w < patients[i].weight; w++) wPool.push(i);
  }

  // Accumulators
  const bySpec: Record<string, number> = {};
  const bySpecUniqueS: Record<string, Set<string>> = {};
  const byCondition: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byFacility: Record<string, number> = {};
  const byGender: Record<string, number> = {};
  const byAgeGroup: Record<string, number> = {};
  const byRelationship: Record<string, number> = {};
  const byAgeGender: Record<string, number> = {};
  const byFacSpec: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byMonthUniqueS: Record<string, Set<string>> = {};
  const byQuarter: Record<string, number> = {};
  const byYear: Record<string, number> = {};
  const byYearUniqueS: Record<string, Set<string>> = {};
  const byQuarterCat: Record<string, number> = {};
  const byYearCondition: Record<string, number> = {};
  const dowHour: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const patientVisits: Record<string, number> = {};
  const patientConditionsMap: Record<string, Set<string>> = {};
  const patientGender: Record<string, string> = {};
  const patientIsChronic: Record<string, boolean> = {};
  const patientIsAcute: Record<string, boolean> = {};

  // Psych accumulators
  const pByMonth: Record<string, number> = {};
  const pByMonthUniqueS: Record<string, Set<string>> = {};
  const pByCondition: Record<string, number> = {};
  const pByGender: Record<string, number> = {};
  const pByAgeGroup: Record<string, number> = {};
  const pByFacility: Record<string, number> = {};
  const pPatientVisits: Record<string, number> = {};
  let pTotal = 0;

  // Stage accumulators
  const monthlyStages: Record<string, { completed: number; cancelled: number; noShow: number; unique: number }> = {};
  const monthlyStageUniqueS: Record<string, Set<string>> = {};

  // Repeat monthly accumulators (patients who visit >1 time that month)
  const monthlyPatientVisitCount: Record<string, Record<string, number>> = {};

  // Referral accumulators (GP patients who also visit specialist)
  const gpPatients = new Set<string>();
  const patientSpecSet: Record<string, Set<string>> = {};

  const appointments: AppointmentRow[] = [];
  let totalVisits = 0;

  // Iterate day by day
  const d = new Date(START);
  while (d <= END) {
    const dateS = fmtDate(d);
    const monthS = fmtMonth(d);
    const quarterS = fmtQuarter(d);
    const yearS = String(d.getFullYear());
    const dow = d.getDay(); // 0=Sun

    const count = cfg.dailyMin + Math.floor(rng() * (cfg.dailyMax - cfg.dailyMin + 1));
    const used = new Set<number>();
    let added = 0;
    let attempts = 0;

    while (added < count && attempts < count * 5) {
      const pidx = wPool[Math.floor(rng() * wPool.length)];
      attempts++;
      if (used.has(pidx)) continue;
      used.add(pidx);

      const p = patients[pidx];
      const spec = wpick(rng, cfg.specialties, cfg.specWeights);
      const conds = CONDITIONS[spec];
      const cond = conds[Math.floor(rng() * conds.length)];
      const fac = cfg.facilities[Math.floor(rng() * cfg.facilities.length)];
      const hour = 8 + Math.floor(rng() * 10); // 8-17

      totalVisits++;
      added++;

      // Core aggregates
      inc(bySpec, spec);
      addToSet(bySpecUniqueS, spec, p.id);
      inc(byCondition, cond);
      const cat = HEALTH_CAT[cond];
      if (cat) inc(byCategory, cat);
      inc(byFacility, fac);
      inc(byGender, p.gender);
      inc(byAgeGroup, p.ageGroup);
      inc(byRelationship, p.relationship);
      inc(byAgeGender, `${p.ageGroup}|${p.gender}`);
      inc(byFacSpec, `${fac}|${spec}`);

      // Time
      inc(byMonth, monthS);
      addToSet(byMonthUniqueS, monthS, p.id);
      inc(byQuarter, quarterS);
      inc(byYear, yearS);
      addToSet(byYearUniqueS, yearS, p.id);
      if (cat) inc(byQuarterCat, `${quarterS}|${cat}`);
      inc(byYearCondition, `${yearS}|${cond}`);

      // Peak hours
      dowHour[dow][hour]++;

      // Patient tracking
      patientVisits[p.id] = (patientVisits[p.id] || 0) + 1;
      patientGender[p.id] = p.gender;
      if (!patientConditionsMap[p.id]) patientConditionsMap[p.id] = new Set();
      patientConditionsMap[p.id].add(cond);
      if (!patientSpecSet[p.id]) patientSpecSet[p.id] = new Set();
      patientSpecSet[p.id].add(spec);

      if (CHRONIC_CONDITIONS.has(cond)) patientIsChronic[p.id] = true;
      else patientIsAcute[p.id] = true;

      if (spec === "General Physician") gpPatients.add(p.id);

      // Psych
      if (spec === "Psychologist") {
        pTotal++;
        inc(pByMonth, monthS);
        addToSet(pByMonthUniqueS, monthS, p.id);
        inc(pByCondition, cond);
        inc(pByGender, p.gender);
        inc(pByAgeGroup, p.ageGroup);
        inc(pByFacility, fac);
        pPatientVisits[p.id] = (pPatientVisits[p.id] || 0) + 1;
      }

      // Stages (80% completed, 12% cancelled, 8% noShow)
      if (!monthlyStages[monthS]) monthlyStages[monthS] = { completed: 0, cancelled: 0, noShow: 0, unique: 0 };
      if (!monthlyStageUniqueS[monthS]) monthlyStageUniqueS[monthS] = new Set();
      const sr = rng();
      if (sr < 0.80) monthlyStages[monthS].completed++;
      else if (sr < 0.92) monthlyStages[monthS].cancelled++;
      else monthlyStages[monthS].noShow++;
      if (!monthlyStageUniqueS[monthS].has(p.id)) {
        monthlyStageUniqueS[monthS].add(p.id);
        monthlyStages[monthS].unique++;
      }

      // Monthly patient visit tracking for repeat analysis
      if (!monthlyPatientVisitCount[monthS]) monthlyPatientVisitCount[monthS] = {};
      monthlyPatientVisitCount[monthS][p.id] = (monthlyPatientVisitCount[monthS][p.id] || 0) + 1;

      // Appointment row
      appointments.push({
        slotdate: dateS,
        dow,
        hour,
        uhid: p.id,
        facility_name: fac,
        speciality_name: spec,
        patient_gender: p.gender,
        age_years: p.age,
        relationship: p.relationship,
        condition: cond,
      });
    }

    d.setDate(d.getDate() + 1);
  }

  // ── Finalize aggregates ──

  const uniquePatients = Object.keys(patientVisits).length;
  let repeatPatients = 0;
  const freqDist: Record<number, number> = {};
  for (const pid of Object.keys(patientVisits)) {
    const c = patientVisits[pid];
    if (c > 1) repeatPatients++;
    freqDist[c] = (freqDist[c] || 0) + 1;
  }

  // Convert Sets to counts
  const bySpecUnique: Record<string, number> = {};
  for (const k of Object.keys(bySpecUniqueS)) bySpecUnique[k] = bySpecUniqueS[k].size;
  const byMonthUnique: Record<string, number> = {};
  for (const k of Object.keys(byMonthUniqueS)) byMonthUnique[k] = byMonthUniqueS[k].size;
  const byYearUnique: Record<string, number> = {};
  for (const k of Object.keys(byYearUniqueS)) byYearUnique[k] = byYearUniqueS[k].size;

  // Chronic vs Acute
  let chronicVisits = 0, acuteVisits = 0, chronicPatients = 0, acutePatients = 0;
  for (const pid of Object.keys(patientVisits)) {
    if (patientIsChronic[pid]) chronicPatients++;
    if (patientIsAcute[pid]) acutePatients++;
  }
  for (const [cond, cnt] of Object.entries(byCondition)) {
    if (CHRONIC_CONDITIONS.has(cond)) chronicVisits += cnt;
    else acuteVisits += cnt;
  }

  // Condition co-occurrence
  const pairMap: Record<string, { total: number; male: number; female: number }> = {};
  for (const pid of Object.keys(patientConditionsMap)) {
    const conds = Array.from(patientConditionsMap[pid]).sort();
    if (conds.length < 2) continue;
    for (let i = 0; i < conds.length - 1; i++) {
      for (let j = i + 1; j < conds.length; j++) {
        const key = `${conds[i]} + ${conds[j]}`;
        if (!pairMap[key]) pairMap[key] = { total: 0, male: 0, female: 0 };
        pairMap[key].total++;
        if (patientGender[pid] === "Male") pairMap[key].male++;
        else if (patientGender[pid] === "Female") pairMap[key].female++;
      }
    }
  }
  const conditionPairs = Object.entries(pairMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Psych finalize
  const pUnique = Object.keys(pPatientVisits).length;
  let pRepeat = 0;
  for (const c of Object.values(pPatientVisits)) {
    if (c > 1) pRepeat++;
  }
  const pByMonthUnique: Record<string, number> = {};
  for (const k of Object.keys(pByMonthUniqueS)) pByMonthUnique[k] = pByMonthUniqueS[k].size;

  // Monthly repeat
  const monthlyRepeat: Record<string, { repeatVisits: number; repeatPatients: number }> = {};
  for (const [m, pmap] of Object.entries(monthlyPatientVisitCount)) {
    let rv = 0, rp = 0;
    for (const c of Object.values(pmap)) {
      if (c > 1) { rp++; rv += c; }
    }
    monthlyRepeat[m] = { repeatVisits: rv, repeatPatients: rp };
  }

  // Referral approximation: GP patients who also saw a specialist
  const referralBySpec: Record<string, number> = {};
  const referralAgeGenderMap: Record<string, number> = {};
  for (const pid of gpPatients) {
    const specs = patientSpecSet[pid];
    if (!specs) continue;
    for (const sp of specs) {
      if (sp !== "General Physician") {
        inc(referralBySpec, sp);
        const p = patients.find((pt) => pt.id === pid);
        if (p) {
          const agKey = `${p.ageGroup}|${p.gender === "Male" ? "M" : p.gender === "Female" ? "F" : "O"}`;
          inc(referralAgeGenderMap, agKey);
        }
      }
    }
  }

  // Referral monthly (distribute total referrals across months proportionally)
  const totalReferrals = Object.values(referralBySpec).reduce((a, b) => a + b, 0);
  const referralMonthly: Record<string, number> = {};
  const totalV = totalVisits || 1;
  for (const [m, cnt] of Object.entries(byMonth)) {
    referralMonthly[m] = Math.round((cnt / totalV) * totalReferrals);
  }

  const referralByAgeGender = Object.entries(referralAgeGenderMap).map(([k, count]) => {
    const [ageGroup, gender] = k.split("|");
    return { ageGroup, gender, count };
  });

  // Sort months
  const months = Object.keys(byMonth).sort();
  const years = Object.keys(byYear).sort();

  return {
    config: cfg,
    totalVisits,
    uniquePatients,
    repeatPatients,
    bySpec,
    bySpecUnique,
    byCondition,
    byCategory,
    byFacility,
    byGender,
    byAgeGroup,
    byRelationship,
    byAgeGender,
    byFacSpec,
    byMonth,
    byMonthUnique,
    byQuarter,
    byYear,
    byYearUnique,
    byQuarterCat,
    byYearCondition,
    dowHour,
    freqDist,
    chronicVisits,
    acuteVisits,
    chronicPatients,
    acutePatients,
    conditionPairs,
    psych: {
      visits: pTotal,
      unique: pUnique,
      repeat: pRepeat,
      byMonth: pByMonth,
      byMonthUnique: pByMonthUnique,
      byCondition: pByCondition,
      byGender: pByGender,
      byAgeGroup: pByAgeGroup,
      byFacility: pByFacility,
    },
    monthlyStages,
    monthlyRepeat,
    referralBySpec,
    referralMonthly,
    referralByAgeGender,
    appointments,
    months,
    years,
  };
}

// ── Cache ──

// ── Eager init at module load ──

const cache: Record<string, CugData> = {
  CISCO: generate("CISCO"),
  HCLTECH: generate("HCLTECH"),
};

export function getCugData(cugCode: string): CugData {
  const key = cugCode === "HCLTECH" ? "HCLTECH" : "CISCO";
  return cache[key];
}
