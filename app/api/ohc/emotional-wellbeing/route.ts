// @ts-nocheck — Will be rewritten in Phase 1 with fact_kx queries
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withCache } from "@/lib/cache/middleware";

const MENTAL_HEALTH_SPECIALTIES = ["Psychiatry", "Psychologist"];

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const locations = searchParams.get("locations")?.split(",").filter(Boolean);
    const genders = searchParams.get("genders")?.split(",").filter(Boolean);
    const ageGroups = searchParams.get("ageGroups")?.split(",").filter(Boolean);
    const clientId = searchParams.get("clientId");

    // ── EWB Assessment filters ──
    const ewbWhere: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      ewbWhere.assessmentDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    const empFilter: Record<string, unknown> = {};
    if (clientId) empFilter.clientId = clientId;
    if (locations?.length) empFilter.location = { in: locations };
    if (genders?.length) empFilter.gender = { in: genders.map((g) => g.toUpperCase()) };
    if (Object.keys(empFilter).length > 0) ewbWhere.employee = empFilter;

    // ── Consultation filters (mental health specialties) ──
    const consultWhere: Record<string, unknown> = {
      specialty: { in: MENTAL_HEALTH_SPECIALTIES },
    };
    if (dateFrom || dateTo) {
      consultWhere.appointmentDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (locations?.length) consultWhere.location = { in: locations };
    if (genders?.length) consultWhere.gender = { in: genders.map((g) => g.toUpperCase()) };
    if (ageGroups?.length) consultWhere.ageGroup = { in: ageGroups };
    if (clientId) consultWhere.clientId = clientId;

    // ── SQL WHERE for raw queries (consultations) ──
    const conds: string[] = [`c.specialty = ANY($1)`];
    const sqlParams: unknown[] = [MENTAL_HEALTH_SPECIALTIES];
    let idx = 2;
    if (dateFrom) { conds.push(`c.appointment_date >= $${idx++}`); sqlParams.push(new Date(dateFrom)); }
    if (dateTo) { conds.push(`c.appointment_date <= $${idx++}`); sqlParams.push(new Date(dateTo)); }
    if (locations?.length) { conds.push(`c.location = ANY($${idx++})`); sqlParams.push(locations); }
    if (genders?.length) { conds.push(`c.gender = ANY($${idx++})`); sqlParams.push(genders.map((g) => g.toUpperCase())); }
    if (ageGroups?.length) { conds.push(`c.age_group = ANY($${idx++})`); sqlParams.push(ageGroups); }
    if (clientId) { conds.push(`c.client_id = $${idx++}`); sqlParams.push(clientId); }
    const sqlWhere = conds.join(" AND ");

    // ── SQL WHERE for EWB raw queries ──
    const ewbConds: string[] = ["1=1"];
    const ewbParams: unknown[] = [];
    let ewbIdx = 1;
    if (dateFrom) { ewbConds.push(`e.assessment_date >= $${ewbIdx++}`); ewbParams.push(new Date(dateFrom)); }
    if (dateTo) { ewbConds.push(`e.assessment_date <= $${ewbIdx++}`); ewbParams.push(new Date(dateTo)); }
    if (locations?.length) { ewbConds.push(`emp.location = ANY($${ewbIdx++})`); ewbParams.push(locations); }
    if (genders?.length) { ewbConds.push(`emp.gender = ANY($${ewbIdx++})`); ewbParams.push(genders.map((g) => g.toUpperCase())); }
    if (clientId) { ewbConds.push(`emp.client_id = $${ewbIdx++}`); ewbParams.push(clientId); }
    const ewbSqlWhere = ewbConds.join(" AND ");

    // ── Run ALL independent queries in parallel ──
    const [
      totalConsults,
      uniquePatientsResult,
      repeatPatientsResult,
      ageDemo,
      genderDemo,
      locationDemo,
      shiftDemo,
      trendsRaw,
      suicidalCount,
      selfHarmCount,
      totalCritical,
      totalEwb,
      substanceCount,
      sleepRaw,
      sleepQualityRaw,
      alcoholRaw,
      smokingRaw,
      visitCounts,
      problemCats,
      problemSubs,
      impressionsByVisitRaw,
      anxietyDist,
      depressionDist,
      selfEsteemDist,
    ] = await Promise.all([
      // 1. KPIs
      prisma.consultation.count({ where: consultWhere }),
      prisma.consultation.findMany({ where: consultWhere, select: { employeeId: true }, distinct: ["employeeId"] }),
      prisma.consultation.groupBy({ by: ["employeeId"], where: consultWhere, _count: { id: true }, having: { id: { _count: { gt: 1 } } } }),
      // 2. Demographics
      prisma.consultation.groupBy({ by: ["ageGroup"], where: consultWhere, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
      prisma.consultation.groupBy({ by: ["gender"], where: consultWhere, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
      prisma.consultation.groupBy({ by: ["location"], where: consultWhere, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
      prisma.consultation.groupBy({ by: ["shift"], where: { ...consultWhere, shift: { not: null } }, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
      // 3. Trends
      prisma.$queryRawUnsafe<Array<{ period: string; total: bigint; unique_patients: bigint }>>(
        `SELECT
          to_char(c.appointment_date, 'YYYY-MM') as period,
          COUNT(*) as total,
          COUNT(DISTINCT c.employee_id) as unique_patients
        FROM consultations c
        WHERE ${sqlWhere}
        GROUP BY to_char(c.appointment_date, 'YYYY-MM')
        ORDER BY period`,
        ...sqlParams
      ),
      // 4. Critical Risk
      prisma.emotionalWellbeingAssessment.count({ where: { ...ewbWhere, suicidalThoughts: true } }),
      prisma.emotionalWellbeingAssessment.count({ where: { ...ewbWhere, selfHarmAttempt: true } }),
      prisma.emotionalWellbeingAssessment.count({ where: { ...ewbWhere, hasCriticalRisk: true } }),
      // 5. Substance Use
      prisma.emotionalWellbeingAssessment.count({ where: ewbWhere }),
      prisma.emotionalWellbeingAssessment.count({ where: { ...ewbWhere, substanceUse: true } }),
      // 6. Sleep
      prisma.$queryRawUnsafe<Array<{ bucket: string; cnt: bigint }>>(
        `SELECT
          CASE
            WHEN a.sleep_hours < 7 THEN 'Less than 7 hrs'
            WHEN a.sleep_hours <= 9 THEN '7-9 hrs'
            ELSE 'More than 9 hrs'
          END as bucket,
          COUNT(*) as cnt
        FROM app_activities a
        JOIN employees emp ON emp.id = a.employee_id
        WHERE a.sleep_hours IS NOT NULL
          ${locations?.length ? `AND emp.location = ANY($1)` : ""}
          ${clientId ? `AND emp.client_id = $${locations?.length ? 2 : 1}` : ""}
        GROUP BY bucket`,
        ...(locations?.length ? [locations, ...(clientId ? [clientId] : [])] : (clientId ? [clientId] : []))
      ),
      prisma.$queryRawUnsafe<Array<{ quality: string; cnt: bigint }>>(
        `SELECT
          CASE
            WHEN a.sleep_hours >= 7 AND a.sleep_hours <= 9 THEN 'Good'
            WHEN a.sleep_hours >= 6 OR a.sleep_hours > 9 THEN 'Average'
            ELSE 'Poor'
          END as quality,
          COUNT(*) as cnt
        FROM app_activities a
        JOIN employees emp ON emp.id = a.employee_id
        WHERE a.sleep_hours IS NOT NULL
          ${locations?.length ? `AND emp.location = ANY($1)` : ""}
          ${clientId ? `AND emp.client_id = $${locations?.length ? 2 : 1}` : ""}
        GROUP BY quality`,
        ...(locations?.length ? [locations, ...(clientId ? [clientId] : [])] : (clientId ? [clientId] : []))
      ),
      // 7. Alcohol + Smoking
      prisma.employee.groupBy({
        by: ["alcoholStatus"],
        where: { ...empFilter, alcoholStatus: { not: null } },
        _count: { id: true },
      }),
      prisma.employee.groupBy({
        by: ["smokingStatus"],
        where: { ...empFilter, smokingStatus: { not: null } },
        _count: { id: true },
      }),
      // 8. Visit Pattern
      prisma.consultation.groupBy({
        by: ["employeeId"],
        where: consultWhere,
        _count: { id: true },
      }),
      // 9. Impressions
      prisma.emotionalWellbeingAssessment.groupBy({
        by: ["problemCategory"],
        where: { ...ewbWhere, problemCategory: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.emotionalWellbeingAssessment.groupBy({
        by: ["problemCategory", "problemSubcategory"],
        where: { ...ewbWhere, problemCategory: { not: null }, problemSubcategory: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      // 9b. Impressions by Visit Bucket
      prisma.$queryRawUnsafe<Array<{ visit_bucket: string; problem_category: string; cnt: bigint }>>(
        `WITH patient_visits AS (
          SELECT c.employee_id,
            CASE
              WHEN COUNT(c.id) = 1 THEN '1 Visit'
              WHEN COUNT(c.id) = 2 THEN '2 Visits'
              WHEN COUNT(c.id) = 3 THEN '3 Visits'
              WHEN COUNT(c.id) = 4 THEN '4 Visits'
              ELSE '5+ Visits'
            END as visit_bucket
          FROM consultations c
          WHERE ${sqlWhere}
          GROUP BY c.employee_id
        )
        SELECT pv.visit_bucket, e.problem_category, COUNT(e.id) as cnt
        FROM emotional_wellbeing_assessments e
        JOIN patient_visits pv ON pv.employee_id = e.employee_id
        WHERE e.problem_category IS NOT NULL
        GROUP BY pv.visit_bucket, e.problem_category
        ORDER BY pv.visit_bucket, cnt DESC`,
        ...sqlParams
      ),
      // 10. Scales
      prisma.emotionalWellbeingAssessment.groupBy({
        by: ["anxietySeverity"],
        where: { ...ewbWhere, anxietySeverity: { not: null } },
        _count: { id: true },
      }),
      prisma.emotionalWellbeingAssessment.groupBy({
        by: ["depressionSeverity"],
        where: { ...ewbWhere, depressionSeverity: { not: null } },
        _count: { id: true },
      }),
      prisma.emotionalWellbeingAssessment.groupBy({
        by: ["selfEsteemLevel"],
        where: { ...ewbWhere, selfEsteemLevel: { not: null } },
        _count: { id: true },
      }),
    ]);

    // ── Process results ──
    const uniquePatients = uniquePatientsResult.length;
    const repeatPatients = repeatPatientsResult.length;

    const demographics = {
      age: ageDemo.map((d) => ({ label: d.ageGroup, count: d._count.id })),
      gender: genderDemo.map((d) => ({ label: d.gender, count: d._count.id })),
      location: locationDemo.map((d) => ({ label: d.location, count: d._count.id })),
      shift: shiftDemo.map((d) => ({ label: d.shift || "Unknown", count: d._count.id })),
    };

    const consultTrends = trendsRaw.map((r) => ({
      period: r.period,
      totalConsults: Number(r.total),
      uniquePatients: Number(r.unique_patients),
    }));

    // previousAttempts = critical cases not explained by suicidal thoughts or self-harm attempt
    // (no dedicated DB field — derived as remainder of hasCriticalRisk total)
    const previousAttempts = Math.max(0, totalCritical - selfHarmCount - suicidalCount);
    const criticalRisk = {
      suicidalThoughts: suicidalCount,
      attemptedSelfHarm: selfHarmCount,
      previousAttempts,
      totalCases: totalCritical,
    };

    const substanceUsePct = totalEwb > 0 ? Math.round((substanceCount / totalEwb) * 100) : 0;

    const sleepDuration = sleepRaw.map((r) => ({ label: r.bucket, count: Number(r.cnt) }));
    const sleepQuality = sleepQualityRaw.map((r) => ({ label: r.quality, count: Number(r.cnt) }));

    const alcoholHabit = alcoholRaw.map((r) => ({ label: r.alcoholStatus || "Unknown", count: r._count.id }));
    const smokingHabit = smokingRaw.map((r) => ({ label: r.smokingStatus || "Unknown", count: r._count.id }));

    const visitBuckets: Record<string, number> = { "1 Visit": 0, "2 Visits": 0, "3 Visits": 0, "4 Visits": 0, "5+ Visits": 0 };
    visitCounts.forEach((v) => {
      const c = v._count.id;
      if (c === 1) visitBuckets["1 Visit"]++;
      else if (c === 2) visitBuckets["2 Visits"]++;
      else if (c === 3) visitBuckets["3 Visits"]++;
      else if (c === 4) visitBuckets["4 Visits"]++;
      else visitBuckets["5+ Visits"]++;
    });
    const visitPattern = Object.entries(visitBuckets).map(([label, count]) => ({ label, count }));

    const impressions = problemCats.map((p) => ({ category: p.problemCategory!, count: p._count.id }));
    const impressionSubcategories: Record<string, Array<{ subcategory: string; count: number }>> = {};
    problemSubs.forEach((p) => {
      const cat = p.problemCategory!;
      if (!impressionSubcategories[cat]) impressionSubcategories[cat] = [];
      impressionSubcategories[cat].push({ subcategory: p.problemSubcategory!, count: p._count.id });
    });

    const impressionsByVisitBucket: Record<string, Array<{ category: string; count: number }>> = {};
    impressionsByVisitRaw.forEach((r) => {
      if (!impressionsByVisitBucket[r.visit_bucket]) impressionsByVisitBucket[r.visit_bucket] = [];
      impressionsByVisitBucket[r.visit_bucket].push({ category: r.problem_category, count: Number(r.cnt) });
    });

    const anxietyScale = anxietyDist.map((a) => ({ label: a.anxietySeverity!, count: a._count.id }));
    const depressionScale = depressionDist.map((d) => ({ label: d.depressionSeverity!, count: d._count.id }));
    const selfEsteemScale = selfEsteemDist.map((s) => ({ label: s.selfEsteemLevel!, count: s._count.id }));

    return NextResponse.json({
      kpis: { totalConsults, uniquePatients, repeatPatients, totalEwbAssessed: totalEwb },
      charts: {
        demographics,
        consultTrends,
        criticalRisk,
        substanceUsePct,
        sleepQuality,
        sleepDuration,
        alcoholHabit,
        smokingHabit,
        visitPattern,
        impressions,
        impressionSubcategories,
        impressionsByVisitBucket,
        anxietyScale,
        depressionScale,
        selfEsteemScale,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Emotional Wellbeing API error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

export const GET = withCache(handler, { endpoint: "ohc/emotional-wellbeing" });
