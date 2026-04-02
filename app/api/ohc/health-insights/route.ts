// @ts-nocheck — Will be rewritten in Phase 1 with fact_kx queries
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import staticData from "@/lib/data/health-insights-data.json";
import { withCache } from "@/lib/cache/middleware";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Category to exclude — catch-all bucket, not a proper ICD category. */
const EXCLUDED_CATEGORY = "Other Diseases";

/** Convert any BigInt values in a raw query result to Number. */
function bigIntToNumber<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(bigIntToNumber) as unknown as T;
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = bigIntToNumber(v);
    }
    return out as T;
  }
  return obj;
}

// ── Static (JSON) fallback logic ─────────────────────────────────────────────

interface StaticJson {
  years: number[];
  categories: string[];
  ageGroups: string[];
  genders: string[];
  facilities: string[];
  categoryTreemap: Record<string, Array<{ name: string; value: number; uniquePatients: number; percentage: number }>>;
  conditionBreakdown: Record<string, Record<string, Array<{ name: string; value: number; uniquePatients: number; percentage: number }>>>;
  chronicAcute: Record<string, { chronicCount: number; chronicPatients: number; acuteCount: number; acutePatients: number }>;
  seasonalData: Record<string, { seasonalCount: number; seasonalPatients: number; nonSeasonalCount: number; nonSeasonalPatients: number }>;
  demoAge: Record<string, Record<string, Record<string, { count: number; uniquePatients: number }>>>;
  demoGender: Record<string, Record<string, Record<string, { count: number; uniquePatients: number }>>>;
  demoLocation: Record<string, Record<string, Record<string, { count: number; uniquePatients: number }>>>;
  conditionTrends: Record<string, Record<string, Array<{ period: string; count: number; uniquePatients: number }>>>;
  conditionTrendsYearly: Record<string, Record<string, Array<{ period: string; count: number; uniquePatients: number }>>>;
  diseaseCombinations: Array<{ name: string; total: number; male: number; female: number }>;
  symptomMapping: unknown[];
  vitalsTrend: Record<string, unknown[]>;
}

function buildStaticResponse(
  sd: StaticJson,
  year: string | null,
  category: string | null,
  condition: string | null,
  conditionType: string | null,
  conditionsFilter: string[] | undefined,
) {
  const effectiveYear = year || (sd.years.length > 0 ? String(sd.years[sd.years.length - 1]) : "2025");

  // Category treemap for the selected year — optionally filtered by conditions multi-select
  let categoryTreemap = (sd.categoryTreemap[effectiveYear] || []).filter((item) => item.name !== EXCLUDED_CATEGORY);
  if (conditionsFilter?.length) {
    categoryTreemap = categoryTreemap.filter((item) => conditionsFilter.includes(item.name));
  }
  // Recalculate percentages after filtering
  const filteredTotal = categoryTreemap.reduce((s, item) => s + item.value, 0);
  categoryTreemap = categoryTreemap.map((item) => ({
    ...item,
    percentage: filteredTotal > 0 ? Math.round((item.value / filteredTotal) * 1000) / 10 : 0,
  }));

  // Condition breakdown for the selected year + category
  const conditionBreakdown =
    category && sd.conditionBreakdown[effectiveYear]
      ? sd.conditionBreakdown[effectiveYear][category] || []
      : [];

  // Chronic/Acute for selected year
  const rawChronicAcute = sd.chronicAcute[effectiveYear] || {
    chronicCount: 0,
    chronicPatients: 0,
    acuteCount: 0,
    acutePatients: 0,
  };
  // Apply conditionType filter
  const chronicAcute = conditionType === "chronic"
    ? { ...rawChronicAcute, acuteCount: 0, acutePatients: 0 }
    : conditionType === "acute"
    ? { ...rawChronicAcute, chronicCount: 0, chronicPatients: 0 }
    : rawChronicAcute;

  // Seasonal data for selected year
  const seasonalData = sd.seasonalData[effectiveYear] || {
    seasonalCount: 0,
    seasonalPatients: 0,
    nonSeasonalCount: 0,
    nonSeasonalPatients: 0,
  };

  // Demographics – filtered by category (show subcategories within selected category)
  let demoAge: Record<string, Record<string, { count: number; uniquePatients: number }>> = {};
  let demoGender: Record<string, Record<string, { count: number; uniquePatients: number }>> = {};
  let demoLocation: Record<string, Record<string, { count: number; uniquePatients: number }>> = {};
  if (category) {
    demoAge = sd.demoAge[category] || {};
    demoGender = sd.demoGender[category] || {};
    demoLocation = sd.demoLocation[category] || {};
  }

  // Condition trends – filtered by category AND condition (subcategory)
  let conditionTrends: Array<{ period: string; count: number; uniquePatients: number }> = [];
  let conditionTrendsYearly: Array<{ period: string; count: number; uniquePatients: number }> = [];
  if (category && condition) {
    conditionTrends = sd.conditionTrends[category]?.[condition] || [];
    conditionTrendsYearly = sd.conditionTrendsYearly[category]?.[condition] || [];
  }

  return {
    years: sd.years,
    categories: sd.categories.filter((c) => c !== EXCLUDED_CATEGORY),
    ageGroups: sd.ageGroups,
    facilities: sd.facilities,
    categoryTreemap,
    conditionBreakdown,
    chronicAcute,
    seasonalData,
    demoAge,
    demoGender,
    demoLocation,
    conditionTrends,
    conditionTrendsYearly,
    diseaseCombinations: sd.diseaseCombinations.filter((d) => !d.name.includes(EXCLUDED_CATEGORY)),
    symptomMapping: sd.symptomMapping,
    vitalsTrend: sd.vitalsTrend,
    seasonalTrends: (sd as any).seasonalTrends || {},
  };
}

