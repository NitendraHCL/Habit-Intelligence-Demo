/**
 * Centralized hardcoded dummy data for CISCO and HCL TECH CUGs.
 * All OHC data is derived from deterministic visit generation (50-55/day CISCO, 135-150/day HCL Tech).
 * Date range: 2024-01-01 to 2026-04-10.
 */

import {
  getCugData,
  CISCO_SPECIALTIES,
  HCL_SPECIALTIES,
  HEALTH_CAT,
  CHRONIC_CONDITIONS,
  type CugData,
  type AppointmentRow,
} from "./visit-generator";

// ── Client Definitions ──

export const CLIENTS = {
  CISCO: {
    id: "cisco-001", cugId: "CISCO", cugCode: "CISCO", cugName: "CISCO", name: "CISCO",
    logo: null, industry: "Technology", workforceSize: 83000,
    hasOhc: true, hasOhcAdvanced: true, hasAhc: true, hasSmartReports: true, hasWallet: true, hasHabitApp: true,
  },
  HCLTECH: {
    id: "hcltech-001", cugId: "HCLTECH", cugCode: "HCLTECH", cugName: "HCL Tech", name: "HCL Tech",
    logo: null, industry: "IT Services", workforceSize: 227000,
    hasOhc: true, hasOhcAdvanced: true, hasAhc: true, hasSmartReports: true, hasWallet: true, hasHabitApp: true,
  },
};

export const ASSIGNED_CLIENTS = [
  { id: "cisco-001", cugName: "CISCO", cugCode: "CISCO" },
  { id: "hcltech-001", cugName: "HCL Tech", cugCode: "HCLTECH" },
];

export function getClientByCugCode(cugCode: string) {
  if (cugCode === "HCLTECH") return CLIENTS.HCLTECH;
  return CLIENTS.CISCO;
}

// ── Helpers ──

function d(cugCode: string): CugData {
  return getCugData(cugCode);
}

function topN<T>(arr: [string, T][], n: number): [string, T][] {
  return arr.sort((a, b) => {
    const va = typeof a[1] === "number" ? a[1] : 0;
    const vb = typeof b[1] === "number" ? b[1] : 0;
    return vb - va;
  }).slice(0, n);
}

