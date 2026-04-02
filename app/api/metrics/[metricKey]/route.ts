// @ts-nocheck — Will be rewritten to use TS config
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getSessionCugCode } from "@/lib/auth/session";
import { queryMetric } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import type { DashboardFilters } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ metricKey: string }> }
) {
  try {
    await requireAuth();
    const { metricKey } = await params;
    const { searchParams } = request.nextUrl;

    // Resolve CUG code from session + optional clientId param
    const clientId = searchParams.get("clientId") || undefined;
    const cugCode = await getSessionCugCode(clientId ?? undefined);

    if (!cugCode) {
      return NextResponse.json(
        { error: "No client context. Provide clientId or ensure user has a client." },
        { status: 400 }
      );
    }

    // Verify metric exists and is active
    const metric = await prisma.metricDefinition.findUnique({
      where: { metricKey },
    });

    if (!metric || !metric.isActive) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    // Build filters from query params
    const filters: DashboardFilters = {
      cugCode,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      facility: searchParams.get("facility") || undefined,
      specialty: searchParams.get("specialty") || undefined,
      gender: searchParams.get("gender") || undefined,
      ageGroup: searchParams.get("ageGroup") || undefined,
    };

    // Query the derived table
    const data = await queryMetric(metricKey, filters);

    return NextResponse.json({
      metricKey,
      chartType: metric.chartType,
      unit: metric.unit,
      data,
      meta: {
        dateRange: {
          from: filters.dateFrom || null,
          to: filters.dateTo || null,
        },
        filters: {
          cugCode,
          ...(filters.facility && { facility: filters.facility }),
          ...(filters.specialty && { specialty: filters.specialty }),
          ...(filters.gender && { gender: filters.gender }),
          ...(filters.ageGroup && { ageGroup: filters.ageGroup }),
        },
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.startsWith("Unknown metric")) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Metric query error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
