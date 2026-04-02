// @ts-nocheck — Will be rewritten to use TS config
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import type { PageMetricConfig, PageConfigResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get("slug");
    const clientId = searchParams.get("clientId") || session.user.clientId;

    if (!slug) {
      return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
    }
    if (!clientId) {
      return NextResponse.json({ error: "clientId parameter required" }, { status: 400 });
    }

    // Check role access to the page
    const pageConfig = await prisma.pageConfig.findUnique({
      where: { slug },
    });

    if (!pageConfig || !pageConfig.isActive) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (!pageConfig.allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all metric placements for this page
    const placements = await prisma.metricPlacement.findMany({
      where: { pageSlug: slug, isActive: true },
      include: { metric: true },
      orderBy: { sortOrder: "asc" },
    });

    // Get client-specific overrides
    const overrides = await prisma.clientMetricOverride.findMany({
      where: { clientId, pageSlug: slug },
    });
    const overrideMap = new Map(
      overrides.map((o) => [o.metricKey, o])
    );

    // Get annotations for this page + client
    const isInternal =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "INTERNAL_OPS" ||
      session.user.role === "KAM";

    const annotations = await prisma.dashboardAnnotation.findMany({
      where: {
        clientId,
        pageSlug: slug,
        ...(isInternal ? {} : { isVisibleToClient: true }),
      },
      include: { author: { select: { name: true } } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    // Build response
    const metrics: PageMetricConfig[] = placements
      .filter((p) => p.metric.isActive)
      .map((p) => {
        const override = overrideMap.get(p.metricKey);
        const metricAnnotations = annotations
          .filter((a) => a.metricKey === p.metricKey)
          .map((a) => ({
            id: a.id,
            metricKey: a.metricKey,
            pageSlug: a.pageSlug,
            commentText: a.commentText,
            commentType: a.commentType,
            authorName: a.author.name,
            isVisibleToClient: a.isVisibleToClient,
            isPinned: a.isPinned,
            filterContext: a.filterContext as Record<string, unknown> | null,
            createdAt: a.createdAt.toISOString(),
          }));

        return {
          key: p.metricKey,
          name: override?.titleOverride || p.metric.name,
          description: p.metric.description,
          chartType: p.metric.chartType,
          section: p.section,
          sortOrder: override?.sortOrderOverride ?? p.sortOrder,
          colSpan: override?.colSpanOverride ?? p.colSpan,
          isHidden: override?.isHidden ?? false,
          unit: p.metric.unit,
          derivedTable: p.metric.derivedTable,
          supportedFilters: p.metric.supportedFilters,
          whyItMatters: p.metric.whyItMatters,
          benchmarkNote: p.metric.benchmarkNote,
          annotations: metricAnnotations,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Page-level annotations (metricKey is null)
    const pageAnnotations = annotations
      .filter((a) => a.metricKey === null)
      .map((a) => ({
        id: a.id,
        metricKey: null,
        pageSlug: a.pageSlug,
        commentText: a.commentText,
        commentType: a.commentType,
        authorName: a.author.name,
        isVisibleToClient: a.isVisibleToClient,
        isPinned: a.isPinned,
        filterContext: a.filterContext as Record<string, unknown> | null,
        createdAt: a.createdAt.toISOString(),
      }));

    const response: PageConfigResponse & { pageAnnotations: typeof pageAnnotations } = {
      page: {
        slug: pageConfig.slug,
        title: pageConfig.title,
        navGroup: pageConfig.navGroup,
      },
      metrics,
      pageAnnotations,
    };

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Page config error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
