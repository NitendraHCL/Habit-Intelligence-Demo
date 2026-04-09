import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId parameter required" }, { status: 400 });
  }

  return NextResponse.json({
    draftConfig: null,
    publishedConfig: null,
    configPublishedAt: null,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ draftConfig: body.config || null });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    publishedConfig: null,
    configPublishedAt: new Date().toISOString(),
  });
}
