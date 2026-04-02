// TODO: Replace with dwQuery() using fact_kx / habit_intelligence schemas
import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/cache/middleware";

async function handler(_request: NextRequest) {
  return NextResponse.json({
    kpis: { totalConsults: 0, uniquePatients: 0, repeatPatients: 0, totalEwbAssessed: 0 },
    charts: {
      demographics: {
        age: [],
        gender: [],
        location: [],
        shift: [],
      },
      consultTrends: [],
      criticalRisk: {
        suicidalThoughts: 0,
        attemptedSelfHarm: 0,
        previousAttempts: 0,
        totalCases: 0,
      },
      substanceUsePct: 0,
      sleepQuality: [],
      sleepDuration: [],
      alcoholHabit: [],
      smokingHabit: [],
      visitPattern: [],
      impressions: [],
      impressionSubcategories: {},
      impressionsByVisitBucket: {},
      anxietyScale: [],
      depressionScale: [],
      selfEsteemScale: [],
    },
    lastUpdated: new Date().toISOString(),
  });
}

export const GET = withCache(handler, { endpoint: "ohc/emotional-wellbeing" });
