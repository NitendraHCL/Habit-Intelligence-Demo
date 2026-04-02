// TODO: Replace with dwQuery() using fact_kx / habit_intelligence schemas
import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/cache/middleware";

async function handler(_request: NextRequest) {
  return NextResponse.json({
    kpis: {
      totalReferrals: 0,
      availableInClinicCount: 0,
      availableInClinicPct: 0,
      convertedCount: 0,
      conversionPct: 0,
    },
    charts: {
      referralTrends: [],
      matrixByYear: {},
      matrixYears: [],
      demographics: [],
      demographicStats: {
        topAgeGroup: null,
        topGender: { gender: "", count: 0 },
        topCombo: { ageGroup: "", gender: "", count: 0 },
      },
      specialtyDetails: [],
      locationBySpecialty: [],
      topBarSpecialties: [],
      specAvailability: {},
    },
    lastUpdated: new Date().toISOString(),
  });
}

export const GET = withCache(handler, { endpoint: "ohc/referral" });
