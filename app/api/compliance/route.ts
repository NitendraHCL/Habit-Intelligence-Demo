import { NextRequest, NextResponse } from "next/server";
import { getSessionCugCode } from "@/lib/auth/session";
import { getCompliance } from "@/lib/compliance/aggregate";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const cugCode = await getSessionCugCode(clientId ?? undefined);
  return NextResponse.json(getCompliance(cugCode || "HCLHEALTHCARE"));
}
