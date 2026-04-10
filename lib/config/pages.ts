// ── Dashboard Page Definitions ──
// Previously in the page_configs DB table. Now type-safe and version-controlled.

import type { UserRole } from "@/lib/types";

export interface PageConfig {
  slug: string;
  title: string;
  navGroup: string;
  icon: string;
  /** Key on Client model — page is hidden if client[requiredService] is false */
  requiredService?: string;
  allowedRoles: UserRole[];
  sortOrder: number;
}

const ALL_ROLES: UserRole[] = ["SUPER_ADMIN", "INTERNAL_OPS", "KAM", "CLIENT_ADMIN", "CLIENT_VIEWER"];

export const pages: PageConfig[] = [
  // ── OHC ──
  { slug: "ohc-utilization", title: "OHC Utilization Overview", navGroup: "OHC", icon: "Activity", requiredService: "hasOhc", sortOrder: 1, allowedRoles: ALL_ROLES },
  { slug: "ohc-referral", title: "OHC Referral Analysis", navGroup: "OHC", icon: "GitBranch", requiredService: "hasOhc", sortOrder: 2, allowedRoles: ALL_ROLES },
  { slug: "ohc-health-insights", title: "Health Insights", navGroup: "OHC", icon: "Brain", requiredService: "hasOhc", sortOrder: 3, allowedRoles: ALL_ROLES },
  { slug: "ohc-emotional-wellbeing", title: "Emotional Wellbeing", navGroup: "OHC", icon: "Heart", requiredService: "hasOhc", sortOrder: 4, allowedRoles: ALL_ROLES },
  { slug: "ohc-repeat-visits", title: "Repeat Visit Analysis", navGroup: "OHC", icon: "RefreshCw", requiredService: "hasOhc", sortOrder: 5, allowedRoles: ALL_ROLES },
];

export function getPageBySlug(slug: string): PageConfig | undefined {
  return pages.find((p) => p.slug === slug);
}

export function getPagesForNavGroup(group: string): PageConfig[] {
  return pages.filter((p) => p.navGroup === group).sort((a, b) => a.sortOrder - b.sortOrder);
}
