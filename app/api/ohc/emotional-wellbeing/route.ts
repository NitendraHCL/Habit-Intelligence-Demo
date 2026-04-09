import { NextRequest, NextResponse } from "next/server";
import { getSessionCugCode } from "@/lib/auth/session";
import { getEmotionalWellbeing } from "@/lib/dummy-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const cugCode = await getSessionCugCode(clientId ?? undefined);
  return NextResponse.json(getEmotionalWellbeing(cugCode || "CISCO"));
}
