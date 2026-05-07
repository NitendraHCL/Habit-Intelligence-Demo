import { NextRequest, NextResponse } from "next/server";
import { getSessionCugCode } from "@/lib/auth/session";

const CUG_FRIENDLY: Record<string, string> = {
  HCLHEALTHCARE: "HCL Healthcare",
  DUMMY01: "Demo Client",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const pageTitle = body?.pageTitle as string | undefined;
  const clientId = body?.clientId as string | undefined;

  if (!pageTitle) {
    return NextResponse.json({ error: "pageTitle is required" }, { status: 400 });
  }

  const cug = (await getSessionCugCode(clientId)) || "HCLHEALTHCARE";
  const cugName = CUG_FRIENDLY[cug] || cug;

  return NextResponse.json({
    summary: `${pageTitle} for ${cugName} — at-a-glance view of the latest analytics across the workforce. Use the filters above to narrow by clinic, specialty, or cohort, and dive into individual cards for drill-down detail.`,
    chips: [
      { label: "Client", value: cugName },
    ],
  });
}
