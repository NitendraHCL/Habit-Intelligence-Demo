import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { question } = await request.json();

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  return NextResponse.json({
    answer: "This is a demo environment with hardcoded data for **CISCO** and **HCL Tech** CUGs. AI responses are not available in demo mode. The data shown represents sample analytics across OHC utilization, health insights, engagement, and employee experience modules.",
  });
}