function sortedEntries(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

// ── Filters ──

export function getFilters(cugCode: string) {
  const data = d(cugCode);
  return {
    genders: ["Male", "Female", "Others"],
    ageGroups: ["<20", "20-35", "36-40", "41-60", "61+"],
    locations: data.config.facilities,
    specialties: data.config.specialties,
  };
}

// ── Overview KPIs ──

export function getOverview(cugCode: string) {
  const data = d(cugCode);
  const isCisco = cugCode === "CISCO";
  return {
    kpis: {
      totalEmployees: isCisco ? 83000 : 227000,
      totalServicesAvailed: data.totalVisits,
      activeEmployees: data.uniquePatients,
      serviceCategories: 4,
      multiCategoryUsers: Math.round(data.uniquePatients * 0.15),
    },
    services: [
      {
        key: "ohc", name: "OHC",
        description: "Occupational Health Centre consultations including general physician visits, specialist appointments, and on-site clinical care.",
        totalUsers: data.uniquePatients, totalInteractions: data.totalVisits,
        href: "/portal/ohc/utilization",
      },
      {
        key: "ahc", name: "Annual Health Checks",
        description: "Annual Health Check-ups covering health risk assessments, preventive screenings, and personalised wellness recommendations.",
        totalUsers: Math.round(data.uniquePatients * 0.68), totalInteractions: Math.round(data.uniquePatients * 0.68),
        href: "/portal/ahc/utilization",
      },
      {
        key: "employee-engagement", name: "Employee Engagement & Programs",
        description: "Emotional wellbeing assessments, NPS feedback surveys, and wellness programs driving employee satisfaction and mental health.",
        totalUsers: data.psych.unique + Math.round(data.uniquePatients * 0.15),
        totalInteractions: data.psych.visits + Math.round(data.uniquePatients * 0.3),
        href: "/portal/employee-experience",
      },
      {
        key: "app-engagement", name: "Habit App Engagement",
        description: "Mobile health app usage tracking steps, sleep, meditation, yoga, challenges, and overall digital wellness engagement.",
        totalUsers: isCisco ? 3200 : 8400, totalInteractions: isCisco ? 45600 : 124000,
        href: "/portal/engagement",
      },
    ],
  };
}

// ── OHC Utilization ──

export function getOhcUtilization(cugCode: string) {
  const data = d(cugCode);
  const specs = data.config.specialties;
  const facs = data.config.facilities;
  const repeatRate = Math.round((data.repeatPatients / data.uniquePatients) * 100);

  // Demographic sunburst: ageGroup → gender → count
  const ageGroups = ["<20", "20-35", "36-40", "41-60", "61+"];
  const agColors = ["#818cf8", "#0d9488", "#d4d4d8", "#a78bfa", "#6366f1"];
  const demographicSunburst = ageGroups.map((ag, ai) => ({
    name: ag,
    itemStyle: { color: agColors[ai] },
    children: [
      { name: "M", value: data.byAgeGender[`${ag}|Male`] || 0, itemStyle: { color: "#0d9488" } },
      { name: "F", value: data.byAgeGender[`${ag}|Female`] || 0, itemStyle: { color: "#a78bfa" } },
    ],
  }));

  // Demographic stats
  const genderEntries = sortedEntries(data.byGender);
  const ageEntries = sortedEntries(data.byAgeGroup);
  const agGenderEntries = sortedEntries(data.byAgeGender);
  const topAGCombo = agGenderEntries[0]?.[0]?.split("|") || ["20-35", "Male"];
  const demographicStats = {
    totalConsults: data.totalVisits,
    uniquePatients: data.uniquePatients,
    highestCohort: {
      ageGroup: topAGCombo[0], gender: topAGCombo[1],
      count: agGenderEntries[0]?.[1] || 0,
      patients: Math.round((agGenderEntries[0]?.[1] || 0) * 0.58),
    },
    topGender: { gender: genderEntries[0]?.[0] || "Male", count: genderEntries[0]?.[1] || 0 },
    topAgeGroup: { ageGroup: ageEntries[0]?.[0] || "20-35", count: ageEntries[0]?.[1] || 0 },
  };

  // Location × Specialty
  const locationBySpecialty = facs.map((fac) => {
    const row: Record<string, unknown> = { location: fac };
    for (const sp of specs) {
      row[sp] = data.byFacSpec[`${fac}|${sp}`] || 0;
    }
    return row;
  });

  // Specialty treemap
  const specialtyTreemap = specs.map((name) => ({ name, value: data.bySpec[name] || 0 }));

  // Peak hours
  const peakHoursData: [number, number, number][] = [];
  let peakMax = 0;
  const peakCell = { day: 0, hour: 0, count: 0 };
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const HOUR_NAMES = ["12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM","7 AM","8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM","11 PM"];
  for (let day = 0; day < 7; day++) {
    for (let hour = 8; hour <= 17; hour++) {
      const count = data.dowHour[day][hour];
      peakHoursData.push([hour - 8, day, count]);
      if (count > peakMax) { peakMax = count; peakCell.day = day; peakCell.hour = hour; peakCell.count = count; }
    }
  }

  // YoY
  const y2024 = data.byYear["2024"] || 1;
  const y2025 = data.byYear["2025"] || 1;
  const y2024u = data.byYearUnique["2024"] || 1;
  const y2025u = data.byYearUnique["2025"] || 1;
  const yoyConsults = Math.round(((y2025 - y2024) / y2024) * 100);
  const yoyUnique = Math.round(((y2025u - y2024u) / y2024u) * 100);

  return {
    kpis: {
      totalConsults: data.totalVisits,
      uniquePatients: data.uniquePatients,
      repeatPatients: data.repeatPatients,
      locationCount: facs.length,
      repeatRate,
      yoyConsults,
      yoyUnique,
      yoyRepeat: Math.round(yoyConsults * 0.6),
    },
    charts: {
      demographicSunburst,
      demographicStats,
      locationBySpecialty,
      topSpecialties: specs.slice(0, 6),
      visitTrends: [],
      avgConsults: 0,
      specialtyTreemap,
      peakHours: {
        data: peakHoursData,
        max: peakMax,
        peakDay: DAY_NAMES[peakCell.day] || "Mon",
        peakHour: HOUR_NAMES[peakCell.hour] || "10 AM",
        peakCount: peakCell.count,
      },
      serviceCategories: [
        { category: "Consultation", booked: data.totalVisits, completed: Math.round(data.totalVisits * 0.92), completionRate: 92 },
        { category: "Physiotherapy", booked: data.bySpec["Physiotherapist"] || 0, completed: Math.round((data.bySpec["Physiotherapist"] || 0) * 0.88), completionRate: 88 },
        { category: "Dental Procedure", booked: data.bySpec["Dentist"] || 0, completed: Math.round((data.bySpec["Dentist"] || 0) * 0.90), completionRate: 90 },
        { category: "Eye Check-up", booked: data.bySpec["Ophthalmologist"] || 0, completed: Math.round((data.bySpec["Ophthalmologist"] || 0) * 0.94), completionRate: 94 },
        { category: "Counselling", booked: data.bySpec["Psychologist"] || 0, completed: Math.round((data.bySpec["Psychologist"] || 0) * 0.86), completionRate: 86 },
        { category: "Lab Tests", booked: Math.round(data.totalVisits * 0.35), completed: Math.round(data.totalVisits * 0.33), completionRate: 94 },
        { category: "Pharmacy", booked: Math.round(data.totalVisits * 0.42), completed: Math.round(data.totalVisits * 0.41), completionRate: 98 },
      ],
      bubbleBySpecialty: Object.fromEntries(specs.map((spec) => {
        const bubbles: Array<{ location: string; ageGroup: string; total: number; malePercent: number; male: number; female: number }> = [];
        for (const fac of facs) {
          for (const ag of ageGroups) {
            const total = data.byFacSpec[`${fac}|${spec}`]
              ? Math.round((data.byFacSpec[`${fac}|${spec}`] || 0) * (data.byAgeGroup[ag] || 0) / (data.totalVisits || 1))
              : 0;
            if (total === 0) continue;
            const maleShare = (data.byAgeGender[`${ag}|Male`] || 0);
            const femaleShare = (data.byAgeGender[`${ag}|Female`] || 0);
            const denom = maleShare + femaleShare || 1;
            const male = Math.round(total * maleShare / denom);
            const female = total - male;
            const malePercent = Math.round((male / (total || 1)) * 100);
            bubbles.push({ location: fac, ageGroup: ag, total, malePercent, male, female });
          }
        }
        return [spec, bubbles];
      })),
      bubbleSpecialties: specs,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── OHC Visit Trends ──

export function getVisitTrends(cugCode: string) {
  const data = d(cugCode);
  const visitTrends = data.months.map((period) => ({
    period,
    totalConsults: data.byMonth[period] || 0,
    uniquePatients: data.byMonthUnique[period] || 0,
  }));
  const avgConsults = visitTrends.length > 0
    ? Math.round(visitTrends.reduce((s, v) => s + v.totalConsults, 0) / visitTrends.length)
    : 0;
  return { visitTrends, avgConsults };
}

// ── OHC Repeat Trends ──

export function getRepeatTrends(cugCode: string) {
  const data = d(cugCode);
  return {
    data: data.months.map((label) => ({
      label,
      repeatVisits: data.monthlyRepeat[label]?.repeatVisits || 0,
      repeatPatients: data.monthlyRepeat[label]?.repeatPatients || 0,
    })),
  };
}

// ── OHC Appointments ──

export function getAppointments(cugCode: string) {
  const data = d(cugCode);
  return {
    rows: data.appointments.map((a: AppointmentRow) => ({
      slotdate: a.slotdate,
      dow: a.dow,
      hour: a.hour,
      uhid: a.uhid,
      facility_name: a.facility_name,
      speciality_name: a.speciality_name,
      patient_gender: a.patient_gender,
      age_years: a.age_years,
      relationship: a.relationship,
      condition: a.condition,
    })),
  };
}

// ── OHC Stage Trends ──

export function getStageTrends(cugCode: string) {
  const data = d(cugCode);
  return {
    trends: data.months.map((period) => {
      const s = data.monthlyStages[period] || { completed: 0, cancelled: 0, noShow: 0, unique: 0 };
      return { period, completed: s.completed, cancelled: s.cancelled, noShow: s.noShow, uniquePatients: s.unique };
    }),
  };
}

// ── OHC Health Insights ──

export function getHealthInsights(cugCode: string) {
  const data = d(cugCode);
  const categories = sortedEntries(data.byCategory).map(([name]) => name);
  const displayCats = categories.slice(0, 8);
  const totalDiag = Object.values(data.byCategory).reduce((a, b) => a + b, 0) || 1;

  // Category treemap (with uniquePatients and percentage)
  const categoryTreemap = displayCats.map((name) => {
    const value = data.byCategory[name] || 0;
    return { name, value, uniquePatients: Math.round(value * 0.58), percentage: Math.round((value / totalDiag) * 100) };
  });

  // Condition breakdown (with name, value, uniquePatients, percentage)
  const conditionBreakdown: Array<{ category: string; condition: string; name: string; count: number; value: number; uniquePatients: number; percentage: number }> = [];
  for (const cat of displayCats) {
    const catTotal = data.byCategory[cat] || 1;
    const conds = Object.entries(data.byCondition)
      .filter(([c]) => HEALTH_CAT[c] === cat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    for (const [condition, count] of conds) {
      conditionBreakdown.push({
        category: cat, condition, name: condition, count, value: count,
        uniquePatients: Math.round(count * 0.58),
        percentage: Math.round((count / catTotal) * 100),
      });
    }
  }

  // Quarterly category trends
  const quarters = [...new Set(Object.keys(data.byQuarterCat).map((k) => k.split("|")[0]))].sort();
  const conditionTrends = quarters.flatMap((q) =>
    displayCats.map((cat) => ({
      period: q, category: cat,
      count: data.byQuarterCat[`${q}|${cat}`] || 0,
      uniquePatients: Math.round((data.byQuarterCat[`${q}|${cat}`] || 0) * 0.58),
    }))
  ).filter((t) => t.count > 0);

  // Yearly condition trends
  const conditionTrendsYearly = data.years.flatMap((year) =>
    displayCats.map((cat) => {
      // Sum quarterly data for the year
      const yearQuarters = quarters.filter((q) => q.startsWith(year));
      const count = yearQuarters.reduce((s, q) => s + (data.byQuarterCat[`${q}|${cat}`] || 0), 0);
      return { period: year, category: cat, count, uniquePatients: Math.round(count * 0.58) };
    })
  ).filter((t) => t.count > 0);

  // Demo data: nested structure { condition: { segment: { count } } }
  const ageGroups = ["<20", "20-35", "36-40", "41-60", "61+"];
  const genders = ["Male", "Female", "Others"];
  const facilities = data.config.facilities;

  // Build condition-level demographic breakdowns
  const allConditions = Object.keys(data.byCondition).sort((a, b) => (data.byCondition[b] || 0) - (data.byCondition[a] || 0)).slice(0, 12);

  function buildDemoMap(segments: string[], totalBySegment: Record<string, number>) {
    const totalAll = Object.values(totalBySegment).reduce((a, b) => a + b, 0) || 1;
    const result: Record<string, Record<string, { count: number }>> = {};
    for (const cond of allConditions) {
      const condTotal = data.byCondition[cond] || 0;
      result[cond] = {};
      for (const seg of segments) {
        const segShare = (totalBySegment[seg] || 0) / totalAll;
        result[cond][seg] = { count: Math.round(condTotal * segShare) };
      }
    }
    return result;
  }

  const demoAge = buildDemoMap(ageGroups, Object.fromEntries(ageGroups.map((ag) => [ag, data.byAgeGroup[ag] || 0])));
  const demoGender = buildDemoMap(genders, Object.fromEntries(genders.map((g) => [g, data.byGender[g] || 0])));
  const demoLocation = buildDemoMap(facilities, Object.fromEntries(facilities.map((f) => [f, data.byFacility[f] || 0])));

  // Vitals trend (BMI, Systolic BP, Diastolic BP, SpO2)
  const vitalMonths = data.months.filter((_, i) => i % 3 === 0).slice(0, 8); // quarterly samples
  const vitalsTrend: Record<string, Array<{ period: string; belowNormal: number; withinNormal: number; aboveNormal: number; average: string }>> = {
    BMI: vitalMonths.map((period, i) => ({
      period, belowNormal: 8 - i * 0.3, withinNormal: 52 + i * 0.8, aboveNormal: 40 - i * 0.5,
      average: (25.2 - i * 0.1).toFixed(1),
    })),
    "Systolic BP": vitalMonths.map((period, i) => ({
      period, belowNormal: 5, withinNormal: 62 + i * 0.5, aboveNormal: 33 - i * 0.5,
      average: String(128 - i),
    })),
    "Diastolic BP": vitalMonths.map((period, i) => ({
      period, belowNormal: 6, withinNormal: 68 + i * 0.4, aboveNormal: 26 - i * 0.4,
      average: String(82 - i),
    })),
    SpO2: vitalMonths.map((period, i) => ({
      period, belowNormal: 3 - i * 0.2, withinNormal: 92 + i * 0.3, aboveNormal: 5,
      average: (97.2 + i * 0.1).toFixed(1),
    })),
  };

  // Seasonal trends: top conditions with monthly data
  const seasonalConditions = ["Upper RTI", "Allergic Rhinitis", "Viral Fever", "Back Pain", "Eye Strain"];
  const seasonalTrends: Record<string, Array<{ period: string; count: number }>> = {};
  for (const cond of seasonalConditions) {
    const condTotal = data.byCondition[cond] || 0;
    if (condTotal === 0) continue;
    seasonalTrends[cond] = data.months.map((period) => {
      const monthIdx = parseInt(period.split("-")[1]) - 1;
      // Seasonal variation: respiratory peaks in winter, eye strain in summer
      let seasonal = 1.0;
      if (cond === "Upper RTI" || cond === "Viral Fever") seasonal = 1 + 0.4 * Math.cos((monthIdx - 0) * Math.PI / 6);
      else if (cond === "Allergic Rhinitis") seasonal = 1 + 0.35 * Math.cos((monthIdx - 2) * Math.PI / 6);
      else if (cond === "Eye Strain") seasonal = 1 + 0.25 * Math.cos((monthIdx - 5) * Math.PI / 6);
      const monthAvg = condTotal / data.months.length;
      return { period, count: Math.round(monthAvg * seasonal) };
    });
  }

  // Symptom → Diagnosis mapping
  const symptomMapping = [
    { symptom: "Headache", diagnoses: [{ name: "Migraine", value: 35 }, { name: "Tension Headache", value: 28 }, { name: "Sinusitis", value: 20 }, { name: "Hypertension", value: 17 }] },
    { symptom: "Back Pain", diagnoses: [{ name: "Lumbar Strain", value: 40 }, { name: "Disc Herniation", value: 25 }, { name: "Postural Issue", value: 22 }, { name: "Sciatica", value: 13 }] },
    { symptom: "Cough", diagnoses: [{ name: "Upper RTI", value: 45 }, { name: "Allergic Rhinitis", value: 25 }, { name: "Bronchitis", value: 18 }, { name: "Asthma", value: 12 }] },
    { symptom: "Fatigue", diagnoses: [{ name: "Stress", value: 32 }, { name: "Anaemia", value: 22 }, { name: "Thyroid Disorder", value: 20 }, { name: "Diabetes", value: 15 }, { name: "Depression", value: 11 }] },
    { symptom: "Eye Discomfort", diagnoses: [{ name: "Digital Eye Strain", value: 42 }, { name: "Dry Eyes", value: 30 }, { name: "Refractive Error", value: 18 }, { name: "Conjunctivitis", value: 10 }] },
    { symptom: "Skin Rash", diagnoses: [{ name: "Eczema", value: 30 }, { name: "Fungal Infection", value: 28 }, { name: "Allergic Dermatitis", value: 25 }, { name: "Psoriasis", value: 17 }] },
  ];

  return {
    years: data.years,
    categories: displayCats,
    ageGroups,
    facilities,
    categoryTreemap,
    conditionBreakdown,
    chronicAcute: {
      chronicCount: data.chronicVisits,
      chronicPatients: data.chronicPatients,
      acuteCount: data.acuteVisits,
      acutePatients: data.acutePatients,
    },
    seasonalData: {
      seasonalCount: Math.round(data.totalVisits * 0.22),
      seasonalPatients: Math.round(data.uniquePatients * 0.23),
      nonSeasonalCount: Math.round(data.totalVisits * 0.78),
      nonSeasonalPatients: Math.round(data.uniquePatients * 0.77),
    },
    demoAge,
    demoGender,
    demoLocation,
    conditionTrends,
    conditionTrendsYearly,
    diseaseCombinations: data.conditionPairs.slice(0, 6),
    symptomMapping,
    vitalsTrend,
    seasonalTrends,
  };
}

// ── OHC Referral ──

export function getReferral(cugCode: string) {
  const data = d(cugCode);
  const specs = data.config.specialties;
  const facs = data.config.facilities;

  // Referral specialties: all non-GP specialties that GP patients also visited
  const refSpecs = sortedEntries(data.referralBySpec);
  const totalReferrals = refSpecs.reduce((s, [, c]) => s + c, 0);

  // Define which specialties are available in-clinic vs external
  // Some referred specialties are external-only (not staffed at OHC)
  const externalOnlySpecs = new Set(
    cugCode === "CISCO"
      ? ["Orthopedic", "Cardiologist", "Neurologist", "Dermatologist"]
      : ["Orthopedic", "Neurologist", "Pulmonologist"]
  );
  // Also mark some of the OHC specialties as partially external for realism
  const partialExternal = new Set(
    cugCode === "CISCO" ? ["ENT Specialist"] : ["Cardiologist", "Gynecologist"]
  );

  // Add external-only specialties to the referral list with synthetic counts
  const extraExternalRefs: [string, number][] = Array.from(externalOnlySpecs).map((s) => {
    const count = Math.round(totalReferrals * (0.04 + Math.abs(s.charCodeAt(0) % 5) * 0.01));
    return [s, count] as [string, number];
  });
  const allRefEntries = [...refSpecs, ...extraExternalRefs].sort((a, b) => b[1] - a[1]);
  const allRefSpecs = allRefEntries.map(([s]) => s);
  const grandTotalReferrals = allRefEntries.reduce((s, [, c]) => s + c, 0);

  const isInClinic = (s: string) => specs.includes(s) && !externalOnlySpecs.has(s) && !partialExternal.has(s);

  let availableTotal = 0;
  let convertedTotal = 0;

  // Specialty details with inClinicConsults
  const specialtyDetails = allRefEntries.slice(0, 10).map(([spec, count]) => {
    const avail = isInClinic(spec);
    const rate = avail ? (55 + Math.round(Math.random() * 25)) : 0; // deterministic enough via order
    const convRate = avail ? Math.min(Math.round(40 + count % 35), 85) : 0;
    const inClinicConsults = avail ? Math.round(count * convRate / 100) : 0;
    if (avail) { availableTotal += count; convertedTotal += inClinicConsults; }
    return {
      specialty: spec,
      from: "General Physician",
      to: spec,
      count,
      isAvailableInClinic: avail,
      referrals: count,
      converted: inClinicConsults,
      conversionRate: convRate,
      inClinicConsults,
    };
  });

  const availableInClinicPct = grandTotalReferrals > 0 ? Math.round((availableTotal / grandTotalReferrals) * 100) : 0;
  const conversionPct = availableTotal > 0 ? Math.round((convertedTotal / availableTotal) * 100) : 0;

  // Referral trends (monthly) with totalReferrals, availableInClinic, inClinicConversions
  const monthScale = grandTotalReferrals / (totalReferrals || 1);
  const referralTrends = data.months.map((period) => {
    const monthTotal = Math.round((data.referralMonthly[period] || 0) * monthScale);
    return {
      period,
      count: monthTotal,
      totalReferrals: monthTotal,
      availableInClinic: Math.round(monthTotal * availableInClinicPct / 100),
      inClinicConversions: Math.round(monthTotal * availableInClinicPct / 100 * conversionPct / 100),
    };
  });

  // Matrix: who refers to whom (GP refers to all specialists, specialists cross-refer)
  const matrixYears = data.years;
  const matrixByYear: Record<string, Array<{ referredFrom: string; referredTo: string; count: number }>> = {};
  const referringSpecs = ["General Physician", ...specs.filter((s) => s !== "General Physician").slice(0, 3)];
  const referredToSpecs = specs.filter((s) => s !== "General Physician");

  for (const year of matrixYears) {
    const yearVisits = data.byYear[year] || 0;
    const yearScale = yearVisits / (data.totalVisits || 1);
    const rows: Array<{ referredFrom: string; referredTo: string; count: number }> = [];
    for (const from of referringSpecs) {
      for (const to of referredToSpecs) {
        if (from === to) continue;
        const fromCount = data.bySpec[from] || 0;
        const toCount = data.bySpec[to] || 0;
        // Approximate cross-referral volume
        const base = Math.round(Math.sqrt(fromCount * toCount) * 0.02 * yearScale);
        if (base > 0) rows.push({ referredFrom: from, referredTo: to, count: base });
      }
    }
    matrixByYear[year] = rows;
  }

  // Demographics: ageGroup × gender for referrals
  const ageGroups = ["<20", "20-35", "36-40", "41-60", "61+"];
  const demographics = ageGroups.map((ageGroup) => {
    const maleKey = `${ageGroup}|M`;
    const femaleKey = `${ageGroup}|F`;
    const maleCount = data.referralByAgeGender.find((d) => d.ageGroup === ageGroup && d.gender === "M")?.count || 0;
    const femaleCount = data.referralByAgeGender.find((d) => d.ageGroup === ageGroup && d.gender === "F")?.count || 0;
    return { ageGroup, male: maleCount, female: femaleCount };
  }).filter((d) => d.male > 0 || d.female > 0);

  // Demographic stats
  const totalByAge: Record<string, number> = {};
  const totalByGender: Record<string, number> = {};
  for (const dm of demographics) {
    totalByAge[dm.ageGroup] = (totalByAge[dm.ageGroup] || 0) + dm.male + dm.female;
    totalByGender["Male"] = (totalByGender["Male"] || 0) + dm.male;
    totalByGender["Female"] = (totalByGender["Female"] || 0) + dm.female;
  }
  const topAge = sortedEntries(totalByAge)[0];
  const topGender = sortedEntries(totalByGender)[0];
  const topComboDemo = demographics.reduce((best, d) => {
    const maleTotal = d.male;
    const femaleTotal = d.female;
    if (maleTotal > (best?.count || 0)) return { ageGroup: d.ageGroup, gender: "Male", count: maleTotal };
    if (femaleTotal > (best?.count || 0)) return { ageGroup: d.ageGroup, gender: "Female", count: femaleTotal };
    return best;
  }, { ageGroup: "20-35", gender: "Male", count: 0 });

  // Location × Specialty referral volume
  const locationBySpecialty = facs.map((location) => {
    const row: Record<string, unknown> = { location };
    for (const spec of allRefSpecs.slice(0, 8)) {
      // Approximate per-location referral volume
      const facShare = (data.byFacility[location] || 0) / (data.totalVisits || 1);
      row[spec] = Math.round((data.referralBySpec[spec] || 0) * facShare);
    }
    return row;
  });

  const topBarSpecialties = allRefSpecs.slice(0, 8);
  const specAvailability: Record<string, boolean> = {};
  for (const s of topBarSpecialties) {
    specAvailability[s] = isInClinic(s);
  }

  return {
    kpis: {
      totalReferrals: grandTotalReferrals,
      availableInClinicCount: availableTotal,
      availableInClinicPct,
      convertedCount: convertedTotal,
      conversionPct,
    },
    charts: {
      referralTrends,
      matrixByYear,
      matrixYears,
      demographics,
      demographicStats: {
        topAgeGroup: { ageGroup: topAge?.[0] || "20-35", total: topAge?.[1] || 0, count: topAge?.[1] || 0 },
        topGender: { gender: topGender?.[0] || "Male", count: topGender?.[1] || 0 },
        topCombo: topComboDemo,
      },
      specialtyDetails,
      locationBySpecialty,
      topBarSpecialties,
      specAvailability,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── OHC Repeat Visits ──

export function getRepeatVisits(cugCode: string) {
  const data = d(cugCode);
  const totalRepeatConsults = Object.entries(data.freqDist)
    .filter(([k]) => Number(k) > 1)
    .reduce((s, [k, v]) => s + Number(k) * v, 0);

  // Frequency distribution
  const repeatVisitFrequency = [
    { visits: "2", patients: data.freqDist[2] || 0 },
    { visits: "3", patients: data.freqDist[3] || 0 },
    { visits: "4", patients: data.freqDist[4] || 0 },
    { visits: "5+", patients: Object.entries(data.freqDist).filter(([k]) => Number(k) >= 5).reduce((s, [, v]) => s + v, 0) },
  ];

  // Demographics for repeat patients (approximate from overall distribution)
  const rScale = data.repeatPatients / (data.uniquePatients || 1);

  return {
    kpis: {
      totalRepeatPatients: data.repeatPatients,
      avgVisitFrequency: data.repeatPatients > 0 ? Math.round((totalRepeatConsults / data.repeatPatients) * 10) / 10 : 0,
      totalConsultsByRepeat: totalRepeatConsults,
      avgNps: cugCode === "CISCO" ? 72 : 74,
    },
    charts: {
      chronicVsAcute: { chronic: data.chronicPatients, acute: data.acutePatients },
      demographics: {
        ageGroups: ["<20", "20-35", "36-40", "41-60", "61+"].map((label) => ({
          label, count: Math.round((data.byAgeGroup[label] || 0) * rScale),
        })),
        genderSplit: ["Male", "Female", "Others"].map((label) => ({
          label, count: Math.round((data.byGender[label] || 0) * rScale),
        })),
        locationDistribution: data.config.facilities.map((label) => ({
          label, count: Math.round((data.byFacility[label] || 0) * rScale),
        })),
      },
      repeatVisitFrequency,
      specialtyTreemap: {},
      treemapYears: [],
      conditionTransitions: [],
      visitFrequencyNps: [],
      recurringConditions: {
        chronic: Object.entries(data.byCondition)
          .filter(([c]) => CHRONIC_CONDITIONS.has(c))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([condition, count]) => ({ condition, count })),
        acute: Object.entries(data.byCondition)
          .filter(([c]) => !CHRONIC_CONDITIONS.has(c))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([condition, count]) => ({ condition, count })),
      },
      repeatUserSegments: [],
      sankeyFlow: { nodes: [], links: [] },
      vitalTotals: { v1: {}, v2: {}, v3: {} },
      cohortVisitFrequency: {},
      cohortYears: [],
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── OHC Emotional Wellbeing (derived from Psychologist visits) ──

export function getEmotionalWellbeing(cugCode: string) {
  const data = d(cugCode);
  const p = data.psych;
  const rng = mulberry32Ewb(cugCode === "CISCO" ? 999 : 1999);

  // Consult trends (monthly)
  const consultTrends = data.months.map((period) => ({
    period,
    totalConsults: p.byMonth[period] || 0,
    uniquePatients: p.byMonthUnique[period] || 0,
  }));

  // Critical risk (small % of psych patients)
  const suicidal = Math.round(p.unique * 0.006);
  const selfHarm = Math.round(p.unique * 0.003);
  const prevAttempts = Math.round(p.unique * 0.002);

  // Impressions = psych conditions
  const impressions = sortedEntries(p.byCondition).map(([label, count]) => ({ label, count }));

  // Sleep, substance, scales (derived as proportions of psych patients)
  const total = p.unique || 1;

  return {
    kpis: {
      totalConsults: p.visits,
      uniquePatients: p.unique,
      repeatPatients: p.repeat,
      totalEwbAssessed: Math.round(p.unique * 0.76),
    },
    charts: {
      demographics: {
        age: ["<20", "20-35", "36-40", "41-60", "61+"].map((label) => ({
          label, count: p.byAgeGroup[label] || 0,
        })),
        gender: ["Male", "Female", "Others"].map((label) => ({
          label, count: p.byGender[label] || 0,
        })),
        location: data.config.facilities.map((label) => ({
          label, count: p.byFacility[label] || 0,
        })),
        shift: [],
      },
      consultTrends,
      criticalRisk: {
        suicidalThoughts: suicidal,
        attemptedSelfHarm: selfHarm,
        previousAttempts: prevAttempts,
        totalCases: suicidal + selfHarm + prevAttempts,
      },
      substanceUsePct: 8,
      sleepQuality: [
        { label: "Good", count: Math.round(total * 0.48) },
        { label: "Fair", count: Math.round(total * 0.34) },
        { label: "Poor", count: Math.round(total * 0.18) },
      ],
      sleepDuration: [
        { label: "<5 hrs", count: Math.round(total * 0.07) },
        { label: "5-6 hrs", count: Math.round(total * 0.22) },
        { label: "6-7 hrs", count: Math.round(total * 0.38) },
        { label: "7-8 hrs", count: Math.round(total * 0.25) },
        { label: "8+ hrs", count: Math.round(total * 0.08) },
      ],
      alcoholHabit: [
        { label: "Never", count: Math.round(total * 0.58) },
        { label: "Occasional", count: Math.round(total * 0.30) },
        { label: "Regular", count: Math.round(total * 0.12) },
      ],
      smokingHabit: [
        { label: "Non-smoker", count: Math.round(total * 0.68) },
        { label: "Ex-smoker", count: Math.round(total * 0.18) },
        { label: "Current", count: Math.round(total * 0.14) },
      ],
      visitPattern: [],
      impressions,
      impressionSubcategories: {},
      impressionsByVisitBucket: {},
      anxietyScale: [
        { label: "Minimal", count: Math.round(total * 0.30) },
        { label: "Mild", count: Math.round(total * 0.38) },
        { label: "Moderate", count: Math.round(total * 0.22) },
        { label: "Severe", count: Math.round(total * 0.10) },
      ],
      depressionScale: [
        { label: "Minimal", count: Math.round(total * 0.35) },
        { label: "Mild", count: Math.round(total * 0.33) },
        { label: "Moderate", count: Math.round(total * 0.22) },
        { label: "Severe", count: Math.round(total * 0.10) },
      ],
      selfEsteemScale: [],
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Tiny PRNG for EWB (unused but required by reference above — kept for future use)
function mulberry32Ewb(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Engagement (Habit App — not from OHC visits) ──

export function getEngagement(cugCode: string) {
  const data = d(cugCode);
  const isCisco = cugCode === "CISCO";
  const totalEmp = isCisco ? 83000 : 227000;
  const installed = Math.round(totalEmp * 0.42);
  const loggedIn = Math.round(installed * 0.78);
  const active = isCisco ? 3200 : 8400;
  const dau = isCisco ? 420 : 1100;

  return {
    kpis: {
      totalEmployeesWithAccess: totalEmp,
      appInstalled: installed,
      installRate: Math.round((installed / totalEmp) * 100),
      loggedIn,
      loginRate: Math.round((loggedIn / installed) * 100),
      activeUsers: active,
      activeRate: Math.round((active / loggedIn) * 100),
      avgDailyActiveUsers: dau,
      avgSteps: isCisco ? 6840 : 7200,
      avgSleepHours: 6.8,
      challengeParticipation: isCisco ? 1240 : 3300,
      webinarAttendance: isCisco ? 680 : 1800,
    },
    adoptionFunnel: [
      { stage: "Employees with Access", value: totalEmp },
      { stage: "App Installed", value: installed },
      { stage: "Logged In (at least once)", value: loggedIn },
      { stage: "Active Users (30d)", value: active },
      { stage: "Daily Active Users", value: dau },
    ],
    platformUsage: [
      { name: "Steps Tracking", value: Math.round(active * 0.88) },
      { name: "Sleep Tracking", value: Math.round(active * 0.66) },
      { name: "Meditation", value: Math.round(active * 0.44) },
      { name: "Challenges", value: Math.round(active * 0.39) },
      { name: "Yoga", value: Math.round(active * 0.28) },
      { name: "Health Articles", value: Math.round(active * 0.52) },
    ],
    stepsEngagement: {
      avgStepsPerDay: isCisco ? 6840 : 7200,
      crossingThresholds: { "above5000%": 68, "above7500%": 42, "above10000%": 18 },
      monthly: [
        { month: "2024-07", avgSteps: isCisco ? 6200 : 6800, pctAbove5K: 62, pctAbove10K: 14 },
        { month: "2024-08", avgSteps: isCisco ? 6400 : 6900, pctAbove5K: 64, pctAbove10K: 15 },
        { month: "2024-09", avgSteps: isCisco ? 6600 : 7000, pctAbove5K: 65, pctAbove10K: 16 },
        { month: "2024-10", avgSteps: isCisco ? 6700 : 7100, pctAbove5K: 66, pctAbove10K: 17 },
        { month: "2024-11", avgSteps: isCisco ? 6800 : 7150, pctAbove5K: 67, pctAbove10K: 17 },
        { month: "2024-12", avgSteps: isCisco ? 6840 : 7200, pctAbove5K: 68, pctAbove10K: 18 },
        { month: "2025-01", avgSteps: isCisco ? 6900 : 7250, pctAbove5K: 69, pctAbove10K: 19 },
        { month: "2025-02", avgSteps: isCisco ? 7000 : 7300, pctAbove5K: 70, pctAbove10K: 20 },
      ],
    },
    challengeEngagement: {
      totalChallenges: isCisco ? 24 : 48,
      avgParticipationRate: isCisco ? 38 : 42,
      completionRate: isCisco ? 72 : 76,
      monthly: [
        { month: "2024-07", participants: isCisco ? 180 : 480, completionRate: 68 },
        { month: "2024-08", participants: isCisco ? 200 : 520, completionRate: 70 },
        { month: "2024-09", participants: isCisco ? 220 : 560, completionRate: 71 },
        { month: "2024-10", participants: isCisco ? 210 : 540, completionRate: 72 },
        { month: "2024-11", participants: isCisco ? 230 : 600, completionRate: 73 },
        { month: "2024-12", participants: isCisco ? 240 : 620, completionRate: 74 },
        { month: "2025-01", participants: isCisco ? 250 : 650, completionRate: 75 },
        { month: "2025-02", participants: isCisco ? 260 : 680, completionRate: 76 },
      ],
    },
    webinarEngagement: {
      totalWebinars: isCisco ? 18 : 36,
      avgAttendanceRate: isCisco ? 45 : 52,
      avgRating: isCisco ? 4.2 : 4.4,
      monthly: [
        { month: "2024-07", attendees: isCisco ? 95 : 250, rating: 4.1 },
        { month: "2024-08", attendees: isCisco ? 100 : 260, rating: 4.2 },
        { month: "2024-09", attendees: isCisco ? 110 : 280, rating: 4.2 },
        { month: "2024-10", attendees: isCisco ? 105 : 270, rating: 4.3 },
        { month: "2024-11", attendees: isCisco ? 115 : 300, rating: 4.3 },
        { month: "2024-12", attendees: isCisco ? 120 : 310, rating: 4.4 },
        { month: "2025-01", attendees: isCisco ? 125 : 320, rating: 4.4 },
        { month: "2025-02", attendees: isCisco ? 130 : 340, rating: 4.5 },
      ],
    },
    engagementTrends: [
      { month: "2024-07", activeUsers: isCisco ? 2800 : 7400, stepsAvg: isCisco ? 6200 : 6800, challengeUsers: isCisco ? 180 : 480, webinarUsers: isCisco ? 95 : 250 },
      { month: "2024-08", activeUsers: isCisco ? 2900 : 7600, stepsAvg: isCisco ? 6400 : 6900, challengeUsers: isCisco ? 200 : 520, webinarUsers: isCisco ? 100 : 260 },
      { month: "2024-09", activeUsers: isCisco ? 3000 : 7900, stepsAvg: isCisco ? 6600 : 7000, challengeUsers: isCisco ? 220 : 560, webinarUsers: isCisco ? 110 : 280 },
      { month: "2024-10", activeUsers: isCisco ? 3100 : 8100, stepsAvg: isCisco ? 6700 : 7100, challengeUsers: isCisco ? 210 : 540, webinarUsers: isCisco ? 105 : 270 },
      { month: "2024-11", activeUsers: isCisco ? 3150 : 8300, stepsAvg: isCisco ? 6800 : 7150, challengeUsers: isCisco ? 230 : 600, webinarUsers: isCisco ? 115 : 300 },
      { month: "2024-12", activeUsers: isCisco ? 3200 : 8400, stepsAvg: isCisco ? 6840 : 7200, challengeUsers: isCisco ? 240 : 620, webinarUsers: isCisco ? 120 : 310 },
      { month: "2025-01", activeUsers: isCisco ? 3250 : 8500, stepsAvg: isCisco ? 6900 : 7250, challengeUsers: isCisco ? 250 : 650, webinarUsers: isCisco ? 125 : 320 },
      { month: "2025-02", activeUsers: isCisco ? 3300 : 8600, stepsAvg: isCisco ? 7000 : 7300, challengeUsers: isCisco ? 260 : 680, webinarUsers: isCisco ? 130 : 340 },
    ],
    cohortAnalysis: {
      byDepartment: [
        { name: "Engineering", activeUsers: Math.round(active * 0.35), avgSteps: 7200, challengeRate: 42, webinarRate: 38 },
        { name: "Sales", activeUsers: Math.round(active * 0.20), avgSteps: 6500, challengeRate: 48, webinarRate: 52 },
        { name: "Operations", activeUsers: Math.round(active * 0.18), avgSteps: 7800, challengeRate: 55, webinarRate: 35 },
        { name: "HR", activeUsers: Math.round(active * 0.12), avgSteps: 6200, challengeRate: 62, webinarRate: 68 },
        { name: "Finance", activeUsers: Math.round(active * 0.15), avgSteps: 5800, challengeRate: 35, webinarRate: 45 },
      ],
      byAgeGroup: [
        { name: "<20", activeUsers: Math.round(active * 0.03), avgSteps: 8200, challengeRate: 65, webinarRate: 22 },
        { name: "20-35", activeUsers: Math.round(active * 0.48), avgSteps: 7400, challengeRate: 52, webinarRate: 38 },
        { name: "36-40", activeUsers: Math.round(active * 0.22), avgSteps: 6800, challengeRate: 40, webinarRate: 45 },
        { name: "41-60", activeUsers: Math.round(active * 0.24), avgSteps: 5900, challengeRate: 28, webinarRate: 55 },
        { name: "61+", activeUsers: Math.round(active * 0.03), avgSteps: 4500, challengeRate: 18, webinarRate: 62 },
      ],
      byLocation: data.config.facilities.map((name, i) => ({
        name, activeUsers: Math.round(active / data.config.facilities.length),
        avgSteps: 6800 - i * 200, challengeRate: 45 - i * 3, webinarRate: 40 + i * 2,
      })),
    },
    deviceBreakdown: [
      { device: "Android", count: Math.round(active * 0.60) },
      { device: "iOS", count: Math.round(active * 0.40) },
    ],
    featureUsage: [
      { feature: "Steps Tracking", users: Math.round(active * 0.88) },
      { feature: "Sleep Tracking", users: Math.round(active * 0.66) },
      { feature: "Meditation", users: Math.round(active * 0.44) },
      { feature: "Challenges", users: Math.round(active * 0.39) },
      { feature: "Yoga", users: Math.round(active * 0.28) },
    ],
    retentionCohort: [
      { cohort: "Week 1", retained: 100 },
      { cohort: "Week 2", retained: 78 },
      { cohort: "Week 4", retained: 62 },
      { cohort: "Week 8", retained: 48 },
      { cohort: "Week 12", retained: 38 },
    ],
  };
}

// ── NPS ──

export function getNps(cugCode: string) {
  const data = d(cugCode);
  const isCisco = cugCode === "CISCO";
  const specs = data.config.specialties;
  const totalResp = Math.round(data.uniquePatients * 0.45);
  return {
    kpis: {
      overallNPS: isCisco ? 68 : 72,
      totalResponses: totalResp,
      promotersPct: isCisco ? 52 : 56,
      passivesPct: isCisco ? 32 : 28,
      detractorsPct: 16,
      responseRate: isCisco ? 45 : 48,
      yoyChange: isCisco ? 5 : 8,
    },
    charts: {
      npsTrends: [
        { month: "Jan", period: "2024-01", nps: isCisco ? 60 : 63, responses: Math.round(totalResp * 0.07), promotersPct: isCisco ? 44 : 48, passivesPct: 35, detractorsPct: 21 },
        { month: "Feb", period: "2024-02", nps: isCisco ? 58 : 61, responses: Math.round(totalResp * 0.06), promotersPct: isCisco ? 42 : 46, passivesPct: 36, detractorsPct: 22 },
        { month: "Mar", period: "2024-03", nps: isCisco ? 62 : 65, responses: Math.round(totalResp * 0.07), promotersPct: isCisco ? 46 : 50, passivesPct: 34, detractorsPct: 20 },
        { month: "Apr", period: "2024-04", nps: isCisco ? 64 : 67, responses: Math.round(totalResp * 0.08), promotersPct: isCisco ? 47 : 51, passivesPct: 34, detractorsPct: 19 },
        { month: "May", period: "2024-05", nps: isCisco ? 63 : 66, responses: Math.round(totalResp * 0.08), promotersPct: isCisco ? 46 : 50, passivesPct: 35, detractorsPct: 19 },
        { month: "Jun", period: "2024-06", nps: isCisco ? 66 : 69, responses: Math.round(totalResp * 0.09), promotersPct: isCisco ? 49 : 53, passivesPct: 33, detractorsPct: 18 },
        { month: "Jul", period: "2024-07", nps: isCisco ? 65 : 68, responses: Math.round(totalResp * 0.08), promotersPct: isCisco ? 48 : 52, passivesPct: 34, detractorsPct: 18 },
        { month: "Aug", period: "2024-08", nps: isCisco ? 67 : 71, responses: Math.round(totalResp * 0.09), promotersPct: isCisco ? 50 : 55, passivesPct: 32, detractorsPct: 18 },
        { month: "Sep", period: "2024-09", nps: isCisco ? 68 : 72, responses: Math.round(totalResp * 0.09), promotersPct: isCisco ? 51 : 56, passivesPct: 32, detractorsPct: 17 },
        { month: "Oct", period: "2024-10", nps: isCisco ? 66 : 70, responses: Math.round(totalResp * 0.08), promotersPct: isCisco ? 49 : 54, passivesPct: 33, detractorsPct: 18 },
        { month: "Nov", period: "2024-11", nps: isCisco ? 70 : 74, responses: Math.round(totalResp * 0.10), promotersPct: isCisco ? 53 : 57, passivesPct: 31, detractorsPct: 16 },
        { month: "Dec", period: "2024-12", nps: isCisco ? 72 : 76, responses: Math.round(totalResp * 0.11), promotersPct: isCisco ? 55 : 59, passivesPct: 30, detractorsPct: 15 },
      ],
      bySpecialty: specs.slice(0, 6).map((specialty, i) => ({
        specialty,
        name: specialty,
        nps: (isCisco ? 70 : 74) - i * 2 + (specialty === "Physiotherapist" ? 5 : 0),
        responses: Math.round((data.bySpecUnique[specialty] || 0) * 0.45),
        value: Math.round((data.bySpecUnique[specialty] || 0) * 0.45),
      })),
      byServiceCategory: [
        { category: "Consultation", nps: isCisco ? 70 : 74 },
        { category: "Physiotherapy", nps: isCisco ? 75 : 78 },
        { category: "Dental", nps: isCisco ? 66 : 70 },
        { category: "Eye Care", nps: isCisco ? 72 : 76 },
        { category: "Counselling", nps: isCisco ? 74 : 77 },
        { category: "Lab Tests", nps: isCisco ? 68 : 72 },
        { category: "Pharmacy", nps: isCisco ? 71 : 75 },
      ],
      byDiagnosisCategory: data.config.facilities.map((name, i) => ({
        name,
        value: Math.round((data.byFacility[name] || 0) * 0.45),
        nps: (isCisco ? 68 : 72) + (i % 2 === 0 ? 3 : -2),
      })),
      demographics: (() => {
        // Demographics uses ageGroup=location, gender=channel, responses=count
        const facs = data.config.facilities;
        const channels = ["WC", "ONLINE", "INCLINIC"];
        const channelWeights = [0.35, 0.30, 0.35];
        const items: Array<{ ageGroup: string; gender: string; nps: number; count: number; responses: number }> = [];
        for (const fac of facs) {
          const facResp = Math.round((data.byFacility[fac] || totalResp) * 0.45 / (facs.length || 1));
          channels.forEach((ch, ci) => {
            const resp = Math.round(facResp * channelWeights[ci]);
            if (resp > 0) items.push({ ageGroup: fac, gender: ch, nps: (isCisco ? 66 : 70) + ci * 2, count: resp, responses: resp });
          });
        }
        return items;
      })(),
      demoSummary: (() => {
        const facs = data.config.facilities;
        const topFac = facs[0] || "";
        const topFacResp = Math.round(totalResp * 0.35 / (facs.length || 1));
        return {
          highestCount: topFacResp,
          highestAgeGroup: topFac,
          highestGender: "WC",
          topGender: "Online/WC",
          topGenderCount: Math.round(totalResp * 0.35),
          topAgeGroup: topFac,
          topAgeGroupCount: Math.round(totalResp / (facs.length || 1)),
        };
      })(),
      byVisitFrequency: [
        { visits: "1", nps: isCisco ? 60 : 64, feedbacks: Math.round(totalResp * 0.35), npsPct: isCisco ? 60 : 64 },
        { visits: "2-3", nps: isCisco ? 68 : 72, feedbacks: Math.round(totalResp * 0.40), npsPct: isCisco ? 68 : 72 },
        { visits: "4+", nps: isCisco ? 74 : 78, feedbacks: Math.round(totalResp * 0.25), npsPct: isCisco ? 74 : 78 },
      ],
      wordCloud: [
        { word: "Helpful", count: isCisco ? 280 : 750, sentiment: "positive" },
        { word: "Quick", count: isCisco ? 220 : 590, sentiment: "positive" },
        { word: "Professional", count: isCisco ? 200 : 540, sentiment: "positive" },
        { word: "Friendly", count: isCisco ? 180 : 480, sentiment: "positive" },
        { word: "Clean", count: isCisco ? 150 : 400, sentiment: "positive" },
        { word: "Wait time", count: isCisco ? 120 : 320, sentiment: "negative" },
        { word: "Convenient", count: isCisco ? 110 : 300, sentiment: "positive" },
        { word: "Caring", count: isCisco ? 100 : 270, sentiment: "positive" },
        { word: "Knowledgeable", count: isCisco ? 95 : 250, sentiment: "positive" },
        { word: "Appointment delay", count: isCisco ? 85 : 220, sentiment: "negative" },
        { word: "Thorough", count: isCisco ? 80 : 210, sentiment: "positive" },
        { word: "Crowded", count: isCisco ? 70 : 185, sentiment: "negative" },
        { word: "Follow-up", count: isCisco ? 65 : 170, sentiment: "positive" },
        { word: "Slow process", count: isCisco ? 60 : 160, sentiment: "negative" },
        { word: "Empathetic", count: isCisco ? 55 : 145, sentiment: "positive" },
        { word: "Parking", count: isCisco ? 45 : 120, sentiment: "negative" },
      ],
      topPositive: { word: "Doctors are very helpful and professional", count: isCisco ? 180 : 480 },
      topConcern: { word: "Wait time could be shorter during peak hours", count: isCisco ? 95 : 250 },
    },
  };
}

// ── LSMP ──

export function getLsmp(cugCode: string) {
  const data = d(cugCode);
  const isCisco = cugCode === "CISCO";
  const enrolled = Math.round(data.uniquePatients * 0.28);
  return {
    kpis: {
      totalEnrollments: { value: enrolled, trend: 12, trendLabel: "vs Last Year" },
      activeInCarePlan: { value: Math.round(enrolled * 0.56), trend: 8, trendLabel: "Last Month" },
      completionRate: { value: isCisco ? 64 : 68, trend: 5, trendLabel: "vs Target" },
      overallImprovement: { value: isCisco ? 72 : 76, trend: 3, trendLabel: "Last Quarter" },
      avgDuration: { value: isCisco ? 45 : 42, trend: -2, trendLabel: "days vs avg" },
    },
    carePlanDistribution: [
      { plan: "Weight Management", enrolled: Math.round(enrolled * 0.29) },
      { plan: "Diabetes Care", enrolled: Math.round(enrolled * 0.21) },
      { plan: "Hypertension", enrolled: Math.round(enrolled * 0.19) },
      { plan: "Stress Management", enrolled: Math.round(enrolled * 0.17) },
      { plan: "Back Pain", enrolled: Math.round(enrolled * 0.14) },
    ],
    ageGroupDistribution: ["20-35", "36-40", "41-60", "61+"].map((ag) => ({
      name: ag, value: Math.round((data.byAgeGroup[ag] || 0) * 0.28),
    })),
    genderDistribution: ["Male", "Female", "Others"].map((gender) => ({
      gender, value: Math.round((data.byGender[gender] || 0) * 0.28),
    })),
    improvementStatus: [
      { status: "Improved", count: Math.round(enrolled * 0.47) },
      { status: "Stable", count: Math.round(enrolled * 0.33) },
      { status: "Declined", count: Math.round(enrolled * 0.08) },
      { status: "Not Assessed", count: Math.round(enrolled * 0.12) },
    ],
    complianceStatus: [
      { name: "High", value: Math.round(enrolled * 0.40) },
      { name: "Medium", value: Math.round(enrolled * 0.36) },
      { name: "Low", value: Math.round(enrolled * 0.24) },
    ],
    locationDistribution: data.config.facilities.map((location) => ({
      location, patients: Math.round((data.byFacility[location] || 0) * 0.28),
    })),
    carePlanTrends: [
      { period: "2024-Q1", month: "Q1 2024", enrollments: Math.round(enrolled * 0.22), completions: Math.round(enrolled * 0.12), primeHealth: Math.round(enrolled * 0.06), supremeHealth: Math.round(enrolled * 0.05), calorieFit: Math.round(enrolled * 0.04), proHealth: Math.round(enrolled * 0.04) },
      { period: "2024-Q2", month: "Q2 2024", enrollments: Math.round(enrolled * 0.24), completions: Math.round(enrolled * 0.14), primeHealth: Math.round(enrolled * 0.07), supremeHealth: Math.round(enrolled * 0.06), calorieFit: Math.round(enrolled * 0.05), proHealth: Math.round(enrolled * 0.04) },
      { period: "2024-Q3", month: "Q3 2024", enrollments: Math.round(enrolled * 0.26), completions: Math.round(enrolled * 0.17), primeHealth: Math.round(enrolled * 0.08), supremeHealth: Math.round(enrolled * 0.06), calorieFit: Math.round(enrolled * 0.05), proHealth: Math.round(enrolled * 0.05) },
      { period: "2024-Q4", month: "Q4 2024", enrollments: Math.round(enrolled * 0.28), completions: Math.round(enrolled * 0.18), primeHealth: Math.round(enrolled * 0.08), supremeHealth: Math.round(enrolled * 0.07), calorieFit: Math.round(enrolled * 0.06), proHealth: Math.round(enrolled * 0.05) },
      { period: "2025-Q1", month: "Q1 2025", enrollments: Math.round(enrolled * 0.29), completions: Math.round(enrolled * 0.19), primeHealth: Math.round(enrolled * 0.09), supremeHealth: Math.round(enrolled * 0.07), calorieFit: Math.round(enrolled * 0.06), proHealth: Math.round(enrolled * 0.05) },
      { period: "2025-Q2", month: "Q2 2025", enrollments: Math.round(enrolled * 0.30), completions: Math.round(enrolled * 0.20), primeHealth: Math.round(enrolled * 0.09), supremeHealth: Math.round(enrolled * 0.07), calorieFit: Math.round(enrolled * 0.06), proHealth: Math.round(enrolled * 0.06) },
      { period: "2025-Q3", month: "Q3 2025", enrollments: Math.round(enrolled * 0.31), completions: Math.round(enrolled * 0.21), primeHealth: Math.round(enrolled * 0.09), supremeHealth: Math.round(enrolled * 0.08), calorieFit: Math.round(enrolled * 0.06), proHealth: Math.round(enrolled * 0.06) },
      { period: "2025-Q4", month: "Q4 2025", enrollments: Math.round(enrolled * 0.32), completions: Math.round(enrolled * 0.22), primeHealth: Math.round(enrolled * 0.10), supremeHealth: Math.round(enrolled * 0.08), calorieFit: Math.round(enrolled * 0.07), proHealth: Math.round(enrolled * 0.06) },
    ],
    improvementVsDuration: [
      { duration: "< 30 days", improved: isCisco ? 45 : 48, improvement: Math.round(enrolled * 0.12), partial: Math.round(enrolled * 0.08), noChange: Math.round(enrolled * 0.06), inconclusive: Math.round(enrolled * 0.03) },
      { duration: "30-60 days", improved: isCisco ? 68 : 72, improvement: Math.round(enrolled * 0.18), partial: Math.round(enrolled * 0.06), noChange: Math.round(enrolled * 0.04), inconclusive: Math.round(enrolled * 0.02) },
      { duration: "60-90 days", improved: isCisco ? 78 : 82, improvement: Math.round(enrolled * 0.22), partial: Math.round(enrolled * 0.05), noChange: Math.round(enrolled * 0.02), inconclusive: Math.round(enrolled * 0.01) },
      { duration: "90+ days", improved: isCisco ? 85 : 88, improvement: Math.round(enrolled * 0.25), partial: Math.round(enrolled * 0.04), noChange: Math.round(enrolled * 0.01), inconclusive: Math.round(enrolled * 0.01) },
    ],
    complianceTriggerPattern: {
      rows: ["Weight Management", "Diabetes Care", "Hypertension", "Stress Management", "Back Pain"],
      columns: ["20-35", "36-40", "41-60", "61+"],
      data: [
        [Math.round(enrolled * 0.08), Math.round(enrolled * 0.06), Math.round(enrolled * 0.05), Math.round(enrolled * 0.02)],
        [Math.round(enrolled * 0.04), Math.round(enrolled * 0.05), Math.round(enrolled * 0.07), Math.round(enrolled * 0.03)],
        [Math.round(enrolled * 0.03), Math.round(enrolled * 0.04), Math.round(enrolled * 0.06), Math.round(enrolled * 0.04)],
        [Math.round(enrolled * 0.06), Math.round(enrolled * 0.04), Math.round(enrolled * 0.03), Math.round(enrolled * 0.01)],
        [Math.round(enrolled * 0.04), Math.round(enrolled * 0.04), Math.round(enrolled * 0.03), Math.round(enrolled * 0.01)],
      ],
    },
  };
}

// ── Correlations ──

export function getCorrelations(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const data = d(cugCode);
  const totalEmp = isCisco ? 83000 : 227000;
  return {
    ohcToAhc: {
      ohcActiveUsersPct: Math.round((data.uniquePatients / totalEmp) * 100),
      ohcActiveUsers: data.uniquePatients,
      totalEmployees: totalEmp,
      ahcCompletionPct: isCisco ? 62 : 58,
      ahcCompleted: Math.round(totalEmp * (isCisco ? 0.62 : 0.58)),
      ahcEligible: totalEmp,
    },
    ahcToOhc: {
      abnormalFindings: Math.round(totalEmp * (isCisco ? 0.18 : 0.15)),
      ohcFollowUpPct: isCisco ? 45 : 52,
    },
    mentalPhysical: [
      { left: "Stress (Psychologist)", right: "Hypertension (GP)", strength: "Strong", value: 0.72 },
      { left: "Anxiety (Psychologist)", right: "Insomnia (Psychologist)", strength: "Strong", value: 0.68 },
      { left: "Depression (Psychologist)", right: "Back Pain (Physio)", strength: "Moderate", value: 0.54 },
      { left: "Work Burnout (Psychologist)", right: "Headache (GP)", strength: "Moderate", value: 0.48 },
      { left: "Insomnia (Psychologist)", right: "Eye Strain (Ophthalmologist)", strength: "Weak", value: 0.32 },
      { left: "Stress (Psychologist)", right: "Acid Reflux (GP)", strength: "Moderate", value: 0.45 },
    ],
    appEngagement: [
      { label: "Users with 7,000+ daily steps have 28% fewer GP visits", impact: "High", positive: true },
      { label: "Meditation users show 35% lower anxiety diagnosis rates", impact: "High", positive: true },
      { label: "Challenge participants have 22% higher NPS scores", impact: "Medium", positive: true },
      { label: "Sleep tracking users report 18% better sleep quality scores", impact: "Medium", positive: true },
      { label: "Users inactive >30 days have 2.4x higher repeat visit rate", impact: "High", positive: false },
      { label: "Low-step users (<3,000/day) show 40% higher BMI abnormality", impact: "High", positive: false },
    ],
    kpis: {
      avgBmi: isCisco ? 25.4 : 24.8,
      avgBp: isCisco ? "128/82" : "126/80",
      highRiskPct: isCisco ? 18 : 15,
    },
    charts: {
      bmiVsBp: [
        { bmi: 22, systolic: 118, count: Math.round(data.uniquePatients * 0.25) },
        { bmi: 25, systolic: 128, count: Math.round(data.uniquePatients * 0.35) },
        { bmi: 28, systolic: 135, count: Math.round(data.uniquePatients * 0.22) },
        { bmi: 31, systolic: 142, count: Math.round(data.uniquePatients * 0.12) },
        { bmi: 34, systolic: 148, count: Math.round(data.uniquePatients * 0.06) },
      ],
      riskDistribution: [
        { category: "Low", count: Math.round(data.uniquePatients * 0.48) },
        { category: "Moderate", count: Math.round(data.uniquePatients * 0.32) },
        { category: "High", count: Math.round(data.uniquePatients * 0.15) },
        { category: "Critical", count: Math.round(data.uniquePatients * 0.05) },
      ],
    },
  };
}
