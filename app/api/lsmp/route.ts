// TODO: Replace with dwQuery() using fact_kx / habit_intelligence schemas
import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/cache/middleware";

async function handler(_req: NextRequest) {
  return NextResponse.json({
    kpis: {
      totalEnrollments: { value: 0, trend: 0, trendLabel: "vs Last Year" },
      activeInCarePlan: { value: 0, trend: 0, trendLabel: "Last Month" },
      completionRate: { value: 0, trend: 0, trendLabel: "vs Target" },
      overallImprovement: { value: 0, trend: 0, trendLabel: "Last Quarter" },
      avgDuration: { value: 0, trend: 0, trendLabel: "days vs avg" },
    },
    carePlanDistribution: [],
    ageGroupDistribution: [],
    genderDistribution: [],
    improvementStatus: [],
    complianceStatus: [],
    locationDistribution: [],
    carePlanTrends: [],
    improvementVsDuration: [],
    complianceTriggerPattern: { rows: [], columns: [], data: [] },
  });
}

export const GET = withCache(handler, { endpoint: "lsmp" });
