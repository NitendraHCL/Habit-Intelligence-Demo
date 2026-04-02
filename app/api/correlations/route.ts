// TODO: Replace with dwQuery() using fact_kx / habit_intelligence schemas
import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/cache/middleware";

async function handler(_request: NextRequest) {
  return NextResponse.json({
    kpis: {},
    charts: {
      bmiVsBp: [],
      riskDistribution: [],
    },
  });
}

export const GET = withCache(handler, { endpoint: "correlations" });
