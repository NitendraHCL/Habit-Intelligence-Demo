import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/cache/middleware";

async function handler(_req: NextRequest) {
  const kpis = {
    totalEnrollments: { value: 64706, trend: 8, trendLabel: "vs Last Year" },
    activeInCarePlan: { value: 52341, trend: 12, trendLabel: "Last Month" },
    completionRate: { value: 68, trend: 5, trendLabel: "vs Target" },
    overallImprovement: { value: 56, trend: 3, trendLabel: "Last Quarter" },
    avgDuration: { value: 145, trend: -12, trendLabel: "days vs avg" },
  };

  const carePlanDistribution = [
    { plan: "Prime Health", enrolled: 17240 },
    { plan: "Supreme Health", enrolled: 15080 },
    { plan: "Calorie Fit Care", enrolled: 13950 },
    { plan: "Pro Health", enrolled: 11880 },
    { plan: "Others", enrolled: 6556 },
  ];

  const ageGroupDistribution = [
    { name: "41-60 yrs", value: 29.53 },
    { name: "31-40 yrs", value: 24.08 },
    { name: "<30 yrs", value: 22.23 },
    { name: ">60 yrs", value: 13.96 },
    { name: "Not Specified", value: 10.20 },
  ];

  const genderDistribution = [
    { gender: "Male", value: 50.93 },
    { gender: "Female", value: 35.11 },
    { gender: "Not Specified", value: 13.96 },
  ];

  const improvementStatus = [
    { status: "No Improvement", count: 5820 },
    { status: "Improvement", count: 14200 },
    { status: "Eligible for Exit", count: 11650 },
    { status: "Intermediate", count: 9870 },
    { status: "Completed", count: 6340 },
  ];

  const complianceStatus = [
    { name: "Not Compliant", value: 40.29 },
    { name: "Compliant", value: 35.54 },
    { name: "No Record", value: 24.17 },
  ];

  const locationDistribution = [
    { location: "Bangalore", patients: 12450 },
    { location: "Noida 12", patients: 10820 },
    { location: "Hyderabad", patients: 8940 },
    { location: "Noida", patients: 7230 },
    { location: "Lucknow", patients: 5610 },
    { location: "Noida 11", patients: 4370 },
    { location: "Varanasi", patients: 3280 },
    { location: "Chennai", patients: 2641 },
  ];

  const carePlanTrends = [
    { month: "Jan", primeHealth: 3480, supremeHealth: 3100, calorieFit: 2350, proHealth: 2050 },
    { month: "Feb", primeHealth: 3550, supremeHealth: 3200, calorieFit: 2420, proHealth: 1980 },
    { month: "Mar", primeHealth: 3380, supremeHealth: 3150, calorieFit: 2380, proHealth: 1920 },
    { month: "Apr", primeHealth: 3200, supremeHealth: 3050, calorieFit: 2300, proHealth: 1850 },
    { month: "May", primeHealth: 3100, supremeHealth: 2950, calorieFit: 2250, proHealth: 1720 },
  ];

  const improvementVsDuration = [
    { duration: "<3M", improvement: 2850, partial: 1920, noChange: 3150, inconclusive: 1480 },
    { duration: "3-6M", improvement: 3800, partial: 2100, noChange: 2450, inconclusive: 1250 },
    { duration: "6-12M", improvement: 4200, partial: 2350, noChange: 1800, inconclusive: 980 },
    { duration: ">12M", improvement: 3350, partial: 1830, noChange: 2100, inconclusive: 1120 },
  ];

  const complianceTriggerPattern = {
    rows: [
      "0-25 Years, Male",
      "0-25 Years, Female",
      "26-35 Years, Male",
      "26-35 Years, Female",
      "36-45 Years, Male",
      "36-45 Years, Female",
      "46-60 Years, Male",
      "46-60 Years, Female",
      "Above 60, Male",
      "Above 60, Female",
    ],
    columns: ["Noida", "Chennai", "Bangalore", "Hyderabad"],
    data: [
      [85, 82, 75, 65],
      [82, 79, 72, 68],
      [88, 86, 84, 76],
      [84, 81, 78, 72],
      [79, 77, 74, 66],
      [76, 74, 71, 64],
      [68, 65, 58, 52],
      [66, 63, 56, 50],
      [72, 68, 64, 58],
      [69, 65, 61, 55],
    ],
  };

  return NextResponse.json({
    kpis,
    carePlanDistribution,
    ageGroupDistribution,
    genderDistribution,
    improvementStatus,
    complianceStatus,
    locationDistribution,
    carePlanTrends,
    improvementVsDuration,
    complianceTriggerPattern,
  });
}

export const GET = withCache(handler, { endpoint: "lsmp" });
