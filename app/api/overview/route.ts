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

    const employeeWhere: Record<string, unknown> = {};
    if (clientId) employeeWhere.clientId = clientId;
    if (locations?.length) employeeWhere.location = { in: locations };
    if (genders?.length) employeeWhere.gender = { in: genders };

    const dateFilter = (field: string) => {
      const filter: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        filter[field] = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        };
      }
      if (clientId) filter.employee = { clientId };
      return filter;
    };

    const appWhere = dateFilter("activityDate");
    const ewaWhere = dateFilter("assessmentDate");
    const npsWhere = dateFilter("responseDate");
    const hraWhere = dateFilter("completedDate");

    // Core queries
    const [
      totalEmployees,
      // OHC / Employee Engagement
      ohcUniqueEmployees,
      totalConsults,
      // App Engagement
      appUniqueEmployees,
      totalAppSessions,
      // Programs: EWA + HRA + NPS
      ewaUniqueEmployees,
      totalEwa,
      hraUniqueEmployees,
      totalHra,
      npsUniqueEmployees,
      totalNps,
    ] = await Promise.all([
      prisma.employee.count({ where: employeeWhere }),
      // OHC unique employees
      prisma.consultation.findMany({
        where: consultWhere,
        select: { employeeId: true },
        distinct: ["employeeId"],
      }),
      prisma.consultation.count({ where: consultWhere }),
      // App unique employees
      prisma.appActivity.findMany({
        where: { ...appWhere, appOpened: true },
        select: { employeeId: true },
        distinct: ["employeeId"],
      }),
      prisma.appActivity.count({ where: { ...appWhere, appOpened: true } }),
      // EWA unique employees
      prisma.emotionalWellbeingAssessment.findMany({
        where: ewaWhere,
        select: { employeeId: true },
        distinct: ["employeeId"],
      }),
      prisma.emotionalWellbeingAssessment.count({ where: ewaWhere }),
      // HRA unique employees
      prisma.hRAResponse.findMany({
        where: hraWhere,
        select: { employeeId: true },
        distinct: ["employeeId"],
      }),
      prisma.hRAResponse.count({ where: hraWhere }),
      // NPS unique employees
      prisma.nPSResponse.findMany({
        where: npsWhere,
        select: { employeeId: true },
        distinct: ["employeeId"],
      }),
      prisma.nPSResponse.count({ where: npsWhere }),
    ]);

    // Unique users per service category
    const ohcUserIds = new Set(ohcUniqueEmployees.map((e) => e.employeeId));
    const ahcUserIds = new Set(hraUniqueEmployees.map((e) => e.employeeId));
    const appUserIds = new Set(appUniqueEmployees.map((e) => e.employeeId));

    // Employee Engagement & Programs = union of EWA + NPS users
    const engagementUserIds = new Set([
      ...ewaUniqueEmployees.map((e) => e.employeeId),
      ...npsUniqueEmployees.map((e) => e.employeeId),
    ]);

    // Active employees = anyone who used at least one service
    const allActiveIds = new Set([
      ...ohcUserIds, ...ahcUserIds, ...appUserIds, ...engagementUserIds,
    ]);
    const activeEmployees = allActiveIds.size;

    // Total services availed
    const totalServicesAvailed = totalConsults + totalHra + totalEwa + totalNps + totalAppSessions;

    // Users with more than one category of service
    const multiCategoryUsers = [...allActiveIds].filter((id) => {
      let categories = 0;
      if (ohcUserIds.has(id)) categories++;
      if (ahcUserIds.has(id)) categories++;
      if (engagementUserIds.has(id)) categories++;
      if (appUserIds.has(id)) categories++;
      return categories > 1;
    }).length;

    const serviceCategories = 4;

    return NextResponse.json({
      kpis: {
        totalEmployees,
        totalServicesAvailed,
        activeEmployees,
        serviceCategories,
        multiCategoryUsers,
      },
      services: [
        {
          key: "ohc",
          name: "OHC",
          description: "Occupational Health Centre consultations including general physician visits, specialist appointments, and on-site clinical care.",
          totalUsers: ohcUserIds.size,
          totalInteractions: totalConsults,
          href: "/portal/ohc/utilization",
        },
        {
          key: "ahc",
          name: "Annual Health Checks",
          description: "Annual Health Check-ups covering health risk assessments, preventive screenings, and personalised wellness recommendations.",
          totalUsers: ahcUserIds.size,
          totalInteractions: totalHra,
          href: "/portal/ahc/utilization",
        },
        {
          key: "employee-engagement",
          name: "Employee Engagement & Programs",
          description: "Emotional wellbeing assessments, NPS feedback surveys, and wellness programs driving employee satisfaction and mental health.",
          totalUsers: engagementUserIds.size,
          totalInteractions: totalEwa + totalNps,
          href: "/portal/employee-experience",
        },
        {
          key: "app-engagement",
          name: "Habit App Engagement",
          description: "Mobile health app usage tracking steps, sleep, meditation, yoga, challenges, and overall digital wellness engagement.",
          totalUsers: appUserIds.size,
          totalInteractions: totalAppSessions,
          href: "/portal/engagement",
        },
      ],
    });
  } catch (error) {
    console.error("Overview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withCache(handler, { endpoint: "overview" });
