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
    const specialties = searchParams.get("specialties")?.split(",").filter(Boolean);
    const clientId = searchParams.get("clientId");

    // Build consultation WHERE for relation filter
    const consultWhere: Record<string, unknown> = {};
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

    const referralWhere: Record<string, unknown> = {
      consultation: consultWhere,
    };
    if (specialties?.length) referralWhere.referredTo = { in: specialties };

    // Build SQL WHERE for raw queries
    const conditions: string[] = ["1=1"];
    const params: unknown[] = [];
    let paramIdx = 1;
    if (dateFrom) { conditions.push(`c.appointment_date >= $${paramIdx++}`); params.push(new Date(dateFrom)); }
    if (dateTo) { conditions.push(`c.appointment_date <= $${paramIdx++}`); params.push(new Date(dateTo)); }
    if (locations?.length) { conditions.push(`c.location = ANY($${paramIdx++})`); params.push(locations); }
    if (genders?.length) { conditions.push(`c.gender = ANY($${paramIdx++})`); params.push(genders.map((g) => g.toUpperCase())); }
    if (ageGroups?.length) { conditions.push(`c.age_group = ANY($${paramIdx++})`); params.push(ageGroups); }
    if (specialties?.length) { conditions.push(`r.referred_to = ANY($${paramIdx++})`); params.push(specialties); }
    if (clientId) { conditions.push(`c.client_id = $${paramIdx++}`); params.push(clientId); }
    const sqlWhere = conditions.join(" AND ");

    // ── Run all independent queries in parallel ──
    const [
      totalReferrals,
      availableInClinicCount,
      convertedCount,
      trendsRaw,
      matrixRaw,
      demoRaw,
      specDetailRaw,
      locationSpecRaw,
    ] = await Promise.all([
      prisma.consultationReferral.count({ where: referralWhere }),
      prisma.consultationReferral.count({ where: { ...referralWhere, isAvailableInClinic: true } }),
      prisma.consultationReferral.count({ where: { ...referralWhere, isAvailableInClinic: true, hasConverted: true } }),
      prisma.$queryRawUnsafe<Array<{
        period: string; sort_key: string; total: bigint; available_in_clinic: bigint; conversions: bigint;
      }>>(`
        SELECT
          to_char(r.referral_date, 'Mon-YY') as period,
          to_char(r.referral_date, 'YYYY-MM') as sort_key,
          COUNT(*) as total,
          COUNT(CASE WHEN r.is_available_in_clinic = true THEN 1 END) as available_in_clinic,
          COUNT(CASE WHEN r.is_available_in_clinic = true AND r.has_converted = true THEN 1 END) as conversions
        FROM consultation_referrals r
        JOIN consultations c ON c.id = r.consultation_id
        WHERE ${sqlWhere}
        GROUP BY to_char(r.referral_date, 'Mon-YY'), to_char(r.referral_date, 'YYYY-MM')
        ORDER BY sort_key
      `, ...params),
      prisma.$queryRawUnsafe<Array<{ referred_from: string; referred_to: string; cnt: bigint; yr: string }>>(`
        SELECT
          r.referred_from,
          r.referred_to,
          to_char(r.referral_date, 'YYYY') as yr,
          COUNT(*) as cnt
        FROM consultation_referrals r
        JOIN consultations c ON c.id = r.consultation_id
        WHERE ${sqlWhere}
        GROUP BY r.referred_from, r.referred_to, to_char(r.referral_date, 'YYYY')
        ORDER BY cnt DESC
      `, ...params),
      prisma.$queryRawUnsafe<Array<{ age_group: string; gender: string; cnt: bigint }>>(`
        SELECT c.age_group, c.gender, COUNT(*) as cnt
        FROM consultation_referrals r
        JOIN consultations c ON c.id = r.consultation_id
        WHERE ${sqlWhere}
        GROUP BY c.age_group, c.gender
      `, ...params),
      prisma.$queryRawUnsafe<Array<{
        referred_to: string; is_available_in_clinic: boolean; referrals: bigint; conversions: bigint;
      }>>(`
        SELECT
          r.referred_to,
          r.is_available_in_clinic,
          COUNT(*) as referrals,
          COUNT(CASE WHEN r.has_converted = true THEN 1 END) as conversions
        FROM consultation_referrals r
        JOIN consultations c ON c.id = r.consultation_id
        WHERE ${sqlWhere}
        GROUP BY r.referred_to, r.is_available_in_clinic
        ORDER BY referrals DESC
      `, ...params),
      prisma.$queryRawUnsafe<Array<{
        location: string; referred_to: string; is_available_in_clinic: boolean; cnt: bigint;
      }>>(`
        SELECT
          c.location,
          r.referred_to,
          r.is_available_in_clinic,
          COUNT(*) as cnt
        FROM consultation_referrals r
        JOIN consultations c ON c.id = r.consultation_id
        WHERE ${sqlWhere}
        GROUP BY c.location, r.referred_to, r.is_available_in_clinic
        ORDER BY cnt DESC
      `, ...params),
    ]);

    // ── Process KPIs ──
    const availableInClinicPct = totalReferrals > 0 ? Math.round((availableInClinicCount / totalReferrals) * 100) : 0;
    const conversionPct = availableInClinicCount > 0 ? Math.round((convertedCount / availableInClinicCount) * 100) : 0;

    // ── Process Trends ──
    const referralTrends = trendsRaw.map((r: any) => ({
      period: r.period,
      totalReferrals: Number(r.total),
      availableInClinic: Number(r.available_in_clinic),
      inClinicConversions: Number(r.conversions),
    }));

    // ── Process Matrix ──
    const matrixByYear: Record<string, Array<{ referredFrom: string; referredTo: string; count: number }>> = {};
    matrixRaw.forEach((r) => {
      const yr = r.yr;
      if (!matrixByYear[yr]) matrixByYear[yr] = [];
      matrixByYear[yr].push({
        referredFrom: r.referred_from,
        referredTo: r.referred_to,
        count: Number(r.cnt),
      });
    });
    const matrixYears = Object.keys(matrixByYear).sort();

    // ── Process Demographics ──
    const ageOrder = ["18-25", "26-35", "36-45", "36-44", "45-59", "46-55", "56-65", "60+", "65+"];
    const demoByAge: Record<string, { male: number; female: number }> = {};
    let totalMale = 0, totalFemale = 0;
    demoRaw.forEach((r) => {
      const ag = r.age_group;
      if (!demoByAge[ag]) demoByAge[ag] = { male: 0, female: 0 };
      const cnt = Number(r.cnt);
      if (r.gender === "MALE") { demoByAge[ag].male += cnt; totalMale += cnt; }
      else if (r.gender === "FEMALE") { demoByAge[ag].female += cnt; totalFemale += cnt; }
    });

    const demographics = ageOrder
      .filter((ag) => demoByAge[ag])
      .map((ag) => ({ ageGroup: ag, male: demoByAge[ag].male, female: demoByAge[ag].female }));

    const ageGroupTotals = demographics.map((d) => ({ ageGroup: d.ageGroup, total: d.male + d.female }));
    const topAgeGroup = ageGroupTotals.sort((a, b) => b.total - a.total)[0];
    const topGender = totalMale >= totalFemale ? "Male" : "Female";
    const topGenderCount = Math.max(totalMale, totalFemale);
    let topCombo = { ageGroup: "", gender: "", count: 0 };
    demographics.forEach((d) => {
      if (d.male > topCombo.count) topCombo = { ageGroup: d.ageGroup, gender: "Male", count: d.male };
      if (d.female > topCombo.count) topCombo = { ageGroup: d.ageGroup, gender: "Female", count: d.female };
    });

    // ── Process Specialty Details ──
    const specDetailMap: Record<string, {
      specialty: string; isAvailableInClinic: boolean; referrals: number; inClinicConsults: number; conversionRate: number;
    }> = {};
    specDetailRaw.forEach((r) => {
      const key = r.referred_to;
      if (!specDetailMap[key]) {
        specDetailMap[key] = {
          specialty: r.referred_to,
          isAvailableInClinic: r.is_available_in_clinic,
          referrals: 0,
          inClinicConsults: 0,
          conversionRate: 0,
        };
      }
      specDetailMap[key].referrals += Number(r.referrals);
      if (r.is_available_in_clinic) {
        specDetailMap[key].isAvailableInClinic = true;
        specDetailMap[key].inClinicConsults += Number(r.conversions);
      }
    });

    const specialtyDetails = Object.values(specDetailMap)
      .map((s) => ({
        ...s,
        conversionRate: s.referrals > 0 ? Math.round((s.inClinicConsults / s.referrals) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.referrals - a.referrals);

    // ── Process Location x Specialty ──
    const locMap: Record<string, Record<string, { count: number; available: boolean }>> = {};
    const allRefSpecialties = new Set<string>();
    locationSpecRaw.forEach((r) => {
      if (!locMap[r.location]) locMap[r.location] = {};
      const key = r.referred_to;
      allRefSpecialties.add(key);
      if (!locMap[r.location][key]) locMap[r.location][key] = { count: 0, available: r.is_available_in_clinic };
      locMap[r.location][key].count += Number(r.cnt);
      if (r.is_available_in_clinic) locMap[r.location][key].available = true;
    });

    const locationBySpecialty = Object.entries(locMap)
      .map(([location, specs]) => {
        const row: Record<string, unknown> = { location };
        Object.entries(specs).forEach(([spec, data]) => {
          row[spec] = data.count;
        });
        return row;
      })
      .sort((a, b) => {
        const sum = (obj: Record<string, unknown>) =>
          Object.entries(obj).filter(([k]) => k !== "location").reduce((s, [, v]) => s + (typeof v === "number" ? v : 0), 0);
        return sum(b) - sum(a);
      });

    const specAvailability: Record<string, boolean> = {};
    locationSpecRaw.forEach((r) => {
      if (r.is_available_in_clinic) specAvailability[r.referred_to] = true;
      if (!(r.referred_to in specAvailability)) specAvailability[r.referred_to] = r.is_available_in_clinic;
    });

    const specTotals: Record<string, number> = {};
    locationSpecRaw.forEach((r) => {
      specTotals[r.referred_to] = (specTotals[r.referred_to] || 0) + Number(r.cnt);
    });
    const topBarSpecialties = Object.entries(specTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);

    return NextResponse.json({
      kpis: {
        totalReferrals,
        availableInClinicCount,
        availableInClinicPct,
        convertedCount,
        conversionPct,
      },
      charts: {
        referralTrends,
        matrixByYear,
        matrixYears,
        demographics,
        demographicStats: {
          topAgeGroup: topAgeGroup || null,
          topGender: { gender: topGender, count: topGenderCount },
          topCombo,
        },
        specialtyDetails,
        locationBySpecialty,
        topBarSpecialties,
        specAvailability,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("OHC Referral API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export const GET = withCache(handler, { endpoint: "ohc/referral" });
