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

    const consultWhere: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      consultWhere.appointmentDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (locations?.length) consultWhere.location = { in: locations };
    if (genders?.length) consultWhere.gender = { in: genders };
    if (ageGroups?.length) consultWhere.ageGroup = { in: ageGroups };
    if (clientId) consultWhere.clientId = clientId;

    // BMI vs BP scatter data from consultation vitals
    const vitals = await prisma.consultationVital.findMany({
      where: {
        consultation: consultWhere,
        bmi: { not: null },
        bpSystolic: { not: null },
      },
      select: {
        bmi: true,
        bpSystolic: true,
        bpDiastolic: true,
      },
    });

    const bmiVsBp = vitals.map((v) => ({
      bmi: v.bmi,
      bpSystolic: v.bpSystolic,
      bpDiastolic: v.bpDiastolic,
    }));

    // Risk distribution from HRA responses
    const hraWhere: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      hraWhere.completedDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const employeeFilter: Record<string, unknown> = {};
    if (clientId) employeeFilter.clientId = clientId;
    if (locations?.length) employeeFilter.location = { in: locations };
    if (genders?.length) employeeFilter.gender = { in: genders };
    if (Object.keys(employeeFilter).length > 0) {
      hraWhere.employee = employeeFilter;
    }

    const riskGroups = await prisma.hRAResponse.groupBy({
      by: ["overallRisk"],
      where: hraWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const riskDistribution = riskGroups.map((r) => ({
      risk: r.overallRisk,
      count: r._count.id,
    }));

    return NextResponse.json({
      kpis: {},
      charts: {
        bmiVsBp,
        riskDistribution,
      },
    });
  } catch (error) {
    console.error("Correlations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withCache(handler, { endpoint: "correlations" });
