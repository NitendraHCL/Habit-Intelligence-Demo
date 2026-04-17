import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { pageTitle } = await request.json();

  if (!pageTitle) {
    return NextResponse.json({ error: "pageTitle is required" }, { status: 400 });
  }

  return NextResponse.json({
    summary: `Demo summary for ${pageTitle}. This page displays analytics data for the selected CUG (HCL Healthcare or Demo Client). All data shown is hardcoded for demonstration purposes.`,
    chips: [
      { label: "Mode", value: "Demo" },
      { label: "CUGs", value: "2" },
    ],
  });
}
