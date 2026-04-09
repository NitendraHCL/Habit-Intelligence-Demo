import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
  }

  // Return a minimal config that allows all metrics to render
  return NextResponse.json({
    page: {
      slug,
      title: slug.replace(/[-/]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      navGroup: slug.split("/")[0] || "portal",
    },
    metrics: [],
    pageAnnotations: [],
  });
}
