"use client";

import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { PageGlanceBox } from "@/components/dashboard/PageGlanceBox";
import {
  Users,
  Activity,
  UserCheck,
  Layers,
  ArrowRight,
  Stethoscope,
  Brain,
  Smartphone,
  UsersRound,
  ClipboardCheck,
  Heart,
  Shield,
  BarChart3,
  Lock,
  Info,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";
import { T as t } from "@/lib/ui/theme";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const cardStyle: React.CSSProperties = {
  borderRadius: t.cardRadius,
  border: `1px solid ${t.border}`,
  boxShadow: t.cardShadow,
  overflow: "hidden",
  background: t.white,
};

/* ─── Empty defaults — real data comes from API ─── */
const fallbackKpis = {
  totalEmployees: 0,
  totalServicesAvailed: 0,
  activeEmployees: 0,
  serviceCategories: 0,
  multiCategoryUsers: 0,
};

const fallbackServices: typeof fallbackKpis extends any ? Array<{ key: string; name: string; description: string; totalUsers: number; totalInteractions: number; href: string }> : never = [];

const serviceIcons: Record<string, React.ElementType> = {
  ohc: Stethoscope,
  ahc: ClipboardCheck,
  "employee-engagement": Heart,
  "app-engagement": Smartphone,
};

const serviceAccents: Record<string, { color: string; bg: string; bar: string }> = {
  ohc: { color: "#4f46e5", bg: "#eef2ff", bar: "#4f46e5" },
  ahc: { color: t.teal, bg: t.tealLight, bar: t.teal },
  "employee-engagement": { color: "#6366f1", bg: "#ede9fe", bar: "#6366f1" },
  "app-engagement": { color: t.coral, bg: t.coralLight, bar: t.coral },
};

const dummyRiskData: Array<{ name: string; value: number; color: string }> = [];

const dummyBenchmarkData: Array<{ name: string; yours: number; industry: number }> = [];

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

interface OverviewData {
  kpis: typeof fallbackKpis;
  services: typeof fallbackServices;
}

/* ════════════════════════════════════════════════════════════════════ */

export default function HomePage() {
  const { data, isLoading } = useDashboardData<OverviewData>("overview");

  if (isLoading) return (
    <div className="animate-fade-in space-y-5">
      <div className="space-y-2"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse" /><div className="h-4 w-96 bg-gray-100 rounded animate-pulse" /></div>
      <div className="grid grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}</div>
    </div>
  );

  const kpis = data?.kpis ?? fallbackKpis;
  const services = data?.services ?? fallbackServices;

  const pctActive =
    kpis.totalEmployees > 0
      ? Math.round((kpis.activeEmployees / kpis.totalEmployees) * 100)
      : 0;

  const pctMulti =
    kpis.activeEmployees > 0
      ? Math.round((kpis.multiCategoryUsers / kpis.activeEmployees) * 100)
      : 0;

  return (
    <TooltipProvider delayDuration={150}>
    <div className="animate-fade-in animate-stagger space-y-6">
      <div data-walkthrough="page-glance">
      <PageGlanceBox
        pageTitle="Habit Services Overview"
        pageSubtitle="Your organisation's health & wellness snapshot"
        kpis={{}}
        fallbackSummary="Your organization's health and wellness services span OHC consultations, Annual Health Check-ups, Employee Engagement programs, and the Habit wellness app. This dashboard provides a high-level summary of utilization, engagement, and outcomes across all service categories."
        fallbackChips={[
          { label: "Services", value: "4 Categories" },
          { label: "Locations", value: "8 Sites" },
          { label: "Platform", value: "Habit Intelligence" },
        ]}
      />
      </div>

      {/* ━━━ Section 1: Program at a Glance (WarmSection) ━━━ */}
      <WarmSection title="Program at a Glance">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left — Key stats card */}
          <div className="md:col-span-4" style={cardStyle}>
            <div style={{ padding: 24 }}>
              <AccentBar color={"#4f46e5"} />
              <div className="flex items-center gap-2">
                <h3 style={panelTitleStyle}>Employee Engagement</h3>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <span style={{ cursor: "pointer", color: t.textMuted, display: "inline-flex" }}>
                      <Info size={14} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[360px] text-[12px] leading-relaxed p-3.5">
                    <p className="mb-2">
                      <strong>Employee Engagement</strong> measures how many of your organisation&apos;s <strong>{fmt(kpis.totalEmployees)}</strong> registered employees are actively using at least one wellness service — OHC consultations, Annual Health Check-ups, Employee Engagement programs, or the Habit App — during the selected period.
                    </p>
                    <p>
                      Currently <strong>{fmt(kpis.activeEmployees)}</strong> employees ({pctActive}%) are engaged, and <strong>{fmt(kpis.multiCategoryUsers)}</strong> of them ({pctMulti}% of active) use more than one service category. Higher engagement typically correlates with better health outcomes, stronger program ROI, and lower cost of care.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </div>

              <div className="flex gap-8 mt-5">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span style={{ ...bigValueStyle, color: t.teal }}>
                      {fmt(kpis.activeEmployees)}
                    </span>
                    <span style={denominatorStyle}>
                      /{fmt(kpis.totalEmployees)}
                    </span>
                  </div>
                  <p style={subLabelStyle}>
                    employees actively
                    <br />
                    using services
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span style={{ ...bigValueStyle, color: t.coral }}>
                      {fmt(kpis.multiCategoryUsers)}
                    </span>
                    <span style={denominatorStyle}>
                      /{fmt(kpis.activeEmployees)}
                    </span>
                  </div>
                  <p style={subLabelStyle}>
                    use more than one
                    <br />
                    service category
                  </p>
                </div>
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  marginTop: 16,
                  fontStyle: "italic",
                }}
              >
                {fmt(kpis.totalEmployees)} = total registered employees in
                selected period
              </p>
            </div>
          </div>

          {/* Center — AI Summary card (blue) */}
          <div
            className="md:col-span-5"
            style={{
              borderRadius: t.cardRadius,
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)",
              padding: "24px 28px",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
              Your organisation&apos;s <strong>{fmt(kpis.totalEmployees)}</strong> employees
              have access to <strong>{kpis.serviceCategories}</strong> wellness services
              {" "}&mdash; <strong>{services.map((s) => s.name).join(", ")}</strong>.
              Together, they&apos;ve availed <strong>{fmt(kpis.totalServicesAvailed)}</strong> services
              &mdash; from consultations and health check-ups to app challenges and program enrolments. <strong>{pctActive}%</strong> ({fmt(kpis.activeEmployees)} employees) are
              actively engaged, and <strong>{pctMulti}%</strong> ({fmt(kpis.multiCategoryUsers)}) use
              more than one service.
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {services.map((svc) => (
                <Chip key={svc.key} label={svc.name} color="#fff" />
              ))}
            </div>
          </div>

          {/* Right — Multi-service highlight */}
          <div className="md:col-span-3" style={cardStyle}>
            <div style={{ padding: 24 }}>
              <AccentBar color={t.coral} />
              <div className="flex items-center gap-2">
                <h3 style={panelTitleStyle}>Cross-service Adoption</h3>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <span style={{ cursor: "pointer", color: t.textMuted, display: "inline-flex" }}>
                      <Info size={14} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[360px] text-[12px] leading-relaxed p-3.5">
                    <p className="mb-2">
                      <strong>Cross-service Adoption</strong> tracks how many of your active employees reach beyond a single wellness touchpoint and engage with multiple service categories — such as visiting the OHC, completing an Annual Health Check, and using the Habit App in the same period.
                    </p>
                    <p>
                      <strong>{fmt(kpis.multiCategoryUsers)}</strong> out of <strong>{fmt(kpis.activeEmployees)}</strong> active employees ({pctMulti}%) currently use 2 or more services. A rising share signals that employees are weaving wellness into everyday habits, which tends to improve preventive-care outcomes and drive higher long-term program retention.
                    </p>
                  </TooltipContent>
                </UiTooltip>
              </div>

              <p
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  color: "#6366f1",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  marginTop: 16,
                }}
              >
                {pctMulti}%
              </p>
              <p style={{ ...subLabelStyle, marginTop: 6 }}>
                of your employees use
                <br />
                2+ wellness services
              </p>

              {/* mini visual bar */}
              <div
                style={{
                  marginTop: 16,
                  height: 6,
                  borderRadius: 3,
                  background: "#6366f115",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(pctMulti, 100)}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: "#6366f1",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </WarmSection>

      {/* ━━━ Section 2: Executive Summary (Stat Cards) ━━━ */}
      <div data-walkthrough="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Registered Employees"
          value={fmt(kpis.totalEmployees)}
          color={"#4f46e5"}
          sub={`${kpis.serviceCategories} service categories`}
          tooltip={<>Total employees on record in the selected period with access to any wellness service. Baseline denominator for engagement and adoption rates.</>}
        />
        <StatCard
          label="Services Availed"
          value={fmt(kpis.totalServicesAvailed)}
          color={"#6366f1"}
          sub="Consultations, check-ups, enrolments, etc."
          tooltip={<>Sum of every service interaction across OHC consultations, Annual Health Checks, Employee Engagement programs, and Habit App sessions.</>}
        />
        <StatCard
          label="Active Employees"
          value={fmt(kpis.activeEmployees)}
          color={t.teal}
          sub={`${pctActive}% of registered`}
          badge={{ label: `${pctActive}% active`, color: t.teal }}
          tooltip={<>Employees who used at least one wellness service in the selected period. <strong>{pctActive}%</strong> of <strong>{fmt(kpis.totalEmployees)}</strong> registered employees.</>}
        />
        <StatCard
          label="Service Categories"
          value={String(kpis.serviceCategories)}
          color={"#4f46e5"}
          sub="OHC, Annual Health Checks, Engagement, App"
          tooltip={<>Number of wellness service categories available to your organisation: OHC, Annual Health Checks, Employee Engagement &amp; Programs, and Habit App Engagement.</>}
        />
        <StatCard
          label="Multi-Service Users"
          value={fmt(kpis.multiCategoryUsers)}
          color={t.amber}
          sub={`${pctMulti}% of active employees`}
          badge={
            pctMulti > 20
              ? { label: "Strong adoption", color: t.teal }
              : undefined
          }
          tooltip={<>Active employees who used 2 or more service categories — e.g. OHC + Annual Health Check + Habit App. <strong>{pctMulti}%</strong> of active employees.</>}
        />
      </div>

      {/* ━━━ Section 3: Our Services ━━━ */}
      <div data-walkthrough="service-cards">
        <SectionHeader
          barColor={"#6366f1"}
          title="Our Services"
          subtitle="Explore each service category and its adoption across your organisation"
        />

        <WarmSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map((svc) => {
              const Icon = serviceIcons[svc.key] ?? Activity;
              const accent = serviceAccents[svc.key] ?? {
                color: "#4f46e5",
                bg: "#eef2ff",
                bar: "#4f46e5",
              };
              const isComingSoon = svc.key === "employee-engagement" || svc.key === "app-engagement";

              return (
                <div key={svc.key} style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
                  {isComingSoon && (
                    <>
                      <div
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(135deg, rgba(79,70,229,0.04) 0%, rgba(109,40,217,0.06) 100%)",
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 14,
                          right: 14,
                          zIndex: 3,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 11px 5px 9px",
                          borderRadius: 999,
                          background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)",
                          color: "#fff",
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          boxShadow: "0 6px 18px -4px rgba(79,70,229,0.45), 0 2px 6px rgba(109,40,217,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
                          border: "1px solid rgba(255,255,255,0.35)",
                        }}
                      >
                        <Lock size={10} strokeWidth={2.5} style={{ color: "#fde68a" }} />
                        <span>Coming Soon</span>
                      </div>
                    </>
                  )}
                  <div style={{ opacity: isComingSoon ? 0.55 : 1, position: "relative", zIndex: 2 }}>
                  <div style={{ padding: 24 }}>
                    <AccentBar color={accent.bar} />

                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mt-1 mb-3">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: accent.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} color={accent.color} />
                      </div>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: t.textPrimary,
                          margin: 0,
                        }}
                      >
                        {svc.name}
                      </h3>
                    </div>

                    <p
                      style={{
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: t.textSecondary,
                        margin: "0 0 20px",
                        minHeight: 56,
                      }}
                    >
                      {svc.description}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-6 mb-4">
                      <div>
                        <p style={statLabelStyle}>Total Users</p>
                        <p style={{ ...statValueStyle, color: accent.color }}>
                          {fmt(svc.totalUsers)}
                        </p>
                      </div>
                      <div
                        style={{
                          width: 1,
                          alignSelf: "stretch",
                          background: t.border,
                        }}
                      />
                      <div>
                        <p style={statLabelStyle}>Services Availed</p>
                        <p style={{ ...statValueStyle, color: t.textPrimary }}>
                          {fmt(svc.totalInteractions)}
                        </p>
                      </div>
                    </div>

                    {/* View Details */}
                    <Link
                      href={svc.href}
                      className="group"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: accent.color,
                        textDecoration: "none",
                      }}
                    >
                      View Details
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </WarmSection>
      </div>

      {/* ━━━ Coming Soon: Risk Stratification & Corporate Benchmarking ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ComingSoonCard
          icon={Shield}
          iconColor="#dc2626"
          iconBg="#fef2f2"
          title="Risk Stratification"
          description="Identify and categorise employees by health risk levels — low, moderate, and high — based on vitals, diagnoses, lifestyle factors, and HRA scores. Enables targeted interventions and proactive care for at-risk populations."
        >
          <div className="flex items-center gap-6 mt-4">
            <div style={{ width: 120, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dummyRiskData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={2}>
                    {dummyRiskData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {dummyRiskData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: t.textSecondary }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary, marginLeft: "auto" }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ComingSoonCard>
        <ComingSoonCard
          icon={BarChart3}
          iconColor="#7c3aed"
          iconBg="#f5f3ff"
          title="Corporate Benchmarking"
          description="Compare your organisation's health metrics, utilisation rates, and wellness outcomes against industry benchmarks and peer companies. Understand where you stand and identify areas for improvement."
        >
          <div style={{ width: "100%", height: 130, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dummyBenchmarkData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: t.textMuted }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="yours" fill="#4f46e5" radius={[3, 3, 0, 0]} barSize={14} name="Your Org" />
                <Bar dataKey="industry" fill="#c7d2fe" radius={[3, 3, 0, 0]} barSize={14} name="Industry Avg" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#4f46e5" }} />
                <span style={{ fontSize: 10, color: t.textMuted }}>Your Org</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#c7d2fe" }} />
                <span style={{ fontSize: 10, color: t.textMuted }}>Industry Avg</span>
              </div>
            </div>
          </div>
        </ComingSoonCard>
      </div>

      {/* ━━━ Section 4: Insight Box ━━━ */}
      <div
        style={{
          backgroundColor: "#eef2ff",
          borderRadius: 10,
          border: "1px solid #c7d2fe",
          padding: "12px 16px",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#3730a3",
        }}
      >
        {fmt(kpis.multiCategoryUsers)} employees are engaged across multiple
        service categories. Cross-service users show higher retention and
        wellbeing outcomes. Consider targeted campaigns for the{" "}
        {fmt(kpis.totalEmployees - kpis.activeEmployees)} inactive employees to
        improve overall participation.
      </div>
    </div>
    </TooltipProvider>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Sub-components (co-located, page-specific)
   ════════════════════════════════════════════════════════════════════ */