// ── DB query logic ───────────────────────────────────────────────────────────

interface RawRow {
  [key: string]: unknown;
}

async function queryDatabase(
  year: string | null,
  dateFrom: string | null,
  dateTo: string | null,
  locations: string[] | undefined,
  genders: string[] | undefined,
  ageGroups: string[] | undefined,
  category: string | null,
  condition: string | null,
  clientId: string | null,
  conditionType: string | null,
  conditionsFilter: string[] | undefined,
) {
  // ── Build WHERE clause with parameterised placeholders ──
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  let idx = 1;

  if (year) {
    conditions.push(`EXTRACT(YEAR FROM consult_date) = $${idx++}`);
    params.push(Number(year));
  }
  if (dateFrom) {
    conditions.push(`consult_date >= $${idx++}`);
    params.push(new Date(dateFrom));
  }
  if (dateTo) {
    conditions.push(`consult_date <= $${idx++}`);
    params.push(new Date(dateTo));
  }
  if (locations?.length) {
    conditions.push(`facility = ANY($${idx++})`);
    params.push(locations);
  }
  if (genders?.length) {
    conditions.push(`gender = ANY($${idx++})`);
    params.push(genders.map((g) => g.toUpperCase()));
  }
  if (ageGroups?.length) {
    conditions.push(`age_group = ANY($${idx++})`);
    params.push(ageGroups);
  }
  if (conditionType === "chronic" || conditionType === "acute") {
    conditions.push(`UPPER(condition_type) = $${idx++}`);
    params.push(conditionType.toUpperCase());
  }
  if (conditionsFilter?.length) {
    conditions.push(`disease_category = ANY($${idx++})`);
    params.push(conditionsFilter);
  }
  if (clientId) {
    // diagnosis_records may not have client_id; silently skip if column absent
    // We keep this for forward-compat but wrap safely
  }

  const baseWhere = conditions.join(" AND ");

  // Additional filters for category / condition scoped queries
  const catConditions = [...conditions];
  const catParams = [...params];
  let catIdx = idx;
  if (category) {
    catConditions.push(`disease_category = $${catIdx++}`);
    catParams.push(category);
  }
  const catWhere = catConditions.join(" AND ");

  // ═══════════════════════════════════════════════════════════════════════════
  // 1-4. Metadata + Treemap (all independent, run in parallel)
  // ═══════════════════════════════════════════════════════════════════════════
  const [yearsRaw, categoriesRaw, ageGroupsRaw, facilitiesRaw, treemapRaw, chronicAcuteRaw, seasonalRaw, combosRaw] = (await Promise.all([
    prisma.$queryRawUnsafe(
      `SELECT DISTINCT EXTRACT(YEAR FROM consult_date)::int AS yr FROM diagnosis_records ORDER BY yr`,
    ),
    prisma.$queryRawUnsafe(
      `SELECT DISTINCT disease_category AS cat FROM diagnosis_records ORDER BY cat`,
    ),
    prisma.$queryRawUnsafe(
      `SELECT DISTINCT age_group AS ag FROM diagnosis_records ORDER BY ag`,
    ),
    prisma.$queryRawUnsafe(
      `SELECT DISTINCT facility AS fac FROM diagnosis_records ORDER BY fac`,
    ),
    prisma.$queryRawUnsafe(
      `SELECT
         disease_category AS name,
         COUNT(*) AS value,
         COUNT(DISTINCT uhid) AS unique_patients
       FROM diagnosis_records
       WHERE ${baseWhere}
       GROUP BY disease_category
       ORDER BY value DESC`,
      ...params,
    ),
    // 6. Chronic vs Acute
    prisma.$queryRawUnsafe(
      `SELECT
         condition_type AS ctype,
         COUNT(*) AS cnt,
         COUNT(DISTINCT uhid) AS patients
       FROM diagnosis_records
       WHERE ${baseWhere}
       GROUP BY condition_type`,
      ...params,
    ),
    // 7. Seasonal data
    prisma.$queryRawUnsafe(
      `SELECT
         is_seasonal,
         COUNT(*) AS cnt,
         COUNT(DISTINCT uhid) AS patients
       FROM diagnosis_records
       WHERE ${baseWhere}
       GROUP BY is_seasonal`,
      ...params,
    ),
    // 10. Disease combinations
    prisma.$queryRawUnsafe(
      `SELECT
         a.disease_category || ' + ' || b.disease_category AS name,
         COUNT(DISTINCT a.uhid) AS total,
         COUNT(DISTINCT CASE WHEN a.gender = 'MALE' THEN a.uhid END) AS male,
         COUNT(DISTINCT CASE WHEN a.gender = 'FEMALE' THEN a.uhid END) AS female
       FROM diagnosis_records a
       JOIN diagnosis_records b
         ON a.uhid = b.uhid
         AND a.disease_category < b.disease_category
       WHERE 1=1
       GROUP BY a.disease_category, b.disease_category
       ORDER BY total DESC
       LIMIT 20`,
    ),
  ])) as [RawRow[], RawRow[], RawRow[], RawRow[], RawRow[], RawRow[], RawRow[], RawRow[]];

  const years = bigIntToNumber(yearsRaw).map((r: RawRow) => Number(r.yr));
  const categories = bigIntToNumber(categoriesRaw).map((r: RawRow) => String(r.cat)).filter((c) => c !== EXCLUDED_CATEGORY);
  const ageGroupsList = bigIntToNumber(ageGroupsRaw).map((r: RawRow) => String(r.ag));
  const facilitiesList = bigIntToNumber(facilitiesRaw).map((r: RawRow) => String(r.fac));

  const treemapRowsAll = bigIntToNumber(treemapRaw).filter((r: RawRow) => String(r.name) !== EXCLUDED_CATEGORY);
  const treemapTotal = treemapRowsAll.reduce((s: number, r: RawRow) => s + Number(r.value), 0);
  const categoryTreemap = treemapRowsAll.map((r: RawRow) => ({
    name: String(r.name),
    value: Number(r.value),
    uniquePatients: Number(r.unique_patients),
    percentage: treemapTotal > 0 ? Math.round((Number(r.value) / treemapTotal) * 1000) / 10 : 0,
  }));

  // Process chronic/acute (section 6)
  const caRows = bigIntToNumber(chronicAcuteRaw);
  const chronicRow = caRows.find((r: RawRow) => String(r.ctype).toUpperCase() === "CHRONIC");
  const acuteRow = caRows.find((r: RawRow) => String(r.ctype).toUpperCase() === "ACUTE");
  const chronicAcute = {
    chronicCount: chronicRow ? Number(chronicRow.cnt) : 0,
    chronicPatients: chronicRow ? Number(chronicRow.patients) : 0,
    acuteCount: acuteRow ? Number(acuteRow.cnt) : 0,
    acutePatients: acuteRow ? Number(acuteRow.patients) : 0,
  };

  // Process seasonal (section 7)
  const sRows = bigIntToNumber(seasonalRaw);
  const seasonalRow = sRows.find((r: RawRow) => r.is_seasonal === true);
  const nonSeasonalRow = sRows.find((r: RawRow) => r.is_seasonal === false);
  const seasonalData = {
    seasonalCount: seasonalRow ? Number(seasonalRow.cnt) : 0,
    seasonalPatients: seasonalRow ? Number(seasonalRow.patients) : 0,
    nonSeasonalCount: nonSeasonalRow ? Number(nonSeasonalRow.cnt) : 0,
    nonSeasonalPatients: nonSeasonalRow ? Number(nonSeasonalRow.patients) : 0,
  };

  // Process disease combinations (section 10) — exclude "Other Diseases"
  const diseaseCombinations = bigIntToNumber(combosRaw)
    .filter((r: RawRow) => !String(r.name).includes(EXCLUDED_CATEGORY))
    .map((r: RawRow) => ({
      name: String(r.name),
      total: Number(r.total),
      male: Number(r.male),
      female: Number(r.female),
    }));

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Condition breakdown (filtered by year + category)
  // ═══════════════════════════════════════════════════════════════════════════
  let conditionBreakdown: Array<{ name: string; value: number; uniquePatients: number; percentage: number }> = [];
  if (category) {
    const breakdownRaw: RawRow[] = await prisma.$queryRawUnsafe(
      `SELECT
         disease_sub_category AS name,
         COUNT(*) AS value,
         COUNT(DISTINCT uhid) AS unique_patients
       FROM diagnosis_records
       WHERE ${catWhere}
       GROUP BY disease_sub_category
       ORDER BY value DESC`,
      ...catParams,
    );
    const breakdownRows = bigIntToNumber(breakdownRaw);
    const breakdownTotal = breakdownRows.reduce((s: number, r: RawRow) => s + Number(r.value), 0);
    conditionBreakdown = breakdownRows.map((r: RawRow) => ({
      name: String(r.name),
      value: Number(r.value),
      uniquePatients: Number(r.unique_patients),
      percentage: breakdownTotal > 0 ? Math.round((Number(r.value) / breakdownTotal) * 1000) / 10 : 0,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Demographics by age/gender/location (filtered by category)
  //    Returns data keyed by subcategory within the category
  // ═══════════════════════════════════════════════════════════════════════════
  let demoAge: Record<string, Record<string, { count: number; uniquePatients: number }>> = {};
  let demoGender: Record<string, Record<string, { count: number; uniquePatients: number }>> = {};
  let demoLocation: Record<string, Record<string, { count: number; uniquePatients: number }>> = {};

  if (category) {
    // Build a WHERE that uses base filters + category (no year filter for demographics to show across years)
    const demoConditions: string[] = ["1=1"];
    const demoParams: unknown[] = [];
    let demoIdx = 1;
    if (locations?.length) {
      demoConditions.push(`facility = ANY($${demoIdx++})`);
      demoParams.push(locations);
    }
    if (genders?.length) {
      demoConditions.push(`gender = ANY($${demoIdx++})`);
      demoParams.push(genders.map((g) => g.toUpperCase()));
    }
    if (ageGroups?.length) {
      demoConditions.push(`age_group = ANY($${demoIdx++})`);
      demoParams.push(ageGroups);
    }
    demoConditions.push(`disease_category = $${demoIdx++}`);
    demoParams.push(category);
    const demoWhere = demoConditions.join(" AND ");

    const [ageRaw, genderRaw, locRaw] = (await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT
           disease_sub_category AS sub,
           age_group AS dim,
           COUNT(*) AS cnt,
           COUNT(DISTINCT uhid) AS patients
         FROM diagnosis_records
         WHERE ${demoWhere}
         GROUP BY disease_sub_category, age_group`,
        ...demoParams,
      ),
      prisma.$queryRawUnsafe(
        `SELECT
           disease_sub_category AS sub,
           gender AS dim,
           COUNT(*) AS cnt,
           COUNT(DISTINCT uhid) AS patients
         FROM diagnosis_records
         WHERE ${demoWhere}
         GROUP BY disease_sub_category, gender`,
        ...demoParams,
      ),
      prisma.$queryRawUnsafe(
        `SELECT
           disease_sub_category AS sub,
           facility AS dim,
           COUNT(*) AS cnt,
           COUNT(DISTINCT uhid) AS patients
         FROM diagnosis_records
         WHERE ${demoWhere}
         GROUP BY disease_sub_category, facility`,
        ...demoParams,
      ),
    ])) as [RawRow[], RawRow[], RawRow[]];

    const buildDemoMap = (rows: RawRow[]) => {
      const converted = bigIntToNumber(rows);
      const map: Record<string, Record<string, { count: number; uniquePatients: number }>> = {};
      for (const r of converted) {
        const sub = String(r.sub);
        const dim = String(r.dim);
        if (!map[sub]) map[sub] = {};
        map[sub][dim] = { count: Number(r.cnt), uniquePatients: Number(r.patients) };
      }
      return map;
    };

    demoAge = buildDemoMap(ageRaw);
    demoGender = buildDemoMap(genderRaw);
    demoLocation = buildDemoMap(locRaw);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Condition trends – monthly (filtered by category + condition)
  // ═══════════════════════════════════════════════════════════════════════════
  let conditionTrends: Array<{ period: string; count: number; uniquePatients: number }> = [];
  let conditionTrendsYearly: Array<{ period: string; count: number; uniquePatients: number }> = [];

  if (category && condition) {
    // For trends, we do NOT filter by year so we can show cross-year trends
    const trendConditions: string[] = ["1=1"];
    const trendParams: unknown[] = [];
    let trendIdx = 1;
    if (dateFrom) {
      trendConditions.push(`consult_date >= $${trendIdx++}`);
      trendParams.push(new Date(dateFrom));
    }
    if (dateTo) {
      trendConditions.push(`consult_date <= $${trendIdx++}`);
      trendParams.push(new Date(dateTo));
    }
    if (locations?.length) {
      trendConditions.push(`facility = ANY($${trendIdx++})`);
      trendParams.push(locations);
    }
    if (genders?.length) {
      trendConditions.push(`gender = ANY($${trendIdx++})`);
      trendParams.push(genders.map((g) => g.toUpperCase()));
    }
    if (ageGroups?.length) {
      trendConditions.push(`age_group = ANY($${trendIdx++})`);
      trendParams.push(ageGroups);
    }
    trendConditions.push(`disease_category = $${trendIdx++}`);
    trendParams.push(category);
    trendConditions.push(`disease_sub_category = $${trendIdx++}`);
    trendParams.push(condition);
    const trendWhere = trendConditions.join(" AND ");

    const [monthlyRaw, yearlyRaw] = (await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT
           to_char(consult_date, 'YYYY-MM') AS period,
           COUNT(*) AS cnt,
           COUNT(DISTINCT uhid) AS patients
         FROM diagnosis_records
         WHERE ${trendWhere}
         GROUP BY to_char(consult_date, 'YYYY-MM')
         ORDER BY period`,
        ...trendParams,
      ),
      prisma.$queryRawUnsafe(
        `SELECT
           EXTRACT(YEAR FROM consult_date)::text AS period,
           COUNT(*) AS cnt,
           COUNT(DISTINCT uhid) AS patients
         FROM diagnosis_records
         WHERE ${trendWhere}
         GROUP BY EXTRACT(YEAR FROM consult_date)
         ORDER BY period`,
        ...trendParams,
      ),
    ])) as [RawRow[], RawRow[]];

    conditionTrends = bigIntToNumber(monthlyRaw).map((r: RawRow) => ({
      period: String(r.period),
      count: Number(r.cnt),
      uniquePatients: Number(r.patients),
    }));

    conditionTrendsYearly = bigIntToNumber(yearlyRaw).map((r: RawRow) => ({
      period: String(r.period),
      count: Number(r.cnt),
      uniquePatients: Number(r.patients),
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. Symptom mapping & vitals trend (static, no DB equivalent yet)
  // ═══════════════════════════════════════════════════════════════════════════
  const sd = staticData as unknown as StaticJson;

  return {
    years,
    categories,
    ageGroups: ageGroupsList,
    facilities: facilitiesList,
    categoryTreemap,
    conditionBreakdown,
    chronicAcute,
    seasonalData,
    demoAge,
    demoGender,
    demoLocation,
    conditionTrends,
    conditionTrendsYearly,
    diseaseCombinations,
    symptomMapping: sd.symptomMapping,
    vitalsTrend: sd.vitalsTrend,
    seasonalTrends: (sd as any).seasonalTrends || {},
  };
}

// ── GET handler ──────────────────────────────────────────────────────────────

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const locations = searchParams.get("locations")?.split(",").filter(Boolean);
    const genders = searchParams.get("genders")?.split(",").filter(Boolean);
    const ageGroups = searchParams.get("ageGroups")?.split(",").filter(Boolean);
    const category = searchParams.get("category");
    const condition = searchParams.get("condition");
    const conditionType = searchParams.get("conditionType"); // "chronic" | "acute" | null (all)
    const conditions = searchParams.get("conditions")?.split(",").filter(Boolean); // multi-select category filter
    const clientId = searchParams.get("clientId");

    let responseData: Record<string, unknown>;

    try {
      // Attempt DB query – check if the table has any rows first
      const countResult: Array<{ cnt: bigint }> = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS cnt FROM diagnosis_records LIMIT 1`,
      );
      const rowCount = Number(countResult[0]?.cnt ?? 0);

      if (rowCount === 0) {
        throw new Error("diagnosis_records table is empty – falling back to static JSON");
      }

      responseData = await queryDatabase(
        year,
        dateFrom,
        dateTo,
        locations,
        genders,
        ageGroups,
        category,
        condition,
        clientId,
        conditionType,
        conditions,
      );
    } catch (dbError) {
      // DB unavailable or empty → fall back to static JSON
      console.warn("Health Insights: DB query failed or empty, using static JSON fallback.", dbError);
      const sd = staticData as unknown as StaticJson;
      responseData = buildStaticResponse(sd, year, category, condition, conditionType, conditions);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Health Insights API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}

export const GET = withCache(handler, { endpoint: "ohc/health-insights" });
