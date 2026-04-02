// @ts-nocheck — Will be rewritten in Phase 1 with fact_kx queries
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import staticData from "@/lib/data/engagement-data.json";
import { withCache } from "@/lib/cache/middleware";

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const locations = searchParams.get("locations")?.split(",").filter(Boolean);
    const departments = searchParams.get("departments")?.split(",").filter(Boolean);
    const ageGroups = searchParams.get("ageGroups")?.split(",").filter(Boolean);

    // Try DB first
    let dbCount = 0;
    try {
      dbCount = await prisma.appActivity.count();
    } catch {
      // DB not available
    }

    if (dbCount > 0) {
      const where: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        where.activityDate = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        };
      }
      const employeeFilter: Record<string, unknown> = {};
      if (locations?.length) employeeFilter.location = { in: locations };
      if (departments?.length) employeeFilter.department = { in: departments };
      if (Object.keys(employeeFilter).length > 0) {
        where.employee = employeeFilter;
      }

      const results = await Promise.all([
        prisma.appActivity.findMany({
          where: { ...where, appOpened: true },
          select: { employeeId: true },
          distinct: ["employeeId"],
        }),
        prisma.appActivity.aggregate({
          where,
          _avg: { steps: true, activeMinutes: true, sleepHours: true },
        }),
        prisma.appActivity.findMany({
          where,
          select: {
            activityDate: true,
            steps: true,
            activeMinutes: true,
            challengeParticipation: true,
            webinarAttended: true,
            appOpened: true,
          },
        }),
      ]);
      const uniqueUsers = results[0];
      const activities = results[2];

      // Build monthly aggregations
      const monthlyMap: Record<string, {
        totalSteps: number; count: number; challengeCount: number;
        webinarCount: number; activeCount: number;
      }> = {};

      activities.forEach((a) => {
        const date = new Date(a.activityDate);
        const mk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyMap[mk]) {
          monthlyMap[mk] = { totalSteps: 0, count: 0, challengeCount: 0, webinarCount: 0, activeCount: 0 };
        }
        monthlyMap[mk].totalSteps += a.steps || 0;
        monthlyMap[mk].count++;
        if (a.challengeParticipation) monthlyMap[mk].challengeCount++;
        if (a.webinarAttended) monthlyMap[mk].webinarCount++;
        if (a.appOpened) monthlyMap[mk].activeCount++;
      });

      const months = Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b));
      const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const engagementTrends = months.map(([key, data]) => {
        const monthIdx = parseInt(key.split("-")[1]) - 1;
        return {
          month: MONTH_LABELS[monthIdx] || key,
          activeUsers: data.activeCount,
          stepsAvg: data.count > 0 ? Math.round(data.totalSteps / data.count) : 0,
          challengeUsers: data.challengeCount,
          webinarUsers: data.webinarCount,
        };
      });

      return NextResponse.json({
        ...staticData,
        kpis: {
          ...staticData.kpis,
          activeUsers: uniqueUsers.length,
          avgDailyActiveUsers: Math.round(uniqueUsers.length / 30),
        },
        engagementTrends: engagementTrends.length > 0 ? engagementTrends : staticData.engagementTrends,
      });
    }

    // Fallback to static data
    return NextResponse.json(staticData);
  } catch (error) {
    console.error("Engagement API error:", error);
    return NextResponse.json(staticData);
  }
}

export const GET = withCache(handler, { endpoint: "engagement" });