/* ─── WarmSection ─── */
function WarmSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: t.warmBg,
        padding: "20px 24px",
      }}
    >
      {title && (
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: t.textPrimary,
            letterSpacing: "-0.01em",
            margin: "0 0 16px",
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

/* ─── SectionHeader ─── */
function SectionHeader({
  barColor,
  title,
  subtitle,
}: {
  barColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: barColor,
          marginBottom: 14,
        }}
      />
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: t.textPrimary,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 13, color: t.textSecondary, marginTop: 3 }}>
        {subtitle}
      </p>
    </div>
  );
}

/* ─── AccentBar (above card titles) ─── */
function AccentBar({ color = "#4f46e5", colorEnd }: { color?: string; colorEnd?: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 4,
        borderRadius: 2,
        background: `linear-gradient(90deg, ${color}, ${colorEnd || color})`,
        marginBottom: 14,
      }}
    />
  );
}

/* ─── Chip ─── */
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color,
        backgroundColor: `${color}20`,
        padding: "3px 10px",
        borderRadius: 6,
        height: 22,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {label}
    </span>
  );
}

/* ─── StatCard (Executive Summary style) ─── */
function StatCard({
  label,
  value,
  color,
  sub,
  badge,
  tooltip,
}: {
  label: string;
  value: string;
  color: string;
  sub: string;
  badge?: { label: string; color: string };
  tooltip?: React.ReactNode;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ padding: "18px 20px 16px" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: t.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            {label}
          </p>
          {tooltip && (
            <UiTooltip>
              <TooltipTrigger asChild>
                <span style={{ cursor: "pointer", color: t.textMuted, display: "inline-flex" }}>
                  <Info size={13} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] text-[12px] leading-snug">
                {tooltip}
              </TooltipContent>
            </UiTooltip>
          )}
        </div>
        <p
          style={{
            fontSize: 36,
            fontWeight: 800,
            color,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {value}
        </p>
        <p
          style={{
            fontSize: 12,
            color: t.textSecondary,
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          {sub}
        </p>
        {badge && (
          <span
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 10.5,
              fontWeight: 700,
              color: badge.color,
              backgroundColor: `${badge.color}15`,
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            {badge.label}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── ComingSoonCard ─── */
function ComingSoonCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(79,70,229,0.04) 0%, rgba(109,40,217,0.06) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 3,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 11px 5px 9px",
          borderRadius: 999,
          background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)",
          color: "#fff",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          boxShadow: "0 6px 18px -4px rgba(79,70,229,0.45), 0 2px 6px rgba(109,40,217,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.35)",
        }}
      >
        <Lock size={10} strokeWidth={2.5} style={{ color: "#fde68a" }} />
        <span>Coming Soon</span>
      </div>
      <div style={{ opacity: 0.55, position: "relative", zIndex: 2 }}>
        <div style={{ padding: 24 }}>
          <AccentBar color={iconColor} />

          {/* Icon + Title */}
          <div className="flex items-center gap-3 mt-1 mb-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={iconColor} />
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: t.textPrimary,
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>

          <p
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: t.textSecondary,
              margin: 0,
            }}
          >
            {description}
          </p>

          {children && <div>{children}</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared inline styles ─── */
const panelTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: t.textPrimary,
  margin: 0,
};

const bigValueStyle: React.CSSProperties = {
  fontSize: 38,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

const denominatorStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: t.textMuted,
};

const subLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: t.textSecondary,
  lineHeight: 1.5,
  marginTop: 4,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: t.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  margin: "0 0 4px",
};

const statValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "-0.02em",
  margin: 0,
};
