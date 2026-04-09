/**
 * Centralized hardcoded dummy data for CISCO and HCL TECH CUGs.
 * Used by all API routes in demo mode.
 */

// ── Client Definitions ──

export const CLIENTS = {
  CISCO: {
    id: "cisco-001",
    cugId: "CISCO",
    cugCode: "CISCO",
    cugName: "CISCO",
    name: "CISCO",
    logo: null,
    industry: "Technology",
    workforceSize: 83000,
    hasOhc: true,
    hasOhcAdvanced: true,
    hasAhc: true,
    hasSmartReports: true,
    hasWallet: true,
    hasHabitApp: true,
  },
  HCLTECH: {
    id: "hcltech-001",
    cugId: "HCLTECH",
    cugCode: "HCLTECH",
    cugName: "HCL Tech",
    name: "HCL Tech",
    logo: null,
    industry: "IT Services",
    workforceSize: 227000,
    hasOhc: true,
    hasOhcAdvanced: true,
    hasAhc: true,
    hasSmartReports: true,
    hasWallet: true,
    hasHabitApp: true,
  },
};

export const ASSIGNED_CLIENTS = [
  { id: "cisco-001", cugName: "CISCO", cugCode: "CISCO" },
  { id: "hcltech-001", cugName: "HCL Tech", cugCode: "HCLTECH" },
];

export function getClientByCugCode(cugCode: string) {
  if (cugCode === "CISCO") return CLIENTS.CISCO;
  if (cugCode === "HCLTECH") return CLIENTS.HCLTECH;
  return CLIENTS.CISCO;
}

// ── Filters ──

export function getFilters(cugCode: string) {
  if (cugCode === "HCLTECH") {
    return {
      genders: ["Male", "Female", "Others"],
      ageGroups: ["<20", "20-35", "36-40", "41-60", "61+"],
      locations: ["Noida SEC-126", "Lucknow MRC", "Chennai OMR", "Bangalore Manyata", "Hyderabad Madhapur"],
      specialties: ["General Physician", "Physiotherapist", "Psychologist", "Dentist", "Ophthalmologist", "Dermatologist"],
    };
  }
  return {
    genders: ["Male", "Female", "Others"],
    ageGroups: ["<20", "20-35", "36-40", "41-60", "61+"],
    locations: ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani", "Hyderabad Gachibowli", "Pune Hinjewadi"],
    specialties: ["General Physician", "Physiotherapist", "Psychologist", "Dentist", "Ophthalmologist", "ENT Specialist"],
  };
}

// ── Overview KPIs ──

export function getOverview(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  return {
    kpis: {
      totalEmployees: isCisco ? 83000 : 227000,
      totalServicesAvailed: isCisco ? 14520 : 38740,
      activeEmployees: isCisco ? 6840 : 18200,
      serviceCategories: 4,
      multiCategoryUsers: isCisco ? 1230 : 3450,
    },
    services: [
      {
        key: "ohc",
        name: "OHC",
        description: "Occupational Health Centre consultations including general physician visits, specialist appointments, and on-site clinical care.",
        totalUsers: isCisco ? 4120 : 11500,
        totalInteractions: isCisco ? 8940 : 24200,
        href: "/portal/ohc/utilization",
      },
      {
        key: "ahc",
        name: "Annual Health Checks",
        description: "Annual Health Check-ups covering health risk assessments, preventive screenings, and personalised wellness recommendations.",
        totalUsers: isCisco ? 2800 : 7600,
        totalInteractions: isCisco ? 2800 : 7600,
        href: "/portal/ahc/utilization",
      },
      {
        key: "employee-engagement",
        name: "Employee Engagement & Programs",
        description: "Emotional wellbeing assessments, NPS feedback surveys, and wellness programs driving employee satisfaction and mental health.",
        totalUsers: isCisco ? 1540 : 4100,
        totalInteractions: isCisco ? 3200 : 8700,
        href: "/portal/employee-experience",
      },
      {
        key: "app-engagement",
        name: "Habit App Engagement",
        description: "Mobile health app usage tracking steps, sleep, meditation, yoga, challenges, and overall digital wellness engagement.",
        totalUsers: isCisco ? 3200 : 8400,
        totalInteractions: isCisco ? 45600 : 124000,
        href: "/portal/engagement",
      },
    ],
  };
}

