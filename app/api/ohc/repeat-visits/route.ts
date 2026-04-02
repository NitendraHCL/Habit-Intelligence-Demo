// @ts-nocheck — Will be rewritten in Phase 1 with fact_kx queries
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withCache } from "@/lib/cache/middleware";

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const locations = searchParams.get("locations")?.split(",").filter(Boolean);
    const genders = searchParams.get("genders")?.split(",").filter(Boolean);
    const ageGroups = searchParams.get("ageGroups")?.split(",").filter(Boolean);
    const clientId = searchParams.get("clientId");
    const minVisits = parseInt(searchParams.get("minVisits") || "2", 10);
    const conditionFilter = searchParams.get("conditionFilter") || "all"; // all | chronic | acute

    // ── Base WHERE for consultations ──
    const where: Record<string, unknown> = { totalVisitCount: { gte: minVisits } };
    if (dateFrom || dateTo) {
      where.appointmentDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (locations?.length) where.location = { in: locations };
    if (genders?.length) where.gender = { in: genders.map((g) => g.toUpperCase()) };
    if (ageGroups?.length) where.ageGroup = { in: ageGroups };
    if (clientId) where.clientId = clientId;

    // ── SQL WHERE builder ──
    const conds: string[] = [`c.total_visit_count >= $1`];
    const params: unknown[] = [minVisits];
    let idx = 2;
    if (dateFrom) { conds.push(`c.appointment_date >= $${idx++}`); params.push(new Date(dateFrom)); }
    if (dateTo) { conds.push(`c.appointment_date <= $${idx++}`); params.push(new Date(dateTo)); }
    if (locations?.length) { conds.push(`c.location = ANY($${idx++})`); params.push(locations); }
    if (genders?.length) { conds.push(`c.gender = ANY($${idx++})`); params.push(genders.map((g) => g.toUpperCase())); }
    if (ageGroups?.length) { conds.push(`c.age_group = ANY($${idx++})`); params.push(ageGroups); }
    if (clientId) { conds.push(`c.client_id = $${idx++}`); params.push(clientId); }

    // Condition type sub-filter
    if (conditionFilter === "chronic") {
      conds.push(`c.employee_id IN (SELECT DISTINCT cd.employee_id FROM consultation_diagnoses cd WHERE cd.condition_type = 'CHRONIC')`);
    } else if (conditionFilter === "acute") {
      conds.push(`c.employee_id IN (SELECT DISTINCT cd.employee_id FROM consultation_diagnoses cd WHERE cd.condition_type = 'ACUTE')`);
    }
    const sqlWhere = conds.join(" AND ");

    // ── Run ALL independent queries in parallel ──
    const [
      kpiRaw,
      npsRaw,
      chronicAcuteRaw,
      ageDemoRaw,
      genderDemoRaw,
      locationDemoRaw,
      freqRaw,
      treemapRaw,
      transitionRaw,
      freqNpsRaw,
      chronicCondRaw,
      acuteCondRaw,
      segmentRaw,
      cohortFreqRaw,
      sankeyRaw,
      sankeyV2V3,
    ] = await Promise.all([
      // 1. KPIs
      prisma.$queryRawUnsafe<Array<{ total_patients: bigint; total_consults: bigint; avg_frequency: number }>>(`
        SELECT
          COUNT(DISTINCT c.employee_id) as total_patients,
          COUNT(*) as total_consults,
          COALESCE(AVG(c.total_visit_count)::numeric, 0) as avg_frequency
        FROM consultations c
        WHERE ${sqlWhere}
      `, ...params),
      // Avg NPS
      prisma.$queryRawUnsafe<Array<{ avg_nps: number }>>(`
        SELECT COALESCE(AVG(n.score)::numeric, 0) as avg_nps
        FROM consultation_nps n
        JOIN consultations c ON c.id = n.consultation_id
        WHERE ${sqlWhere}
      `, ...params),
      // 2. Chronic vs Acute
      prisma.$queryRawUnsafe<Array<{ condition_type: string; patient_count: bigint }>>(`
        SELECT cd.condition_type, COUNT(DISTINCT c.employee_id) as patient_count
        FROM consultation_diagnoses cd
        JOIN consultations c ON c.id = cd.consultation_id
        WHERE ${sqlWhere}
        GROUP BY cd.condition_type
      `, ...params),
      // 3. Demographics
      prisma.$queryRawUnsafe<Array<{ age_group: string; cnt: bigint }>>(`
        SELECT c.age_group, COUNT(DISTINCT c.employee_id) as cnt
        FROM consultations c WHERE ${sqlWhere} GROUP BY c.age_group ORDER BY cnt DESC
      `, ...params),
      prisma.$queryRawUnsafe<Array<{ gender: string; cnt: bigint }>>(`
        SELECT c.gender, COUNT(DISTINCT c.employee_id) as cnt
        FROM consultations c WHERE ${sqlWhere} GROUP BY c.gender ORDER BY cnt DESC
      `, ...params),
      prisma.$queryRawUnsafe<Array<{ location: string; cnt: bigint }>>(`
        SELECT c.location, COUNT(DISTINCT c.employee_id) as cnt
        FROM consultations c WHERE ${sqlWhere} GROUP BY c.location ORDER BY cnt DESC
      `, ...params),
      // 4. Repeat Visit Frequency
      prisma.$queryRawUnsafe<Array<{ visit_bucket: string; same_specialty: bigint; diff_specialty: bigint }>>(`
        WITH patient_specs AS (
          SELECT c.employee_id, c.total_visit_count,
            COUNT(DISTINCT c.specialty) as unique_specialties
          FROM consultations c
          WHERE ${sqlWhere}
          GROUP BY c.employee_id, c.total_visit_count
        )
        SELECT
          CASE
            WHEN total_visit_count = 2 THEN '2x'
            WHEN total_visit_count = 3 THEN '3x'
            WHEN total_visit_count = 4 THEN '4x'
            ELSE '5+x'
          END as visit_bucket,
          COUNT(CASE WHEN unique_specialties = 1 THEN 1 END) as same_specialty,
          COUNT(CASE WHEN unique_specialties > 1 THEN 1 END) as diff_specialty
        FROM patient_specs
        GROUP BY visit_bucket
        ORDER BY visit_bucket
      `, ...params),
      // 5. Treemap
      prisma.$queryRawUnsafe<Array<{ specialty: string; yr: string; patient_count: bigint; avg_visits: number }>>(`
        SELECT c.specialty,
          to_char(c.appointment_date, 'YYYY') as yr,
          COUNT(DISTINCT c.employee_id) as patient_count,
          AVG(c.total_visit_count)::numeric as avg_visits
        FROM consultations c
        WHERE ${sqlWhere}
        GROUP BY c.specialty, to_char(c.appointment_date, 'YYYY')
        ORDER BY patient_count DESC
      `, ...params),
      // 6. Condition Transition
      prisma.$queryRawUnsafe<Array<{ first_type: string; last_type: string; patient_count: bigint; avg_nps: number }>>(`
        WITH first_diag AS (
          SELECT DISTINCT ON (cd.employee_id) cd.employee_id, cd.condition_type
          FROM consultation_diagnoses cd
          JOIN consultations c ON c.id = cd.consultation_id
          WHERE ${sqlWhere}
          ORDER BY cd.employee_id, cd.diagnosis_date ASC
        ),
        last_diag AS (
          SELECT DISTINCT ON (cd.employee_id) cd.employee_id, cd.condition_type
          FROM consultation_diagnoses cd
          JOIN consultations c ON c.id = cd.consultation_id
          WHERE ${sqlWhere}
          ORDER BY cd.employee_id, cd.diagnosis_date DESC
        ),
        transitions AS (
          SELECT f.employee_id, f.condition_type as first_type, l.condition_type as last_type
          FROM first_diag f JOIN last_diag l ON f.employee_id = l.employee_id
        )
        SELECT t.first_type, t.last_type,
          COUNT(*) as patient_count,
          COALESCE(AVG(n.score)::numeric, 0) as avg_nps
        FROM transitions t
        LEFT JOIN consultations c ON c.employee_id = t.employee_id AND ${sqlWhere.replace(/c\./g, 'c.')}
        LEFT JOIN consultation_nps n ON n.consultation_id = c.id
        GROUP BY t.first_type, t.last_type
        ORDER BY patient_count DESC
      `, ...params),
      // 7. Visit Frequency & NPS
      prisma.$queryRawUnsafe<Array<{ visit_bucket: string; total_users: bigint; nps_responses: bigint; avg_nps: number }>>(`
        WITH patient_visits AS (
          SELECT c.employee_id, c.total_visit_count
          FROM consultations c WHERE ${sqlWhere}
          GROUP BY c.employee_id, c.total_visit_count
        ),
        patient_nps AS (
          SELECT c.employee_id, COUNT(n.id) as nps_count, AVG(n.score)::numeric as avg_score
          FROM consultations c
          LEFT JOIN consultation_nps n ON n.consultation_id = c.id
          WHERE ${sqlWhere}
          GROUP BY c.employee_id
        )
        SELECT
          CASE
            WHEN pv.total_visit_count = 2 THEN '2 visits'
            WHEN pv.total_visit_count = 3 THEN '3 visits'
            WHEN pv.total_visit_count = 4 THEN '4 visits'
            ELSE '5+ visits'
          END as visit_bucket,
          COUNT(DISTINCT pv.employee_id) as total_users,
          SUM(CASE WHEN pn.nps_count > 0 THEN 1 ELSE 0 END) as nps_responses,
          COALESCE(AVG(pn.avg_score), 0) as avg_nps
        FROM patient_visits pv
        LEFT JOIN patient_nps pn ON pn.employee_id = pv.employee_id
        GROUP BY visit_bucket
        ORDER BY visit_bucket
      `, ...params),
      // 8. Chronic conditions
      prisma.$queryRawUnsafe<Array<{ diagnosis_text: string; patients: bigint; nps_responses: bigint; avg_nps: number }>>(`
        SELECT cd.icd_category as diagnosis_text,
          COUNT(DISTINCT cd.employee_id) as patients,
          COUNT(DISTINCT n.id) as nps_responses,
          COALESCE(AVG(n.score)::numeric, 0) as avg_nps
        FROM consultation_diagnoses cd
        JOIN consultations c ON c.id = cd.consultation_id
        LEFT JOIN consultation_nps n ON n.consultation_id = c.id
        WHERE ${sqlWhere} AND cd.condition_type = 'CHRONIC'
        GROUP BY cd.icd_category
        ORDER BY patients DESC
        LIMIT 6
      `, ...params),
      // 8b. Acute conditions
      prisma.$queryRawUnsafe<Array<{ diagnosis_text: string; patients: bigint; nps_responses: bigint; avg_nps: number }>>(`
        WITH top_chronic AS (
          SELECT cd2.icd_category
          FROM consultation_diagnoses cd2
          JOIN consultations c ON c.id = cd2.consultation_id
          WHERE ${sqlWhere} AND cd2.condition_type = 'CHRONIC'
          GROUP BY cd2.icd_category ORDER BY COUNT(DISTINCT cd2.employee_id) DESC LIMIT 6
        )
        SELECT cd.icd_category as diagnosis_text,
          COUNT(DISTINCT cd.employee_id) as patients,
          COUNT(DISTINCT n.id) as nps_responses,
          COALESCE(AVG(n.score)::numeric, 0) as avg_nps
        FROM consultation_diagnoses cd
        JOIN consultations c ON c.id = cd.consultation_id
        LEFT JOIN consultation_nps n ON n.consultation_id = c.id
        WHERE ${sqlWhere} AND cd.condition_type = 'ACUTE'
        AND cd.icd_category NOT IN (SELECT icd_category FROM top_chronic)
        GROUP BY cd.icd_category
        ORDER BY patients DESC
        LIMIT 6
      `, ...params),
      // 9. Segments
      prisma.$queryRawUnsafe<Array<{
        tenure: string; patients: bigint; avg_nps: number; avg_visits: number;
        nps_responses: bigint; chronic_patients: bigint; acute_patients: bigint;
        chronic_nps: number; acute_nps: number;
      }>>(`
        WITH active_patients AS (
          SELECT DISTINCT c.employee_id
          FROM consultations c WHERE ${sqlWhere}
        ),
        patient_tenure AS (
          SELECT c.employee_id,
            EXTRACT(YEAR FROM AGE(MAX(c.appointment_date), MIN(c.appointment_date))) as years_active,
            AVG(c.total_visit_count)::numeric as avg_visits
          FROM consultations c
          WHERE c.total_visit_count >= $1
          AND c.employee_id IN (SELECT employee_id FROM active_patients)
          GROUP BY c.employee_id
        ),
        patient_nps AS (
          SELECT c.employee_id, AVG(n.score)::numeric as avg_score, COUNT(n.id) as response_count
          FROM consultations c
          LEFT JOIN consultation_nps n ON n.consultation_id = c.id
          WHERE ${sqlWhere}
          GROUP BY c.employee_id
        ),
        patient_conditions AS (
          SELECT cd.employee_id, cd.condition_type,
            AVG(n.score)::numeric as cond_nps
          FROM consultation_diagnoses cd
          JOIN consultations c ON c.id = cd.consultation_id
          LEFT JOIN consultation_nps n ON n.consultation_id = c.id
          WHERE ${sqlWhere}
          GROUP BY cd.employee_id, cd.condition_type
        ),
        patient_cond_summary AS (
          SELECT employee_id,
            bool_or(condition_type = 'CHRONIC') as has_chronic,
            bool_or(condition_type = 'ACUTE') as has_acute,
            MAX(CASE WHEN condition_type = 'CHRONIC' THEN cond_nps END) as chronic_nps,
            MAX(CASE WHEN condition_type = 'ACUTE' THEN cond_nps END) as acute_nps
          FROM patient_conditions GROUP BY employee_id
        )
        SELECT
          CASE
            WHEN pt.years_active >= 3 THEN '3+ years'
            WHEN pt.years_active >= 2 THEN '2 years'
            ELSE '1 year'
          END as tenure,
          COUNT(DISTINCT pt.employee_id) as patients,
          COALESCE(AVG(pn.avg_score), 0) as avg_nps,
          AVG(pt.avg_visits)::numeric as avg_visits,
          COUNT(DISTINCT CASE WHEN pn.response_count > 0 THEN pt.employee_id END) as nps_responses,
          COUNT(DISTINCT CASE WHEN pcs.has_chronic THEN pt.employee_id END) as chronic_patients,
          COUNT(DISTINCT CASE WHEN pcs.has_acute THEN pt.employee_id END) as acute_patients,
          COALESCE(AVG(pcs.chronic_nps), 0) as chronic_nps,
          COALESCE(AVG(pcs.acute_nps), 0) as acute_nps
        FROM patient_tenure pt
        LEFT JOIN patient_nps pn ON pn.employee_id = pt.employee_id
        LEFT JOIN patient_cond_summary pcs ON pcs.employee_id = pt.employee_id
        GROUP BY tenure
        ORDER BY tenure DESC
      `, ...params),
      // 10. Cohort
      prisma.$queryRawUnsafe<Array<{ yr: string; threshold: string; patient_count: bigint }>>(`
        WITH patient_year_visits AS (
          SELECT c.employee_id,
            to_char(c.appointment_date, 'YYYY') as yr,
            c.total_visit_count
          FROM consultations c
          WHERE ${sqlWhere}
          GROUP BY c.employee_id, to_char(c.appointment_date, 'YYYY'), c.total_visit_count
        )
        SELECT yr,
          unnest(ARRAY['3+', '4+', '5+', '6+']) as threshold,
          unnest(ARRAY[
            COUNT(CASE WHEN total_visit_count >= 3 THEN 1 END),
            COUNT(CASE WHEN total_visit_count >= 4 THEN 1 END),
            COUNT(CASE WHEN total_visit_count >= 5 THEN 1 END),
            COUNT(CASE WHEN total_visit_count >= 6 THEN 1 END)
          ]) as patient_count
        FROM patient_year_visits
        GROUP BY yr
        ORDER BY yr, threshold
      `, ...params),
      // 11. Sankey V1→V2
      prisma.$queryRawUnsafe<Array<{ v1_cat: string; v2_cat: string; flow_count: bigint }>>(`
        WITH ranked_vitals AS (
          SELECT cv.employee_id, cv.bmi,
            ROW_NUMBER() OVER (PARTITION BY cv.employee_id ORDER BY cv.recorded_date ASC) as visit_num
          FROM consultation_vitals cv
          JOIN consultations c ON c.id = cv.consultation_id
          WHERE ${sqlWhere} AND cv.bmi IS NOT NULL
        ),
        categorized AS (
          SELECT employee_id, visit_num,
            CASE
              WHEN bmi < 18.5 THEN 'Below Normal'
              WHEN bmi <= 24.9 THEN 'In Range'
              ELSE 'Above Normal'
            END as category
          FROM ranked_vitals WHERE visit_num <= 3
        )
        SELECT
          v1.category as v1_cat,
          v2.category as v2_cat,
          COUNT(*) as flow_count
        FROM categorized v1
        JOIN categorized v2 ON v1.employee_id = v2.employee_id AND v1.visit_num = 1 AND v2.visit_num = 2
        GROUP BY v1.category, v2.category
        ORDER BY flow_count DESC
      `, ...params),
      // 11b. Sankey V2→V3
      prisma.$queryRawUnsafe<Array<{ v2_cat: string; v3_cat: string; flow_count: bigint }>>(`
        WITH ranked_vitals AS (
          SELECT cv.employee_id, cv.bmi,
            ROW_NUMBER() OVER (PARTITION BY cv.employee_id ORDER BY cv.recorded_date ASC) as visit_num
          FROM consultation_vitals cv
          JOIN consultations c ON c.id = cv.consultation_id
          WHERE ${sqlWhere} AND cv.bmi IS NOT NULL
        ),
        categorized AS (
          SELECT employee_id, visit_num,
            CASE
              WHEN bmi < 18.5 THEN 'Below Normal'
              WHEN bmi <= 24.9 THEN 'In Range'
              ELSE 'Above Normal'
            END as category
          FROM ranked_vitals WHERE visit_num <= 3
        )
        SELECT
          v2.category as v2_cat,
          v3.category as v3_cat,
          COUNT(*) as flow_count
        FROM categorized v2
        JOIN categorized v3 ON v2.employee_id = v3.employee_id AND v2.visit_num = 2 AND v3.visit_num = 3
        GROUP BY v2.category, v3.category
        ORDER BY flow_count DESC
      `, ...params),
    ]);

    // ── Process all results ──
    const totalRepeatPatients = Number(kpiRaw[0]?.total_patients || 0);
    const totalConsultsByRepeat = Number(kpiRaw[0]?.total_consults || 0);
    const avgVisitFrequency = totalRepeatPatients > 0
      ? Math.round((totalConsultsByRepeat / totalRepeatPatients) * 10) / 10
      : 0;
    const avgNps = Math.round(Number(npsRaw[0]?.avg_nps || 0));

    let chronicCount = 0, acuteCount = 0;
    chronicAcuteRaw.forEach((r) => {
      if (r.condition_type === "CHRONIC") chronicCount = Number(r.patient_count);
      else if (r.condition_type === "ACUTE") acuteCount = Number(r.patient_count);
    });

    const demographics = {
      ageGroups: ageDemoRaw.map((r) => ({ label: r.age_group, count: Number(r.cnt) })),
      genderSplit: genderDemoRaw.map((r) => ({ label: r.gender, count: Number(r.cnt) })),
      locationDistribution: locationDemoRaw.map((r) => ({ label: r.location, count: Number(r.cnt) })),
    };

    const repeatVisitFrequency = freqRaw.map((r) => ({
      bucket: r.visit_bucket,
      sameSpecialty: Number(r.same_specialty),
      differentSpecialty: Number(r.diff_specialty),
    }));

    const treemapByYear: Record<string, Array<{ name: string; value: number; avgVisits: number }>> = {};
    treemapRaw.forEach((r) => {
      if (!treemapByYear[r.yr]) treemapByYear[r.yr] = [];
      treemapByYear[r.yr].push({
        name: r.specialty,
        value: Number(r.patient_count),
        avgVisits: Math.round(Number(r.avg_visits) * 10) / 10,
      });
    });
    const treemapYears = Object.keys(treemapByYear).sort();

    const conditionTransitions = transitionRaw.map((r) => ({
      transition: `${r.first_type === "CHRONIC" ? "Chronic" : "Acute"} → ${r.last_type === "CHRONIC" ? "Chronic" : "Acute"}`,
      count: Number(r.patient_count),
      avgNps: Math.round(Number(r.avg_nps)),
    }));

    const visitFrequencyNps = freqNpsRaw.map((r) => ({
      bucket: r.visit_bucket,
      totalUsers: Number(r.total_users),
      npsResponses: Number(r.nps_responses),
      avgNps: Math.round(Number(r.avg_nps)),
    }));

    const recurringConditions: Record<string, Array<{ name: string; patients: number; npsResponses: number; avgNps: number }>> = {
      chronic: chronicCondRaw.map((r) => ({
        name: r.diagnosis_text,
        patients: Number(r.patients),
        npsResponses: Number(r.nps_responses),
        avgNps: Math.round(Number(r.avg_nps)),
      })),
      acute: acuteCondRaw.map((r) => ({
        name: r.diagnosis_text,
        patients: Number(r.patients),
        npsResponses: Number(r.nps_responses),
        avgNps: Math.round(Number(r.avg_nps)),
      })),
    };

    const repeatUserSegments = segmentRaw.map((r) => {
      const patients = Number(r.patients);
      const chronic = Number(r.chronic_patients);
      const acute = Number(r.acute_patients);
      const npsResp = Number(r.nps_responses);
      return {
        label: r.tenure,
        patients,
        avgNps: Math.round(Number(r.avg_nps) * 10) / 10,
        visitsPerYear: Math.round(Number(r.avg_visits) * 10) / 10,
        responseRate: patients > 0 ? Math.min(100, Math.round((npsResp / patients) * 100)) : 0,
        chronic: { count: chronic, pct: patients > 0 ? Math.round((chronic / patients) * 100) : 0, nps: Math.round(Number(r.chronic_nps) * 10) / 10 },
        acute: { count: acute, pct: patients > 0 ? Math.round((acute / patients) * 100) : 0, nps: Math.round(Number(r.acute_nps) * 10) / 10 },
      };
    });

    const cohortFreqByYear: Record<string, Array<{ threshold: string; count: number }>> = {};
    cohortFreqRaw.forEach((r) => {
      if (!cohortFreqByYear[r.yr]) cohortFreqByYear[r.yr] = [];
      cohortFreqByYear[r.yr].push({ threshold: r.threshold, count: Number(r.patient_count) });
    });
    const cohortYears = Object.keys(cohortFreqByYear).sort();

    // Sankey
    const sankeyCategories = ["Above Normal", "In Range", "Below Normal"];
    const sankeyNodes = [
      ...sankeyCategories.map((c) => ({ name: `Visit 1 - ${c}` })),
      ...sankeyCategories.map((c) => ({ name: `Visit 2 - ${c}` })),
      ...sankeyCategories.map((c) => ({ name: `Visit 3 - ${c}` })),
    ];

    const sankeyLinks = [
      ...sankeyRaw.map((r) => ({
        source: `Visit 1 - ${r.v1_cat}`,
        target: `Visit 2 - ${r.v2_cat}`,
        value: Number(r.flow_count),
      })),
      ...sankeyV2V3.map((r) => ({
        source: `Visit 2 - ${r.v2_cat}`,
        target: `Visit 3 - ${r.v3_cat}`,
        value: Number(r.flow_count),
      })),
    ];

    const v1Totals: Record<string, number> = {};
    const v2Totals: Record<string, number> = {};
    const v3Totals: Record<string, number> = {};
    sankeyRaw.forEach((r) => {
      v1Totals[r.v1_cat] = (v1Totals[r.v1_cat] || 0) + Number(r.flow_count);
      v2Totals[r.v2_cat] = (v2Totals[r.v2_cat] || 0) + Number(r.flow_count);
    });
    sankeyV2V3.forEach((r) => {
      v3Totals[r.v3_cat] = (v3Totals[r.v3_cat] || 0) + Number(r.flow_count);
    });

    return NextResponse.json({
      kpis: {
        totalRepeatPatients,
        avgVisitFrequency,
        totalConsultsByRepeat,
        avgNps,
      },
      charts: {
        chronicVsAcute: { chronic: chronicCount, acute: acuteCount },
        demographics,
        repeatVisitFrequency,
        specialtyTreemap: treemapByYear,
        treemapYears,
        conditionTransitions,
        visitFrequencyNps,
        recurringConditions,
        repeatUserSegments,
        sankeyFlow: { nodes: sankeyNodes, links: sankeyLinks },
        vitalTotals: { v1: v1Totals, v2: v2Totals, v3: v3Totals },
        cohortVisitFrequency: cohortFreqByYear,
        cohortYears,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Repeat Visits API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export const GET = withCache(handler, { endpoint: "ohc/repeat-visits" });
