"use client";

import { useState } from "react";
import {
  Info,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  Lightbulb,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Stethoscope,
  Heart,
  Smartphone,
  Activity,
  Users,
  ClipboardCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { T } from "@/lib/ui/theme";
import { ResetFilter } from "@/components/ui/reset-filter";
import { PageGlanceBox } from "@/components/dashboard/PageGlanceBox";
import { AskAIButton } from "@/components/ai/AskAIButton";

function formatNum(n: number): string {
  if (!n && n !== 0) return "0";
  if (n >= 100000) return `${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return n.toLocaleString("en-IN");
  return String(n);
}

// ─── Accent Bar ───
function AccentBar({ color = "#4f46e5", colorEnd }: { color?: string; colorEnd?: string }) {
  return <div className="w-10 h-1 rounded-sm mb-3.5" style={{ background: `linear-gradient(90deg, ${color}, ${colorEnd || color})` }} />;
}

// ─── Card ───
function CVCard({
  children, className = "", accentColor, title, subtitle, tooltipText, expandable = true,
  chartData, chartTitle, chartDescription,
}: {
  children: React.ReactNode; className?: string; accentColor?: string;
  title?: string; subtitle?: string; tooltipText?: string; expandable?: boolean;
  chartData?: unknown; chartTitle?: string; chartDescription?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden transition-all ${expanded ? "col-span-full" : ""} ${className}`}
      style={{ border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
    >
      {(title || accentColor) && (
        <div className="px-6 pt-5 pb-1">
          {accentColor && <AccentBar color={accentColor} />}
          {title && (
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[15px] font-bold font-[var(--font-inter)]" style={{ color: T.textPrimary }}>{title}</h3>
                  {tooltipText && (
                    <Tooltip>
                      <TooltipTrigger><Info size={13} style={{ color: T.textMuted }} /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">{tooltipText}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {subtitle && <p className="text-[13px] mt-0.5" style={{ color: T.textSecondary }}>{subtitle}</p>}
              </div>
              {!!chartData && <AskAIButton title={chartTitle || title || ""} description={chartDescription} data={chartData} />}
              {expandable && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-2" style={{ color: T.textMuted }} onClick={() => setExpanded(!expanded)}>
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="px-6 pb-5">{children}</div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, color, sub, icon: Icon }: {
  label: string; value: string | number; color: string; sub?: string;
  icon?: React.ElementType;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-5 py-4 flex flex-col gap-1"
      style={{ border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: T.textMuted }}>{label}</p>
        {Icon && (
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
            <Icon size={14} style={{ color }} />
          </div>
        )}
      </div>
      <p className="text-[38px] font-extrabold leading-none tracking-[-0.02em] font-[var(--font-inter)]" style={{ color }}>{value}</p>
      {sub && <p className="text-[12px] leading-relaxed" style={{ color: T.textSecondary }}>{sub}</p>}
    </div>
  );
}

// ─── Warm Section ───
function WarmSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} style={{ backgroundColor: T.warmBg, borderRadius: 24 }}>
      {children}
    </div>
  );
}

// ─── AI Insight Panel ───
function AIInsightPanel({ title, insights, defaultExpanded = true }: {
  title: string;
  insights: { type: "observation" | "recommendation" | "warning"; text: string; priority?: "high" | "medium" | "low" }[];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const typeConfig = {
    observation: { icon: TrendingUp, color: "#4f46e5", bg: "#EFF6FF", label: "Observation" },
    recommendation: { icon: Lightbulb, color: T.amber, bg: "#FFF8ED", label: "Recommendation" },
    warning: { icon: AlertTriangle, color: T.coral, bg: "#FEF2F2", label: "Warning" },
  };

  const priorityColors = {
    high: { bg: "#F5EDE8", text: "#6B4C3B", border: "#D4A574" },
    medium: { bg: "#FDF6EE", text: "#A67C52", border: "#D4A574" },
    low: { bg: "#E8F5EE", text: "#2D8C5A", border: "#4CAF7D" },
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid #FDE68A`, background: "linear-gradient(to right, #FFF8ED, #FFFFF0, #FFF7ED)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-100/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} style={{ color: T.amber }} />
          <span className="text-[13px] font-bold" style={{ color: "#92400E" }}>{title}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FDE68A", color: "#92400E" }}>
            {insights.length} insight{insights.length !== 1 ? "s" : ""}
          </span>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: T.amber }} /> : <ChevronDown size={14} style={{ color: T.amber }} />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-2.5">
          {insights.map((insight, i) => {
            const config = typeConfig[insight.type];
            const Icon = config.icon;
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: config.bg }}>
                <Icon size={14} className="mt-0.5 shrink-0" style={{ color: config.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold" style={{ color: config.color }}>{config.label}</span>
                    {insight.priority && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: priorityColors[insight.priority].bg,
                          color: priorityColors[insight.priority].text,
                          borderColor: priorityColors[insight.priority].border,
                        }}
                      >
                        {insight.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: T.textPrimary }}>{insight.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DATA — All numbers derived from actual dashboard data sources:

   Overview page:  12,450 registered | 8,942 active | 2,840 multi-service
   Engagement:     12,500 eligible | 9,800 installed | 7,350 logged in | 4,200 active
   Health Insights: Respiratory 31.5% (24,854 visits) | Cardiovascular 26.2% (20,624 visits)
   NPS:            Dermatology 65 | Cardiology 68 | range 65–82
   Repeat Visits:  2,850 patients | 68% LSMP enrolled | 1,200 frequent (5+)
   AHC:            3,800 users of 12,450 registered (30.5% participation)
   Steps:          7,850 avg/day | 78.2% above 5K | 24.8% above 10K
   Webinars:       48 total | 1,480 attendees | 20.1% rate | 4.3 rating
   ═══════════════════════════════════════════════════════════════════ */

const actionItems = [
  {
    id: 1,
    priority: "Critical" as const,
    title: "Annual Health Check (AHC) Participation Gap — 69.5% Employees Not Covered",
    description: "Only 3,800 of 12,450 registered employees have completed their Annual Health Check (30.5% participation). 8,650 employees remain uncovered, missing preventive screening opportunities.",
    source: "Overview + Annual Health Checks",
    action: "Launch Annual Health Check drives",
    status: "pending" as const,
    category: "Clinical",
    icon: ClipboardCheck,
    iconColor: T.coral,
    metric: "8,650 employees uncovered",
    timeline: "Immediate",
    dataRef: "Overview: 12,450 registered | Annual Health Checks: 3,800 users",
  },
  {
    id: 2,
    priority: "Critical" as const,
    title: "Cardiovascular Conditions — 26.2% of All OHC Visits",
    description: "20,624 cardiovascular visits from 12,910 unique patients make this the second-highest disease category. Average 1.6 visits per patient indicates ongoing management needs across the workforce.",
    source: "Health Insights",
    action: "Review CV protocols",
    status: "pending" as const,
    category: "Clinical",
    icon: Stethoscope,
    iconColor: T.coral,
    metric: "12,910 unique patients",
    timeline: "This Quarter",
    dataRef: "Health Insights: 20,624 visits, 12,910 patients (2024)",
  },
  {
    id: 3,
    priority: "High" as const,
    title: "Repeat-Visit Patients Not Enrolled in LSMP",
    description: "32% of 2,850 repeat-visit patients (employees who availed any OHC service at least twice in the selected date range) — ~912 patients — are not enrolled in any LSMP care plan despite qualifying. Enrolling them could reduce visit frequency and improve outcomes.",
    source: "Repeat Visits + LSMP",
    action: "Initiate enrollment",
    status: "pending" as const,
    category: "Clinical",
    icon: Heart,
    iconColor: T.green,
    metric: "~912 patients eligible",
    timeline: "This Quarter",
    dataRef: "Repeat Visits: 2,850 patients, 68% LSMP enrolled → 32% gap",
  },
  {
    id: 4,
    priority: "High" as const,
    title: "App Engagement Funnel Drop-off — Install to Active",
    description: "Of 9,800 employees who installed the app, only 4,200 are monthly active users (42.9%). The biggest drop is between logged-in (7,350) and active (4,200) — 3,150 users disengaging after login.",
    source: "App Engagement",
    action: "Re-engage inactive users",
    status: "in_progress" as const,
    category: "Engagement",
    icon: Smartphone,
    iconColor: T.amber,
    metric: "3,150 users inactive post-login",
    timeline: "This Quarter",
    dataRef: "Engagement: 9,800 installed → 7,350 logged in → 4,200 active",
  },
  {
    id: 5,
    priority: "High" as const,
    title: "NPS Improvement Needed — Dermatology & Cardiology",
    description: "Dermatology (NPS 65, 60 responses) and Cardiology (NPS 68, 80 responses) are the two lowest-scoring specialties. The overall NPS range across specialties is 65–80, and these two pull down the average.",
    source: "NPS",
    action: "Service quality review",
    status: "pending" as const,
    category: "Experience",
    icon: Activity,
    iconColor: "#6366f1",
    metric: "NPS 65 & 68 (lowest)",
    timeline: "This Quarter",
    dataRef: "NPS: Dermatology 65 (60 resp), Cardiology 68 (80 resp)",
  },
  {
    id: 6,
    priority: "High" as const,
    title: "3,508 Registered Employees Not Using Any Service",
    description: "Of 12,450 registered employees, 3,508 (28%) have not engaged with any service category — OHC, Annual Health Checks, engagement programs, or the app. These employees are entirely unreached by the wellness program.",
    source: "Overview",
    action: "Targeted outreach",
    status: "pending" as const,
    category: "Engagement",
    icon: Users,
    iconColor: T.amber,
    metric: "28% completely inactive",
    timeline: "This Quarter",
    dataRef: "Overview: 12,450 registered − 8,942 active = 3,508 inactive",
  },
  {
    id: 7,
    priority: "Medium" as const,
    title: "Cross-Service Adoption Below Potential",
    description: "Only 2,840 of 8,942 active employees (32%) use more than one service category. 6,102 active employees are engaged with only a single service, missing the benefits of integrated health management.",
    source: "Overview",
    action: "Cross-promote services",
    status: "in_progress" as const,
    category: "Engagement",
    icon: Users,
    iconColor: "#6366f1",
    metric: "32% multi-service adoption",
    timeline: "Ongoing",
    dataRef: "Overview: 2,840 multi-service of 8,942 active (32%)",
  },
  {
    id: 8,
    priority: "Medium" as const,
    title: "Low Webinar Attendance Rate",
    description: "Across 48 webinars conducted, the average attendance rate is only 20.1% (1,480 attendees from 7,350 logged-in users). Content relevance and scheduling optimization could improve participation.",
    source: "App Engagement",
    action: "Optimize webinar strategy",
    status: "pending" as const,
    category: "Engagement",
    icon: Smartphone,
    iconColor: T.amber,
    metric: "20.1% attendance rate",
    timeline: "Next Quarter",
    dataRef: "Engagement: 48 webinars, 1,480 attendees, 4.3 avg rating",
  },
];

const recommendations = [
  {
    category: "Prevention",
    title: "Respiratory Condition Prevention Program",
    insight: "Respiratory diseases account for 31.5% of all OHC visits (24,854 visits from 18,792 patients) — the single largest disease category. Preventive interventions could meaningfully reduce visit volume.",
    impact: "Largest disease category — 24,854 visits annually",
    dataRef: "Health Insights: Respiratory 31.5%, 18,792 unique patients",
  },
  {
    category: "Engagement",
    title: "Step Challenge Expansion to 10K Target",
    insight: "78.2% of app users cross 5,000 steps daily, but only 24.8% reach 10,000 steps. Targeted challenges for the 53.4% in between could push more employees toward the recommended activity level.",
    impact: "53.4% of users between 5K–10K steps — targetable cohort",
    dataRef: "Engagement: 78.2% above 5K, 24.8% above 10K, avg 7,850 steps/day",
  },
  {
    category: "Clinical",
    title: "Frequent Repeater Intervention (5+ Visits)",
    insight: "1,200 patients visit OHC 5 or more times. These frequent repeaters, with an average frequency of 3.4x across all repeat patients, may benefit from dedicated care coordination to address root causes.",
    impact: "1,200 frequent repeaters — high resource utilization",
    dataRef: "Repeat Visits: 1,200 patients with 5+ visits, avg 3.4x frequency",
  },
];

const alerts = [
  {
    type: "warning" as const,
    message: "Dermatology NPS at 65 — lowest across all 8 tracked specialties",
    time: "NPS Data",
  },
  {
    type: "warning" as const,
    message: "Only 24.8% of app users crossing 10,000 daily steps target",
    time: "Engagement Data",
  },
  {
    type: "info" as const,
    message: "Endocrine & Metabolic conditions at 4,494 visits (5.7%) — 1,726 unique patients to monitor",
    time: "Health Insights",
  },
];

const aiInsights = [
  {
    type: "observation" as const,
    text: "Cardiovascular (26.2%) and Respiratory (31.5%) conditions together account for 57.7% of all OHC visits — 45,478 visits from 31,702 unique patients. Preventive programs in these two areas alone could significantly reduce clinical load.",
    priority: "high" as const,
  },
  {
    type: "recommendation" as const,
    text: "912 repeat-visit patients (employees who availed any OHC service at least twice in the selected date range) are not enrolled in LSMP despite qualifying. Enrolling them into appropriate care plans (Prime Health, Supreme Health, Calorie Fit, Pro Health) could reduce their visit frequency from the current 3.4x average.",
    priority: "high" as const,
  },
  {
    type: "warning" as const,
    text: "App engagement funnel shows a 57.1% cumulative drop from install (9,800) to active usage (4,200). The steepest single drop is 42.9% between logged-in and active — indicating users try the app but don't sustain engagement.",
    priority: "high" as const,
  },
  {
    type: "observation" as const,
    text: "Cross-service adoption at 32% (2,840 of 8,942 active employees) suggests most employees are siloed into a single service. Employees using 2+ services may see compounded wellness benefits — consider integrated onboarding flows.",
  },
];

const priorityStyles = {
  Critical: { bg: "#F5EDE8", text: "#6B4C3B", border: "#6B4C3B30" },
  High: { bg: "#FDF6EE", text: "#A67C52", border: "#D4A57430" },
  Medium: { bg: "#E8F5EE", text: "#2D8C5A", border: "#2D8C5A30" },
};

const statusConfig = {
  pending: { icon: Circle, label: "Pending", color: "#6B4C3B", bg: "#F5EDE8" },
  in_progress: { icon: ArrowRight, label: "In Progress", color: "#6366f1", bg: "#6366f112" },
  completed: { icon: CheckCircle2, label: "Completed", color: "#2D8C5A", bg: "#E8F5EE" },
};

const categoryColors: Record<string, string> = {
  Prevention: "#6B4C3B",
  Engagement: "#2D8C5A",
  Clinical: "#D4A574",
};

// ─── Counts (derived from actual action items list) ───
const criticalCount = actionItems.filter((i) => i.priority === "Critical").length;
const highCount = actionItems.filter((i) => i.priority === "High").length;
const mediumCount = actionItems.filter((i) => i.priority === "Medium").length;
const pendingCount = actionItems.filter((i) => i.status === "pending").length;
const inProgressCount = actionItems.filter((i) => i.status === "in_progress").length;

// ─── Main Page ───
export default function ActionPlanPage() {
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const filteredItems = filterPriority === "all"
    ? actionItems
    : actionItems.filter((i) => i.priority === filterPriority);

  return (
    <div className="animate-fade-in animate-stagger space-y-6">
      <PageGlanceBox
        pageTitle="Action Plan"
        pageSubtitle="Data-driven interventions derived from dashboard insights across all services"
        kpis={{}}
        fallbackSummary="Action items are derived from data across all dashboard pages — OHC Health Insights, App Engagement, NPS scores, Repeat Visits, LSMP enrollment, and Annual Health Check (AHC) participation. Every recommendation below is backed by specific metrics visible in the corresponding dashboard section."
        fallbackChips={[
          { label: "Action Items", value: String(actionItems.length) },
          { label: "Critical", value: String(criticalCount) },
          { label: "High", value: String(highCount) },
          { label: "Medium", value: String(mediumCount) },
        ]}
      />

      {/* ── Executive Summary ── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "linear-gradient(135deg, #FFF8ED 0%, #FFFFF0 50%, #FFF7ED 100%)", border: "1px solid #FDE68A" }}
      >
        <div className="flex items-start gap-3">
          <Sparkles size={18} style={{ color: T.amber }} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-[16px] font-bold font-[var(--font-inter)]" style={{ color: "#92400E" }}>
              Action Items Summary
            </h3>
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: "#78350F" }}>
              You have <strong>{actionItems.length} action items</strong> across all services — {criticalCount} critical, {highCount} high priority, and {mediumCount} medium.
              Key gaps identified: <strong>69.5% of employees</strong> haven&apos;t completed their Annual Health Check, <strong>3,150 app users</strong> are inactive post-login,
              and <strong>57.7% of all OHC visits</strong> are concentrated in just two disease categories (Cardiovascular + Respiratory).
              All items below link directly to data visible on the respective dashboard pages.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ backgroundColor: "#FEF2F2", color: "#991B1B", borderColor: "#FECACA" }}>
                Critical: {criticalCount}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ backgroundColor: "#FFF8ED", color: "#92400E", borderColor: "#FDE68A" }}>
                High: {highCount}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ backgroundColor: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" }}>
                Medium: {mediumCount}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border" style={{ backgroundColor: "#EFF6FF", color: "#1E40AF", borderColor: "#BFDBFE" }}>
                Pending: {pendingCount} | In Progress: {inProgressCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Critical" value={criticalCount} color={T.coral} sub="Annual Health Check gap & cardiovascular volume" icon={AlertTriangle} />
        <StatCard label="High Priority" value={highCount} color={T.amber} sub="Engagement, NPS & LSMP gaps" icon={Clock} />
        <StatCard label="In Progress" value={inProgressCount} color={"#4f46e5"} sub="Currently being addressed" icon={ArrowRight} />
        <StatCard label="Pending" value={pendingCount} color={"#6B4C3B"} sub="Awaiting initiation" icon={Circle} />
      </div>

      {/* ── AI Insights ── */}
      <AIInsightPanel
        title="AI Insights — Derived from Dashboard Data"
        insights={aiInsights}
      />

      {/* ── Data Alerts ── */}
      <CVCard
        accentColor={T.coral}
        title="Data Alerts"
        subtitle="Metrics from dashboard pages that need attention"
        expandable={false}
        chartData={alerts}
        chartTitle="Data Alerts"
        chartDescription="Metrics from dashboard pages that need attention"
      >
        <div className="space-y-2.5 mt-2">
          {alerts.map((alert, i) => {
            const alertColor = alert.type === "warning" ? T.amber : "#4f46e5";
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ backgroundColor: alertColor + "08", borderLeft: `3px solid ${alertColor}` }}
              >
                <Bell size={14} style={{ color: alertColor }} className="shrink-0" />
                <p className="flex-1 text-[13px]" style={{ color: T.textPrimary }}>{alert.message}</p>
                <span className="text-[11px] shrink-0 font-medium px-2 py-0.5 rounded-full" style={{ color: T.textMuted, backgroundColor: T.textMuted + "10" }}>{alert.time}</span>
              </div>
            );
          })}
        </div>
      </CVCard>

      {/* ── Action Items ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-bold font-[var(--font-inter)]" style={{ color: T.textPrimary }}>Action Items</h2>
            <p className="text-[13px] mt-0.5" style={{ color: T.textSecondary }}>Each item references specific data from dashboard pages</p>
          </div>
          <div className="flex items-center gap-1.5">
            {["all", "Critical", "High", "Medium"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all border"
                style={{
                  backgroundColor: filterPriority === p ? T.textPrimary : T.white,
                  color: filterPriority === p ? "#fff" : T.textSecondary,
                  borderColor: filterPriority === p ? T.textPrimary : T.border,
                }}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
            <ResetFilter visible={filterPriority !== "all"} onClick={() => setFilterPriority("all")} />
          </div>
        </div>

        <div className="space-y-3">
          {filteredItems.map((item) => {
            const pStyle = priorityStyles[item.priority];
            const sConfig = statusConfig[item.status];
            const StatusIcon = sConfig.icon;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md"
                style={{ border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
              >
                {/* Priority badge */}
                <div className="flex flex-col items-center gap-2 pt-0.5">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.iconColor + "15" }}>
                    <item.icon size={15} style={{ color: item.iconColor }} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{ backgroundColor: pStyle.bg, color: pStyle.text, borderColor: pStyle.border }}
                    >
                      {item.priority}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: sConfig.bg, color: sConfig.color }}
                    >
                      <StatusIcon size={10} />
                      {sConfig.label}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border" style={{ borderColor: T.border, color: T.textMuted }}>
                      {item.source}
                    </span>
                  </div>
                  <h4 className="text-[14px] font-bold" style={{ color: T.textPrimary }}>{item.title}</h4>
                  <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: T.textSecondary }}>{item.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: T.textMuted }}>
                      <Clock size={10} /> {item.timeline}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: T.textMuted }}>
                      {item.metric}
                    </span>
                  </div>
                  {/* Data reference */}
                  <div className="mt-2 px-2.5 py-1.5 rounded-lg text-[10px]" style={{ backgroundColor: "#F5F6FA", color: T.textMuted }}>
                    Data source: {item.dataRef}
                  </div>
                </div>

                {/* Action button */}
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-lg text-[12px] font-bold shrink-0 gap-1"
                  style={{ backgroundColor: "#4f46e5", color: "#fff" }}
                >
                  {item.action}
                  <ArrowRight size={12} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Data-Driven Recommendations ── */}
      <WarmSection>
        <AccentBar color={"#6366f1"} />
        <h2 className="text-[16px] font-bold font-[var(--font-inter)] mb-1" style={{ color: T.textPrimary }}>
          Recommendations Based on Dashboard Data
        </h2>
        <p className="text-[13px] mb-5" style={{ color: T.textSecondary }}>
          Strategic suggestions derived from patterns observed across Health Insights, Engagement, and Repeat Visits data
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, i) => (
            <CVCard key={i} expandable={false} chartData={rec} chartTitle={rec.title} chartDescription={rec.insight}>
              <span
                className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mb-3"
                style={{ backgroundColor: (categoryColors[rec.category] || "#6366f1") + "15", color: categoryColors[rec.category] || "#6366f1" }}
              >
                {rec.category}
              </span>
              <h4 className="text-[14px] font-bold" style={{ color: T.textPrimary }}>{rec.title}</h4>
              <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: T.textSecondary }}>{rec.insight}</p>
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                <p className="text-[12px] font-bold" style={{ color: T.green }}>{rec.impact}</p>
              </div>
              <div className="mt-2 px-2.5 py-1.5 rounded-lg text-[10px]" style={{ backgroundColor: "#F5F6FA", color: T.textMuted }}>
                {rec.dataRef}
              </div>
            </CVCard>
          ))}
        </div>
      </WarmSection>

      {/* ── KAM Support & Feedback ── */}
      <CVCard expandable={false}>
        <div className="flex items-center gap-4 py-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#6366f1" + "15" }}>
            <MessageSquare size={18} style={{ color: "#6366f1" }} />
          </div>
          <div className="flex-1">
            <h4 className="text-[14px] font-bold" style={{ color: T.textPrimary }}>KAM Support & Feedback</h4>
            <p className="text-[12px] mt-0.5" style={{ color: T.textSecondary }}>
              Need help implementing these recommendations? Your Key Account Manager is here to assist.
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px] rounded-lg" style={{ borderColor: T.border, color: T.textSecondary }}>
            <MessageSquare size={13} /> Contact KAM
          </Button>
          <Button size="sm" className="h-8 px-4 rounded-lg text-[12px] font-bold" style={{ backgroundColor: "#4f46e5", color: "#fff" }}>
            Submit Feedback
          </Button>
        </div>
      </CVCard>
    </div>
  );
}
