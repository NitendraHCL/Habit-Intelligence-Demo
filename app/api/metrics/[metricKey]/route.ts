import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ metricKey: string }> }
) {
  const { metricKey } = await params;

  // Return generic dummy metric data
  return NextResponse.json({
    metricKey,
    chartType: "BAR",
    unit: "count",
    data: [
      { label: "Category A", value: 420 },
      { label: "Category B", value: 310 },
      { label: "Category C", value: 280 },
      { label: "Category D", value: 190 },
    ],
    meta: {
      dateRange: { from: "2024-01-01", to: "2025-03-31" },
      filters: {},
    },
  });
}