// ── OHC Utilization ──

export function getOhcUtilization(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const totalConsults = isCisco ? 8940 : 24200;
  const uniquePatients = isCisco ? 4120 : 11500;
  const repeatPatients = isCisco ? 1840 : 5100;
  const locationCount = isCisco ? 5 : 5;
  const repeatRate = Math.round((repeatPatients / uniquePatients) * 100);

  const locations = isCisco
    ? ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani", "Hyderabad Gachibowli", "Pune Hinjewadi"]
    : ["Noida SEC-126", "Lucknow MRC", "Chennai OMR", "Bangalore Manyata", "Hyderabad Madhapur"];
  const specialties = isCisco
    ? ["General Physician", "Physiotherapist", "Psychologist", "Dentist", "Ophthalmologist", "ENT Specialist"]
    : ["General Physician", "Physiotherapist", "Psychologist", "Dentist", "Ophthalmologist", "Dermatologist"];

  const specValues = isCisco ? [4200, 1890, 1120, 780, 560, 390] : [11400, 5100, 3050, 2100, 1500, 1050];
  const specialtyTreemap = specialties.map((name, i) => ({ name, value: specValues[i] }));

  const locationBySpecialty = locations.map((location, li) => {
    const row: Record<string, unknown> = { location };
    specialties.slice(0, 6).forEach((spec, si) => {
      row[spec] = Math.round(specValues[si] * (0.15 + li * 0.04) * (1 - si * 0.05));
    });
    return row;
  });

  const demographicSunburst = [
    {
      name: "<20", itemStyle: { color: "#818cf8" },
      children: [
        { name: "M", value: isCisco ? 120 : 340, itemStyle: { color: "#0d9488" } },
        { name: "F", value: isCisco ? 90 : 250, itemStyle: { color: "#a78bfa" } },
      ],
    },
    {
      name: "20-35", itemStyle: { color: "#0d9488" },
      children: [
        { name: "M", value: isCisco ? 2100 : 5700, itemStyle: { color: "#0d9488" } },
        { name: "F", value: isCisco ? 1400 : 3800, itemStyle: { color: "#a78bfa" } },
      ],
    },
    {
      name: "36-40", itemStyle: { color: "#d4d4d8" },
      children: [
        { name: "M", value: isCisco ? 1200 : 3200, itemStyle: { color: "#0d9488" } },
        { name: "F", value: isCisco ? 800 : 2200, itemStyle: { color: "#a78bfa" } },
      ],
    },
    {
      name: "41-60", itemStyle: { color: "#a78bfa" },
      children: [
        { name: "M", value: isCisco ? 1400 : 3800, itemStyle: { color: "#0d9488" } },
        { name: "F", value: isCisco ? 900 : 2400, itemStyle: { color: "#a78bfa" } },
      ],
    },
    {
      name: "61+", itemStyle: { color: "#6366f1" },
      children: [
        { name: "M", value: isCisco ? 180 : 500, itemStyle: { color: "#0d9488" } },
        { name: "F", value: isCisco ? 80 : 210, itemStyle: { color: "#a78bfa" } },
      ],
    },
  ];

  const peakHoursData: [number, number, number][] = [];
  let peakMax = 0;
  const peakCell = { day: 0, hour: 0, count: 0 };
  for (let day = 0; day < 5; day++) {
    for (let hour = 0; hour < 17; hour++) {
      const base = isCisco ? 15 : 40;
      const count = Math.round(base * (1 + Math.sin((hour - 4) * 0.4) * 0.8) * (1 - day * 0.05));
      peakHoursData.push([hour, day, count]);
      if (count > peakMax) { peakMax = count; peakCell.day = day; peakCell.hour = hour; peakCell.count = count; }
    }
  }
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HOUR_NAMES = ["6 AM","7 AM","8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM"];

  return {
    kpis: {
      totalConsults, uniquePatients, repeatPatients, locationCount, repeatRate,
      yoyConsults: 12, yoyUnique: 8, yoyRepeat: -3,
    },
    charts: {
      demographicSunburst,
      demographicStats: {
        totalConsults, uniquePatients,
        highestCohort: { ageGroup: "20-35", gender: "Male", count: isCisco ? 2100 : 5700, patients: isCisco ? 1200 : 3300 },
        topGender: { gender: "Male", count: isCisco ? 5000 : 13540 },
        topAgeGroup: { ageGroup: "20-35", count: isCisco ? 3500 : 9500 },
      },
      locationBySpecialty,
      topSpecialties: specialties.slice(0, 6),
      visitTrends: [],
      avgConsults: 0,
      specialtyTreemap,
      peakHours: {
        data: peakHoursData, max: peakMax,
        peakDay: DAY_NAMES[peakCell.day] || "Mon",
        peakHour: HOUR_NAMES[peakCell.hour] || "10 AM",
        peakCount: peakCell.count,
      },
      serviceCategories: [],
      bubbleBySpecialty: {},
      bubbleSpecialties: [],
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── OHC Visit Trends ──

export function getVisitTrends(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const months = ["2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03"];
  const base = isCisco ? 550 : 1500;

  const visitTrends = months.map((period, i) => ({
    period,
    totalConsults: Math.round(base * (0.85 + Math.sin(i * 0.5) * 0.25 + i * 0.02)),
    uniquePatients: Math.round(base * 0.55 * (0.85 + Math.sin(i * 0.5) * 0.2 + i * 0.015)),
  }));

  const avgConsults = Math.round(visitTrends.reduce((s, v) => s + v.totalConsults, 0) / visitTrends.length);
  return { visitTrends, avgConsults };
}

// ── OHC Repeat Trends ──

export function getRepeatTrends(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const months = ["2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12"];
  const base = isCisco ? 80 : 220;

  return {
    data: months.map((label, i) => ({
      label,
      repeatVisits: Math.round(base * (0.9 + i * 0.02)),
      repeatPatients: Math.round(base * 0.6 * (0.9 + i * 0.015)),
    })),
  };
}

// ── OHC Appointments (raw rows) ──

export function getAppointments(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const locations = isCisco
    ? ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani"]
    : ["Noida SEC-126", "Lucknow MRC", "Chennai OMR"];
  const specialties = ["General Physician", "Physiotherapist", "Psychologist"];
  const rows = [];
  for (let i = 0; i < (isCisco ? 50 : 100); i++) {
    rows.push({
      slotdate: `2025-0${1 + (i % 3)}-${String(1 + (i % 28)).padStart(2, "0")}`,
      dow: i % 5,
      hour: 8 + (i % 10),
      uhid: `UH${String(i + 1000).padStart(6, "0")}`,
      facility_name: locations[i % locations.length],
      speciality_name: specialties[i % specialties.length],
      patient_gender: i % 3 === 0 ? "Female" : "Male",
      age_years: 25 + (i % 35),
      relationship: i % 5 === 0 ? "Spouse" : null,
    });
  }
  return { rows };
}

// ── OHC Stage Trends ──

export function getStageTrends(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const months = ["2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12"];
  const base = isCisco ? 500 : 1400;

  return {
    trends: months.map((period, i) => ({
      period,
      completed: Math.round(base * (0.9 + i * 0.02)),
      cancelled: Math.round(base * 0.08 * (1 + i * 0.01)),
      noShow: Math.round(base * 0.05 * (1 - i * 0.005)),
      uniquePatients: Math.round(base * 0.55 * (0.9 + i * 0.015)),
    })),
  };
}

// ── OHC Health Insights ──

export function getHealthInsights(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const base = isCisco ? 1 : 2.7;
  return {
    years: ["2024", "2025"],
    categories: ["Musculoskeletal", "Respiratory", "Dermatological", "Gastrointestinal", "ENT", "Ophthalmological"],
    ageGroups: ["<20", "20-35", "36-40", "41-60", "61+"],
    facilities: isCisco
      ? ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani"]
      : ["Noida SEC-126", "Lucknow MRC", "Chennai OMR"],
    categoryTreemap: [
      { name: "Musculoskeletal", value: Math.round(2400 * base) },
      { name: "Respiratory", value: Math.round(1800 * base) },
      { name: "Dermatological", value: Math.round(1200 * base) },
      { name: "Gastrointestinal", value: Math.round(900 * base) },
      { name: "ENT", value: Math.round(700 * base) },
      { name: "Ophthalmological", value: Math.round(500 * base) },
    ],
    conditionBreakdown: [
      { category: "Musculoskeletal", condition: "Back Pain", count: Math.round(800 * base) },
      { category: "Musculoskeletal", condition: "Neck Strain", count: Math.round(600 * base) },
      { category: "Respiratory", condition: "Upper RTI", count: Math.round(900 * base) },
      { category: "Respiratory", condition: "Allergic Rhinitis", count: Math.round(500 * base) },
      { category: "Dermatological", condition: "Acne", count: Math.round(400 * base) },
      { category: "Gastrointestinal", condition: "Acid Reflux", count: Math.round(450 * base) },
    ],
    chronicAcute: {
      chronicCount: Math.round(3200 * base),
      chronicPatients: Math.round(1800 * base),
      acuteCount: Math.round(5200 * base),
      acutePatients: Math.round(3400 * base),
    },
    seasonalData: {
      seasonalCount: Math.round(1800 * base),
      seasonalPatients: Math.round(1200 * base),
      nonSeasonalCount: Math.round(6600 * base),
      nonSeasonalPatients: Math.round(4000 * base),
    },
    demoAge: { "<20": Math.round(210 * base), "20-35": Math.round(3500 * base), "36-40": Math.round(2000 * base), "41-60": Math.round(2300 * base), "61+": Math.round(260 * base) },
    demoGender: { Male: Math.round(5000 * base), Female: Math.round(3200 * base), Others: Math.round(70 * base) },
    demoLocation: Object.fromEntries(
      (isCisco
        ? ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani", "Hyderabad Gachibowli", "Pune Hinjewadi"]
        : ["Noida SEC-126", "Lucknow MRC", "Chennai OMR", "Bangalore Manyata", "Hyderabad Madhapur"]
      ).map((loc, i) => [loc, Math.round((2200 - i * 300) * base)])
    ),
    conditionTrends: [
      { period: "2024-Q1", category: "Musculoskeletal", count: Math.round(580 * base) },
      { period: "2024-Q2", category: "Musculoskeletal", count: Math.round(620 * base) },
      { period: "2024-Q3", category: "Respiratory", count: Math.round(500 * base) },
      { period: "2024-Q4", category: "Respiratory", count: Math.round(550 * base) },
    ],
    conditionTrendsYearly: [],
    diseaseCombinations: [
      { conditions: ["Back Pain", "Neck Strain"], count: Math.round(340 * base) },
      { conditions: ["Upper RTI", "Allergic Rhinitis"], count: Math.round(220 * base) },
    ],
    symptomMapping: [],
    vitalsTrend: {},
    seasonalTrends: {},
  };
}

// ── OHC Referral ──

export function getReferral(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const base = isCisco ? 1 : 2.7;
  return {
    kpis: {
      totalReferrals: Math.round(1240 * base),
      availableInClinicCount: Math.round(680 * base),
      availableInClinicPct: 55,
      convertedCount: Math.round(420 * base),
      conversionPct: 34,
    },
    charts: {
      referralTrends: [
        { period: "2024-01", count: Math.round(95 * base) },
        { period: "2024-02", count: Math.round(88 * base) },
        { period: "2024-03", count: Math.round(110 * base) },
        { period: "2024-04", count: Math.round(105 * base) },
        { period: "2024-05", count: Math.round(120 * base) },
        { period: "2024-06", count: Math.round(98 * base) },
      ],
      matrixByYear: {},
      matrixYears: [],
      demographics: [
        { ageGroup: "20-35", gender: "M", count: Math.round(320 * base) },
        { ageGroup: "20-35", gender: "F", count: Math.round(210 * base) },
        { ageGroup: "36-40", gender: "M", count: Math.round(180 * base) },
        { ageGroup: "36-40", gender: "F", count: Math.round(120 * base) },
        { ageGroup: "41-60", gender: "M", count: Math.round(220 * base) },
        { ageGroup: "41-60", gender: "F", count: Math.round(140 * base) },
      ],
      demographicStats: {
        topAgeGroup: { ageGroup: "20-35", count: Math.round(530 * base) },
        topGender: { gender: "Male", count: Math.round(720 * base) },
        topCombo: { ageGroup: "20-35", gender: "Male", count: Math.round(320 * base) },
      },
      specialtyDetails: [
        { from: "General Physician", to: "Orthopedic", count: Math.round(180 * base) },
        { from: "General Physician", to: "Ophthalmologist", count: Math.round(140 * base) },
        { from: "General Physician", to: "Dermatologist", count: Math.round(110 * base) },
        { from: "General Physician", to: "ENT", count: Math.round(90 * base) },
      ],
      locationBySpecialty: [],
      topBarSpecialties: ["Orthopedic", "Ophthalmologist", "Dermatologist", "ENT"],
      specAvailability: {},
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── OHC Repeat Visits ──

export function getRepeatVisits(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const base = isCisco ? 1 : 2.7;
  return {
    kpis: {
      totalRepeatPatients: Math.round(1840 * base),
      avgVisitFrequency: 3.2,
      totalConsultsByRepeat: Math.round(5880 * base),
      avgNps: 72,
    },
    charts: {
      chronicVsAcute: { chronic: Math.round(1100 * base), acute: Math.round(740 * base) },
      demographics: {
        ageGroups: [
          { label: "<20", count: Math.round(40 * base) },
          { label: "20-35", count: Math.round(720 * base) },
          { label: "36-40", count: Math.round(440 * base) },
          { label: "41-60", count: Math.round(520 * base) },
          { label: "61+", count: Math.round(120 * base) },
        ],
        genderSplit: [
          { label: "Male", count: Math.round(1060 * base) },
          { label: "Female", count: Math.round(700 * base) },
          { label: "Others", count: Math.round(80 * base) },
        ],
        locationDistribution: (isCisco
          ? ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani", "Hyderabad Gachibowli", "Pune Hinjewadi"]
          : ["Noida SEC-126", "Lucknow MRC", "Chennai OMR", "Bangalore Manyata", "Hyderabad Madhapur"]
        ).map((label, i) => ({ label, count: Math.round((500 - i * 60) * base) })),
      },
      repeatVisitFrequency: [
        { visits: "2", patients: Math.round(800 * base) },
        { visits: "3", patients: Math.round(480 * base) },
        { visits: "4", patients: Math.round(280 * base) },
        { visits: "5+", patients: Math.round(280 * base) },
      ],
      specialtyTreemap: {},
      treemapYears: [],
      conditionTransitions: [],
      visitFrequencyNps: [],
      recurringConditions: {
        chronic: [
          { condition: "Back Pain", count: Math.round(340 * base) },
          { condition: "Hypertension", count: Math.round(220 * base) },
          { condition: "Diabetes Follow-up", count: Math.round(180 * base) },
        ],
        acute: [
          { condition: "Upper RTI", count: Math.round(280 * base) },
          { condition: "Viral Fever", count: Math.round(200 * base) },
          { condition: "Migraine", count: Math.round(150 * base) },
        ],
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

// ── OHC Emotional Wellbeing ──

export function getEmotionalWellbeing(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  const base = isCisco ? 1 : 2.7;
  return {
    kpis: {
      totalConsults: Math.round(1120 * base),
      uniquePatients: Math.round(680 * base),
      repeatPatients: Math.round(310 * base),
      totalEwbAssessed: Math.round(520 * base),
    },
    charts: {
      demographics: {
        age: [
          { label: "<20", count: Math.round(30 * base) },
          { label: "20-35", count: Math.round(480 * base) },
          { label: "36-40", count: Math.round(280 * base) },
          { label: "41-60", count: Math.round(280 * base) },
          { label: "61+", count: Math.round(50 * base) },
        ],
        gender: [
          { label: "Male", count: Math.round(520 * base) },
          { label: "Female", count: Math.round(540 * base) },
          { label: "Others", count: Math.round(60 * base) },
        ],
        location: (isCisco
          ? ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani"]
          : ["Noida SEC-126", "Lucknow MRC", "Chennai OMR"]
        ).map((label, i) => ({ label, count: Math.round((420 - i * 80) * base) })),
        shift: [],
      },
      consultTrends: [
        { period: "2024-07", totalConsults: Math.round(160 * base), uniquePatients: Math.round(95 * base) },
        { period: "2024-08", totalConsults: Math.round(175 * base), uniquePatients: Math.round(105 * base) },
        { period: "2024-09", totalConsults: Math.round(190 * base), uniquePatients: Math.round(110 * base) },
        { period: "2024-10", totalConsults: Math.round(185 * base), uniquePatients: Math.round(108 * base) },
        { period: "2024-11", totalConsults: Math.round(200 * base), uniquePatients: Math.round(120 * base) },
        { period: "2024-12", totalConsults: Math.round(210 * base), uniquePatients: Math.round(125 * base) },
      ],
      criticalRisk: { suicidalThoughts: Math.round(4 * base), attemptedSelfHarm: Math.round(2 * base), previousAttempts: Math.round(1 * base), totalCases: Math.round(7 * base) },
      substanceUsePct: 8,
      sleepQuality: [
        { label: "Good", count: Math.round(280 * base) },
        { label: "Fair", count: Math.round(180 * base) },
        { label: "Poor", count: Math.round(60 * base) },
      ],
      sleepDuration: [
        { label: "<5 hrs", count: Math.round(40 * base) },
        { label: "5-6 hrs", count: Math.round(120 * base) },
        { label: "6-7 hrs", count: Math.round(220 * base) },
        { label: "7-8 hrs", count: Math.round(110 * base) },
        { label: "8+ hrs", count: Math.round(30 * base) },
      ],
      alcoholHabit: [
        { label: "Never", count: Math.round(320 * base) },
        { label: "Occasional", count: Math.round(150 * base) },
        { label: "Regular", count: Math.round(50 * base) },
      ],
      smokingHabit: [
        { label: "Non-smoker", count: Math.round(380 * base) },
        { label: "Ex-smoker", count: Math.round(80 * base) },
        { label: "Current", count: Math.round(60 * base) },
      ],
      visitPattern: [],
      impressions: [
        { label: "Anxiety", count: Math.round(240 * base) },
        { label: "Depression", count: Math.round(180 * base) },
        { label: "Stress", count: Math.round(320 * base) },
        { label: "Insomnia", count: Math.round(120 * base) },
        { label: "Relationship Issues", count: Math.round(90 * base) },
      ],
      impressionSubcategories: {},
      impressionsByVisitBucket: {},
      anxietyScale: [
        { label: "Minimal", count: Math.round(180 * base) },
        { label: "Mild", count: Math.round(200 * base) },
        { label: "Moderate", count: Math.round(100 * base) },
        { label: "Severe", count: Math.round(40 * base) },
      ],
      depressionScale: [
        { label: "Minimal", count: Math.round(200 * base) },
        { label: "Mild", count: Math.round(170 * base) },
        { label: "Moderate", count: Math.round(80 * base) },
        { label: "Severe", count: Math.round(30 * base) },
      ],
      selfEsteemScale: [],
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── Engagement ──

export function getEngagement(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  return {
    kpis: {
      activeUsers: isCisco ? 3200 : 8400,
      avgDailyActiveUsers: isCisco ? 420 : 1100,
      avgSteps: isCisco ? 6840 : 7200,
      avgSleepHours: 6.8,
      challengeParticipation: isCisco ? 1240 : 3300,
      webinarAttendance: isCisco ? 680 : 1800,
    },
    engagementTrends: [
      { period: "2024-07", dau: isCisco ? 380 : 1000, mau: isCisco ? 2800 : 7400 },
      { period: "2024-08", dau: isCisco ? 400 : 1050, mau: isCisco ? 2900 : 7600 },
      { period: "2024-09", dau: isCisco ? 420 : 1100, mau: isCisco ? 3000 : 7900 },
      { period: "2024-10", dau: isCisco ? 410 : 1080, mau: isCisco ? 3100 : 8100 },
      { period: "2024-11", dau: isCisco ? 430 : 1130, mau: isCisco ? 3150 : 8300 },
      { period: "2024-12", dau: isCisco ? 440 : 1160, mau: isCisco ? 3200 : 8400 },
    ],
    deviceBreakdown: [
      { device: "Android", count: isCisco ? 1920 : 5040 },
      { device: "iOS", count: isCisco ? 1280 : 3360 },
    ],
    featureUsage: [
      { feature: "Steps Tracking", users: isCisco ? 2800 : 7350 },
      { feature: "Sleep Tracking", users: isCisco ? 2100 : 5500 },
      { feature: "Meditation", users: isCisco ? 1400 : 3700 },
      { feature: "Challenges", users: isCisco ? 1240 : 3300 },
      { feature: "Yoga", users: isCisco ? 900 : 2400 },
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
  const isCisco = cugCode === "CISCO";
  return {
    kpis: {
      overallNPS: isCisco ? 68 : 72,
      totalResponses: isCisco ? 2400 : 6500,
      promotersPct: isCisco ? 52 : 56,
      passivesPct: isCisco ? 32 : 28,
      detractorsPct: isCisco ? 16 : 16,
      responseRate: isCisco ? 45 : 48,
      yoyChange: isCisco ? 5 : 8,
    },
    charts: {
      npsTrends: [
        { period: "2024-Q1", nps: isCisco ? 62 : 65 },
        { period: "2024-Q2", nps: isCisco ? 65 : 68 },
        { period: "2024-Q3", nps: isCisco ? 66 : 70 },
        { period: "2024-Q4", nps: isCisco ? 68 : 72 },
      ],
      bySpecialty: [
        { specialty: "General Physician", nps: isCisco ? 70 : 74, responses: isCisco ? 1200 : 3200 },
        { specialty: "Physiotherapist", nps: isCisco ? 75 : 78, responses: isCisco ? 600 : 1600 },
        { specialty: "Psychologist", nps: isCisco ? 72 : 76, responses: isCisco ? 300 : 800 },
        { specialty: "Dentist", nps: isCisco ? 65 : 68, responses: isCisco ? 200 : 550 },
      ],
      byServiceCategory: [],
      byDiagnosisCategory: [],
      demographics: [
        { ageGroup: "20-35", gender: "M", nps: isCisco ? 66 : 70, count: isCisco ? 600 : 1600 },
        { ageGroup: "20-35", gender: "F", nps: isCisco ? 70 : 74, count: isCisco ? 400 : 1100 },
        { ageGroup: "36-40", gender: "M", nps: isCisco ? 68 : 72, count: isCisco ? 350 : 950 },
        { ageGroup: "41-60", gender: "M", nps: isCisco ? 64 : 68, count: isCisco ? 300 : 800 },
      ],
      demoSummary: {
        highestCount: isCisco ? 600 : 1600,
        highestAgeGroup: "20-35",
        highestGender: "Male",
        topGender: "Male",
        topGenderCount: isCisco ? 1350 : 3650,
        topAgeGroup: "20-35",
        topAgeGroupCount: isCisco ? 1000 : 2700,
      },
      byVisitFrequency: [
        { visits: "1", nps: isCisco ? 60 : 64 },
        { visits: "2-3", nps: isCisco ? 68 : 72 },
        { visits: "4+", nps: isCisco ? 74 : 78 },
      ],
      wordCloud: [
        { text: "Helpful", value: isCisco ? 280 : 750 },
        { text: "Quick", value: isCisco ? 220 : 590 },
        { text: "Professional", value: isCisco ? 200 : 540 },
        { text: "Friendly", value: isCisco ? 180 : 480 },
        { text: "Clean", value: isCisco ? 150 : 400 },
        { text: "Wait time", value: isCisco ? 120 : 320 },
        { text: "Convenient", value: isCisco ? 110 : 300 },
        { text: "Caring", value: isCisco ? 100 : 270 },
      ],
      topPositive: { text: "Doctors are very helpful and professional", count: isCisco ? 180 : 480 },
      topConcern: { text: "Wait time could be shorter during peak hours", count: isCisco ? 95 : 250 },
    },
  };
}

// ── LSMP ──

export function getLsmp(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  return {
    kpis: {
      totalEnrollments: { value: isCisco ? 1450 : 3900, trend: 12, trendLabel: "vs Last Year" },
      activeInCarePlan: { value: isCisco ? 820 : 2200, trend: 8, trendLabel: "Last Month" },
      completionRate: { value: isCisco ? 64 : 68, trend: 5, trendLabel: "vs Target" },
      overallImprovement: { value: isCisco ? 72 : 76, trend: 3, trendLabel: "Last Quarter" },
      avgDuration: { value: isCisco ? 45 : 42, trend: -2, trendLabel: "days vs avg" },
    },
    carePlanDistribution: [
      { plan: "Weight Management", count: isCisco ? 420 : 1130 },
      { plan: "Diabetes Care", count: isCisco ? 310 : 840 },
      { plan: "Hypertension", count: isCisco ? 280 : 760 },
      { plan: "Stress Management", count: isCisco ? 240 : 650 },
      { plan: "Back Pain", count: isCisco ? 200 : 540 },
    ],
    ageGroupDistribution: [
      { ageGroup: "20-35", count: isCisco ? 520 : 1400 },
      { ageGroup: "36-40", count: isCisco ? 380 : 1020 },
      { ageGroup: "41-60", count: isCisco ? 420 : 1130 },
      { ageGroup: "61+", count: isCisco ? 130 : 350 },
    ],
    genderDistribution: [
      { gender: "Male", count: isCisco ? 840 : 2260 },
      { gender: "Female", count: isCisco ? 560 : 1500 },
      { gender: "Others", count: isCisco ? 50 : 140 },
    ],
    improvementStatus: [
      { status: "Improved", count: isCisco ? 680 : 1830 },
      { status: "Stable", count: isCisco ? 480 : 1290 },
      { status: "Declined", count: isCisco ? 120 : 320 },
      { status: "Not Assessed", count: isCisco ? 170 : 460 },
    ],
    complianceStatus: [
      { status: "High", count: isCisco ? 580 : 1560 },
      { status: "Medium", count: isCisco ? 520 : 1400 },
      { status: "Low", count: isCisco ? 350 : 940 },
    ],
    locationDistribution: (isCisco
      ? ["Bangalore RR Nagar", "Bangalore Bellandur", "Chennai Taramani", "Hyderabad Gachibowli", "Pune Hinjewadi"]
      : ["Noida SEC-126", "Lucknow MRC", "Chennai OMR", "Bangalore Manyata", "Hyderabad Madhapur"]
    ).map((location, i) => ({ location, count: Math.round((isCisco ? 380 : 1020) * (1 - i * 0.12)) })),
    carePlanTrends: [
      { period: "2024-Q1", enrollments: isCisco ? 320 : 860, completions: isCisco ? 180 : 480 },
      { period: "2024-Q2", enrollments: isCisco ? 350 : 940, completions: isCisco ? 210 : 560 },
      { period: "2024-Q3", enrollments: isCisco ? 380 : 1020, completions: isCisco ? 240 : 650 },
      { period: "2024-Q4", enrollments: isCisco ? 400 : 1080, completions: isCisco ? 260 : 700 },
    ],
    improvementVsDuration: [
      { duration: "< 30 days", improved: isCisco ? 45 : 48 },
      { duration: "30-60 days", improved: isCisco ? 68 : 72 },
      { duration: "60-90 days", improved: isCisco ? 78 : 82 },
      { duration: "90+ days", improved: isCisco ? 85 : 88 },
    ],
    complianceTriggerPattern: { rows: [], columns: [], data: [] },
  };
}

// ── Correlations ──

export function getCorrelations(cugCode: string) {
  const isCisco = cugCode === "CISCO";
  return {
    kpis: {
      avgBmi: isCisco ? 25.4 : 24.8,
      avgBp: isCisco ? "128/82" : "126/80",
      highRiskPct: isCisco ? 18 : 15,
    },
    charts: {
      bmiVsBp: [
        { bmi: 22, systolic: 118, count: isCisco ? 320 : 860 },
        { bmi: 25, systolic: 128, count: isCisco ? 480 : 1290 },
        { bmi: 28, systolic: 135, count: isCisco ? 280 : 750 },
        { bmi: 31, systolic: 142, count: isCisco ? 140 : 380 },
        { bmi: 34, systolic: 148, count: isCisco ? 60 : 160 },
      ],
      riskDistribution: [
        { category: "Low", count: isCisco ? 1800 : 4860 },
        { category: "Moderate", count: isCisco ? 1200 : 3240 },
        { category: "High", count: isCisco ? 580 : 1560 },
        { category: "Critical", count: isCisco ? 120 : 320 },
      ],
    },
  };
}
