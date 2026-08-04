"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { T } from "@/lib/ui/theme";
import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Info,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  ShieldCheck,
  Syringe,
  Stethoscope,
  AlertTriangle,
  CalendarClock,
  Users,
  FileText,
  BadgeCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
  Cell,
} from "recharts";
import { PageGlanceBox } from "@/components/dashboard/PageGlanceBox";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { ResetFilter } from "@/components/ui/reset-filter";
import { NotificationsBell } from "@/components/NotificationsBell";
import { PageDownload } from "@/components/shared/PageDownload";
import {
  SERVICE_RULES,
  STATUS_COLORS,
  STATUS_ORDER,
  REMINDER_COLORS,
  REMINDER_NOTIFICATION,
  longDate,
  shortMonth,
  type ServiceKey,
  type ServiceStatus,
  type ReminderBucket,
} from "@/lib/compliance/rules";
import type {
  CompliancePayload,
  ComplianceEmployeeRow,
} from "@/lib/compliance/aggregate";

/**
 * One accent plus one alert colour. Indigo (and its two tints) carries every
 * chart, bar and heading; rose is reserved for anything overdue. Keeping the
 * surface this narrow is what makes the exceptions actually stand out.
 */
const C = {
  /** The single accent — headings, bars, lines, completed states */
  accent: "#4f46e5",
  accentMid: "#818cf8",
  accentPale: "#c7d2fe",
  /** Reserved for things that need action. Nothing else is red. */
  alert: "#e11d48",
  grey: "#d4d4d8",
};

/**
 * The pale end of the ramp can't carry white text or act as its own label
 * colour, so fills and ink are tracked separately.
 */
const STATUS_INK: Record<ServiceStatus, string> = {
  Completed: "#4f46e5",
  "In Progress": "#4338ca",
  Pending: "#4338ca",
  "Booster Due": "#e11d48",
  "Health Check Due": "#e11d48",
  "Vaccination Due": "#e11d48",
  "Not Enrolled": "#71717a",
};

/** Readable text colour to sit on top of a status fill. */
function onFill(status: ServiceStatus): string {
  return status === "Completed" || STATUS_COLORS[status] === C.alert ? "#ffffff" : "#3730a3";
}

// ─── Helpers ───

function formatNum(n: number): string {
  if (!n && n !== 0) return "0";
  return n.toLocaleString("en-IN");
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

const PAGE_SIZE = 25;

// ─── Accent Bar ───
function AccentBar({ color = "#4f46e5" }: { color?: string }) {
  return <div className="w-10 h-1 rounded-sm mb-3.5" style={{ background: `linear-gradient(90deg, ${color}, ${color})` }} />;
}

// ─── CVCard ───
function CVCard({
  children, className = "", accentColor, title, subtitle, tooltipText, expandable = true, rightHeader,
  chartData, chartTitle, chartDescription,
}: {
  children: React.ReactNode; className?: string; accentColor?: string;
  title?: string; subtitle?: string; tooltipText?: string; expandable?: boolean;
  rightHeader?: React.ReactNode;
  chartData?: unknown; chartTitle?: string; chartDescription?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden transition-all h-full flex flex-col ${expanded ? "col-span-full" : ""} ${className}`}
      style={{ border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
    >
      {(title || accentColor) && (
        <div className="px-6 pt-5 pb-1">
          {accentColor && <AccentBar color={accentColor} />}
          {title && (
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[15px] font-bold" style={{ color: T.textPrimary }}>{title}</h3>
                  {tooltipText && (
                    <Tooltip>
                      <TooltipTrigger><Info size={13} style={{ color: T.textMuted }} /></TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">{tooltipText}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {subtitle && <p className="text-[12px] mt-0.5" style={{ color: T.textSecondary }}>{subtitle}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {!!chartData && <AskAIButton title={chartTitle || title || ""} description={chartDescription} data={chartData} />}
                {rightHeader}
                {expandable && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: T.textMuted }} onClick={() => setExpanded(!expanded)}>
                    {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div data-chart-body className="px-6 pb-5 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, color, sub, icon, tooltip, insight, onClick, active }: {
  label: string; value: string | number; color: string; sub?: string;
  icon?: React.ReactNode; tooltip?: string; insight?: string;
  onClick?: () => void; active?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl overflow-hidden transition-all h-full flex flex-col ${onClick ? "cursor-pointer hover:-translate-y-px" : ""}`}
      style={{
        border: `1px solid ${active ? color : T.border}`,
        boxShadow: active ? `0 0 0 3px ${color}22, ${T.cardShadow}` : T.cardShadow,
      }}
    >
      <div className="px-6 pt-6 pb-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5">
          {icon && <span style={{ color: T.textMuted }}>{icon}</span>}
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: T.textMuted }}>{label}</p>
          {tooltip && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center" type="button" onClick={(e) => e.stopPropagation()}>
                  <Info size={13} style={{ color: T.textMuted }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="text-xs max-w-xs" side="top">{tooltip}</PopoverContent>
            </Popover>
          )}
        </div>
        <p className="text-[36px] font-extrabold mt-2.5 leading-none tracking-[-0.02em]" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-2" style={{ color: T.textSecondary }}>{sub}</p>}
        {insight && (
          <div className="mt-auto pt-4">
            <p className="text-xs leading-relaxed rounded-xl px-3 py-2" style={{ backgroundColor: "#eef2ff", color: T.textSecondary, border: "1px solid #c7d2fe" }}>{insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── InsightBox ───
function InsightBox({ text }: { text: string }) {
  return (
    <div className="mt-auto pt-4">
      <div className="rounded-[14px] px-4 py-3 text-[12px] leading-relaxed" style={{ backgroundColor: "#eef2ff", border: "1px solid #c7d2fe", color: "#3730a3" }}>
        {text}
      </div>
    </div>
  );
}

// ─── Filter Multi-Select ───
function FilterMultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors border hover:border-gray-300"
          style={{ borderColor: T.border, color: selected.length > 0 ? T.textPrimary : T.textSecondary, backgroundColor: T.white }}
        >
          {label}
          {selected.length > 0 && (
            <span className="ml-0.5 h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "#4f46e5" }}>
              {selected.length}
            </span>
          )}
          <ChevronDown size={13} style={{ color: T.textMuted }} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[12px] font-bold" style={{ color: T.textPrimary }}>{label}</span>
          {selected.length > 0 && (
            <button onClick={() => onChange([])} className="text-[10px] font-medium hover:underline" style={{ color: T.coral }}>Clear</button>
          )}
        </div>
        <ScrollArea className="max-h-52">
          <div className="space-y-0.5">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-[12px]" style={{ color: T.textPrimary }}>
                <Checkbox checked={selected.includes(opt)} onCheckedChange={() =>
                  onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
                } className="h-3.5 w-3.5" />
                {opt}
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ─── Status pill ───
function StatusPill({ status, size = "sm" }: { status: ServiceStatus; size?: "sm" | "xs" }) {
  const color = STATUS_INK[status];
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold whitespace-nowrap ${size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}`}
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}35` }}
    >
      {status}
    </span>
  );
}

// ─── Dose ladder (mirrors the dose tracker in the reference mockup) ───
function DoseLadder({ done, required, color }: { done: number; required: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" title={`${done} of ${required} doses`}>
      {Array.from({ length: required }).map((_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 7, height: 7,
            backgroundColor: i < done ? color : "transparent",
            border: `1.5px solid ${i < done ? color : T.border}`,
          }}
        />
      ))}
    </span>
  );
}

// ─── Compliance ring ───
function ComplianceRing({ value, size = 148, stroke = 14 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
  const color = C.accent;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={T.borderLight} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-extrabold leading-none tracking-[-0.02em]" style={{ color }}>{value}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] mt-1" style={{ color: T.textMuted }}>Compliant</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════

type DueFilter = "all" | "overdue" | "due30";
type OverallFilter = "all" | "Compliant" | "Non-Compliant";

export default function CompliancePage() {
  const { activeClientId } = useAuth();

  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [overallFilter, setOverallFilter] = useState<OverallFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [focus, setFocus] = useState<{ service: ServiceKey; status: ServiceStatus } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const apiUrl = activeClientId ? `/api/compliance?clientId=${activeClientId}` : "/api/compliance";
  const { data, isLoading } = useSWR<CompliancePayload>(
    apiUrl,
    (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); }),
    { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true },
  );

  const employees = useMemo(() => data?.employees ?? [], [data]);
  const months = useMemo(() => data?.months ?? [], [data]);

  // ── Scope: site / department / free-text. The drill-down tiles read their
  //    counts from here so they always show what you can still narrow down to.
  const scopedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (selectedSites.length && !selectedSites.includes(e.site)) return false;
      if (selectedDepartments.length && !selectedDepartments.includes(e.department)) return false;
      if (q) {
        const hay = `${e.name} ${e.empId} ${e.mobile} ${e.site} ${e.department} ${e.designation}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, selectedSites, selectedDepartments, search]);

  // ── Rows after the drill-down tiles and any service/status focus
  const rows = useMemo(() => {
    return scopedRows.filter((e) => {
      if (overallFilter !== "all" && e.overall !== overallFilter) return false;
      if (dueFilter === "overdue" && e.overdueCount === 0) return false;
      if (dueFilter === "due30" && !(e.daysToDue !== null && e.daysToDue >= 0 && e.daysToDue <= 30)) return false;
      if (focus && e.services[focus.service].status !== focus.status) return false;
      return true;
    });
  }, [scopedRows, overallFilter, dueFilter, focus]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = scopedRows.length;
    const compliant = scopedRows.filter((e) => e.overall === "Compliant").length;
    const overdueEmployees = scopedRows.filter((e) => e.overdueCount > 0).length;
    const due30 = scopedRows.filter((e) => e.daysToDue !== null && e.daysToDue >= 0 && e.daysToDue <= 30).length;
    let overdueActions = 0;
    let boostersDue = 0;
    let healthChecksDue = 0;
    let certificates = 0;
    for (const e of scopedRows) {
      for (const rule of SERVICE_RULES) {
        const s = e.services[rule.key];
        if (s.overdue) overdueActions += 1;
        if (s.status === "Booster Due") boostersDue += 1;
        if (s.status === "Health Check Due") healthChecksDue += 1;
        if (s.certificate) certificates += 1;
      }
    }
    return {
      totalEmployees: total,
      compliant,
      nonCompliant: total - compliant,
      compliancePct: pct(compliant, total),
      overdueEmployees,
      overdueActions,
      due30,
      boostersDue,
      healthChecksDue,
      certificates,
    };
  }, [scopedRows]);

  // ── Service-wise status breakdown ─────────────────────────────────────────
  const serviceBreakdown = useMemo(() => {
    return SERVICE_RULES.map((rule) => {
      const counts = {} as Record<ServiceStatus, number>;
      for (const s of STATUS_ORDER) counts[s] = 0;
      let compliant = 0;
      for (const e of rows) {
        const cell = e.services[rule.key];
        counts[cell.status] += 1;
        if (cell.compliant) compliant += 1;
      }
      return {
        rule,
        counts,
        total: rows.length,
        compliant,
        compliantPct: pct(compliant, rows.length),
      };
    });
  }, [rows]);

  // ── Dose ladder completion per vaccine ────────────────────────────────────
  const doseLadders = useMemo(() => {
    return SERVICE_RULES.filter((r) => r.key !== "medical").map((rule) => {
      const steps = Array.from({ length: rule.dosesRequired }).map((_, i) => {
        const reached = rows.filter((e) => e.services[rule.key].done >= i + 1).length;
        return { label: `Dose ${i + 1}`, count: reached, pct: pct(reached, rows.length) };
      });
      return { rule, steps };
    });
  }, [rows]);

  // ── Site / department roll-ups ────────────────────────────────────────────
  const { siteRows, deptRows } = useMemo(() => {
    const group = (key: "site" | "department") => {
      const map = new Map<string, { name: string; total: number; compliant: number; overdue: number }>();
      for (const e of rows) {
        const g = e[key];
        const entry = map.get(g) || { name: g, total: 0, compliant: 0, overdue: 0 };
        entry.total += 1;
        if (e.overall === "Compliant") entry.compliant += 1;
        if (e.overdueCount > 0) entry.overdue += 1;
        map.set(g, entry);
      }
      return [...map.values()]
        .map((g) => ({ ...g, nonCompliant: g.total - g.compliant, pct: pct(g.compliant, g.total) }))
        .sort((a, b) => b.pct - a.pct);
    };
    return { siteRows: group("site"), deptRows: group("department") };
  }, [rows]);

  // ── Reminder pipeline (Reminder Rules) ────────────────────────────────────
  const reminderPipeline = useMemo(() => {
    const buckets: ReminderBucket[] = ["Overdue", "Due Today", "Reminder", "Upcoming Due"];
    const counts = new Map<ReminderBucket, number>(buckets.map((b) => [b, 0]));
    for (const e of rows) {
      for (const rule of SERVICE_RULES) {
        const r = e.services[rule.key].reminder;
        if (counts.has(r)) counts.set(r, (counts.get(r) || 0) + 1);
      }
    }
    const trigger: Record<string, string> = {
      Overdue: "Due date crossed",
      "Due Today": "On the due date",
      Reminder: "7 days before due date",
      "Upcoming Due": "30 days before due date",
    };
    const max = Math.max(1, ...[...counts.values()]);
    return buckets.map((b) => ({
      bucket: b,
      count: counts.get(b) || 0,
      pct: pct(counts.get(b) || 0, max),
      color: REMINDER_COLORS[b],
      // The pale end of the ramp is unreadable as text, so labels get their own ink
      ink: b === "Overdue" ? C.alert : "#4338ca",
      notification: REMINDER_NOTIFICATION[b],
      trigger: trigger[b],
    }));
  }, [rows]);

  // ── Upcoming due volume by month ──────────────────────────────────────────
  const dueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of rows) {
      for (const rule of SERVICE_RULES) {
        const due = e.services[rule.key].nextDueOn;
        const days = e.services[rule.key].daysToDue;
        if (!due || days === null || days < 0 || days > 365) continue;
        const key = due.slice(0, 7);
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, label: shortMonth(`${month}-01`), count }));
  }, [rows]);

  // ── Compliance trend, replayed from the dose history ──────────────────────
  const trend = useMemo(() => {
    if (!months.length) return [];
    return months.map((mo, i) => {
      const compliant = rows.reduce((sum, e) => sum + (e.history[i] || 0), 0);
      return { label: mo.label, compliant, pct: pct(compliant, rows.length) };
    });
  }, [rows, months]);

  const trendDelta = trend.length > 1 ? Math.round((trend[trend.length - 1].pct - trend[0].pct) * 10) / 10 : 0;

  // ── Register paging ───────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = rows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const resetDrilldowns = () => {
    setOverallFilter("all");
    setDueFilter("all");
    setFocus(null);
    setPage(0);
  };

  const clearAll = () => {
    setSelectedSites([]);
    setSelectedDepartments([]);
    setSearch("");
    resetDrilldowns();
  };

  const hasDrilldown = overallFilter !== "all" || dueFilter !== "all" || focus !== null;
  const chips: Array<{ key: string; value: string; clear: () => void }> = [
    ...selectedSites.map((s) => ({ key: "Site", value: s, clear: () => setSelectedSites((p) => p.filter((v) => v !== s)) })),
    ...selectedDepartments.map((s) => ({ key: "Department", value: s, clear: () => setSelectedDepartments((p) => p.filter((v) => v !== s)) })),
    ...(overallFilter !== "all" ? [{ key: "Status", value: overallFilter, clear: () => setOverallFilter("all") }] : []),
    ...(dueFilter !== "all" ? [{ key: "Due", value: dueFilter === "overdue" ? "Overdue" : "Due in 30 days", clear: () => setDueFilter("all") }] : []),
    ...(focus ? [{ key: "Service", value: `${SERVICE_RULES.find((r) => r.key === focus.service)!.shortLabel}: ${focus.status}`, clear: () => setFocus(null) }] : []),
  ];

  const worstSite = siteRows[siteRows.length - 1];
  const bestSite = siteRows[0];
  const weakestService = [...serviceBreakdown].sort((a, b) => a.compliantPct - b.compliantPct)[0];

  return (
    <div className="animate-stagger space-y-6">
      {/* ── Filters ── */}
      <div
        className="flex items-center gap-2 flex-wrap px-5 py-3.5 rounded-2xl"
        style={{ backgroundColor: T.white, border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
      >
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search name, employee ID, mobile, department or site"
            className="h-9 w-[340px] pl-9 text-[13px]"
            style={{ borderColor: T.border }}
          />
        </div>
        <FilterMultiSelect label="Site" options={data?.sites ?? []} selected={selectedSites} onChange={(v) => { setSelectedSites(v); setPage(0); }} />
        <FilterMultiSelect label="Department" options={data?.departments ?? []} selected={selectedDepartments} onChange={(v) => { setSelectedDepartments(v); setPage(0); }} />
        <ResetFilter visible={chips.length > 0} onClick={clearAll} />
        <div className="flex-1" />
        {data?.asOf && (
          <span className="text-[11px] font-medium mr-1" style={{ color: T.textMuted }}>
            Data as of {longDate(data.asOf)}
          </span>
        )}
        <PageDownload pageTitle="Compliance" />
        <NotificationsBell />
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <span key={`${c.key}-${c.value}`} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium" style={{ border: "1px solid #c7d2fe", color: "#4f46e5", backgroundColor: "#eef2ff" }}>
              <span style={{ color: T.textMuted }}>{c.key}:</span> {c.value}
              <button onClick={c.clear} className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-gray-100"><X size={10} /></button>
            </span>
          ))}
          <button onClick={clearAll} className="text-[11px] font-medium ml-1 hover:underline" style={{ color: T.coral }}>Clear all</button>
        </div>
      )}

      <PageGlanceBox
        pageTitle="Medical & Vaccination Compliance"
        pageSubtitle="Tracks every employee against the five mandatory services — annual health check, Hepatitis A, Hepatitis B, Typhoid and Tetanus. An employee counts as compliant only when all five are complete and none have fallen past their due date."
        kpis={kpis}
        fallbackSummary={`${kpis.compliancePct}% of the ${formatNum(kpis.totalEmployees)} employees on the register are fully compliant. ${formatNum(kpis.nonCompliant)} still have at least one service outstanding, and ${formatNum(kpis.overdueActions)} individual doses or health checks are already past their due date.`}
        fallbackChips={[
          { label: "Compliance", value: `${kpis.compliancePct}%` },
          { label: "Compliant", value: formatNum(kpis.compliant) },
          { label: "Non-Compliant", value: formatNum(kpis.nonCompliant) },
          { label: "Overdue Actions", value: formatNum(kpis.overdueActions) },
        ]}
      />

      {/* ── Compliance hero + drill-down tiles ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CVCard
          accentColor={C.accent}
          title="Overall Compliance"
          subtitle="Share of employees with all five mandatory services complete and nothing overdue."
          tooltipText="Compliance Rule: an employee is Compliant only when every mandatory service is complete. Any service that is pending, part-way through its dose course, or past its due date makes the employee Non-Compliant."
          expandable={false}
        >
          <div className="flex items-center gap-6 mt-3">
            <ComplianceRing value={kpis.compliancePct} />
            <div className="flex flex-col gap-3 min-w-0">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: T.textMuted }}>Employees on register</p>
                <p className="text-[28px] font-extrabold leading-none tracking-[-0.02em]" style={{ color: T.textPrimary }}>{formatNum(kpis.totalEmployees)}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-2 text-[12.5px]" style={{ color: T.textSecondary }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.accent }} />
                  {formatNum(kpis.compliant)} compliant
                </span>
                <span className="inline-flex items-center gap-2 text-[12.5px]" style={{ color: T.textSecondary }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.alert }} />
                  {formatNum(kpis.nonCompliant)} non-compliant
                </span>
                <span className="inline-flex items-center gap-2 text-[12.5px]" style={{ color: T.textSecondary }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.accentPale }} />
                  {formatNum(kpis.due30)} due in the next 30 days
                </span>
              </div>
            </div>
          </div>
          <InsightBox text={`${kpis.compliancePct}% of employees in the current selection are fully compliant${trendDelta !== 0 ? `, ${trendDelta > 0 ? "up" : "down"} ${Math.abs(trendDelta)} points over the last 12 months` : ""}. ${weakestService ? `${weakestService.rule.label} is the weakest service at ${weakestService.compliantPct}% — clearing that alone would lift the overall number the most.` : ""}`} />
        </CVCard>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Compliant"
            value={formatNum(kpis.compliant)}
            color={C.accent}
            icon={<ShieldCheck size={16} />}
            sub="all five services complete"
            tooltip="Employees whose Medical Health Check, Hepatitis A, Hepatitis B, Typhoid and Tetanus records are all complete and within validity."
            onClick={() => { setOverallFilter(overallFilter === "Compliant" ? "all" : "Compliant"); setDueFilter("all"); setPage(0); }}
            active={overallFilter === "Compliant"}
          />
          <StatCard
            label="Non-Compliant"
            value={formatNum(kpis.nonCompliant)}
            color={C.alert}
            icon={<AlertTriangle size={16} />}
            sub="at least one service outstanding"
            tooltip="Any mandatory service that is pending, in progress or overdue makes the employee non-compliant."
            onClick={() => { setOverallFilter(overallFilter === "Non-Compliant" ? "all" : "Non-Compliant"); setDueFilter("all"); setPage(0); }}
            active={overallFilter === "Non-Compliant"}
          />
          <StatCard
            label="Overdue Actions"
            value={formatNum(kpis.overdueActions)}
            color={C.alert}
            icon={<CalendarClock size={16} />}
            sub={`across ${formatNum(kpis.overdueEmployees)} employees`}
            tooltip="Individual doses, boosters and health checks whose due date has already passed. One employee can have more than one."
            onClick={() => { setDueFilter(dueFilter === "overdue" ? "all" : "overdue"); setOverallFilter("all"); setPage(0); }}
            active={dueFilter === "overdue"}
          />
          <StatCard
            label="Due in 30 Days"
            value={formatNum(kpis.due30)}
            color={C.accent}
            icon={<Users size={16} />}
            sub="employees with an action coming up"
            tooltip="Employees whose next action falls within the next 30 days — the point at which the reminder engine sends an 'Upcoming Due' notification."
            onClick={() => { setDueFilter(dueFilter === "due30" ? "all" : "due30"); setOverallFilter("all"); setPage(0); }}
            active={dueFilter === "due30"}
          />
        </div>
      </div>

      {hasDrilldown && (
        <div className="flex items-center gap-2 text-[12px]" style={{ color: T.textSecondary }}>
          <Info size={13} />
          Every chart and the register below are filtered to {formatNum(rows.length)} of {formatNum(scopedRows.length)} employees.
          <button onClick={resetDrilldowns} className="font-semibold hover:underline" style={{ color: T.coral }}>Reset drill-down</button>
        </div>
      )}

      {/* ── Service-wise status ── */}
      <CVCard
        accentColor={C.accent}
        title="Service-wise Status"
        subtitle="How the workforce splits across the dashboard statuses for each mandatory service. Click any segment to filter the page to that group."
        tooltipText="Statuses follow the framework rules: Not Enrolled, Pending (enrolled, nothing done), In Progress (next dose pending), Completed (all doses done), Booster Due, Health Check Due and Vaccination Due."
        chartData={serviceBreakdown.map((s) => ({ service: s.rule.label, completed: s.counts.Completed, compliantPct: s.compliantPct }))}
        chartTitle="Service-wise Status"
        chartDescription="Status distribution across the five mandatory compliance services"
      >
        <div className="mt-3 flex flex-wrap items-center gap-3 mb-4">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.textSecondary }}>
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />{s}
            </span>
          ))}
        </div>

        <div className="space-y-4">
          {serviceBreakdown.map(({ rule, counts, total, compliantPct }) => (
            <div key={rule.key}>
              <div className="flex items-end justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: rule.color }} />
                  <span className="text-[13px] font-bold truncate" style={{ color: T.textPrimary }}>{rule.label}</span>
                  <span className="text-[11px] shrink-0" style={{ color: T.textMuted }}>
                    {rule.dosesRequired > 1 ? `${rule.dosesRequired} doses · ${rule.schedule}` : rule.schedule}
                    {rule.boosterMonths ? ` · booster every ${rule.boosterMonths / 12} yrs` : ""}
                  </span>
                </div>
                <span className="text-[13px] font-extrabold shrink-0 ml-3" style={{ color: T.textPrimary }}>
                  {compliantPct}%
                </span>
              </div>
              <div className="rounded-lg overflow-hidden flex h-8" style={{ border: `1px solid ${T.borderLight}` }}>
                {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => {
                  const share = pct(counts[s], total);
                  const isFocused = focus?.service === rule.key && focus?.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => { setFocus(isFocused ? null : { service: rule.key, status: s }); setPage(0); }}
                      className="flex items-center justify-center text-[11px] font-bold transition-all hover:brightness-110"
                      style={{
                        width: `${share}%`,
                        backgroundColor: STATUS_COLORS[s],
                        color: onFill(s),
                        opacity: focus && !isFocused ? 0.45 : 1,
                        minWidth: counts[s] > 0 ? 3 : 0,
                      }}
                      title={`${rule.label} — ${s}: ${formatNum(counts[s])} (${share}%)`}
                    >
                      {share >= 8 ? formatNum(counts[s]) : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <InsightBox text={`${weakestService ? `${weakestService.rule.label} has the lowest completion at ${weakestService.compliantPct}%, with ${formatNum(weakestService.counts.Pending + weakestService.counts["In Progress"])} employees part-way through or yet to start.` : ""} ${kpis.boostersDue > 0 ? `${formatNum(kpis.boostersDue)} boosters (Typhoid every 3 years, Tetanus every 10) have fallen due.` : ""}`} />
      </CVCard>

      {/* ── Dose ladders + reminder pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CVCard
          accentColor={C.accent}
          title="Dose Ladder Completion"
          subtitle="How far the workforce has progressed through each vaccination course. Hepatitis B, for example, only counts as compliant after all three doses."
          tooltipText="Dose schedules from the framework: Hepatitis A at 0 and 6 months, Hepatitis B at 0, 1 and 6 months, Typhoid and Tetanus as single doses with periodic boosters."
          chartData={doseLadders.map((d) => ({ vaccine: d.rule.label, steps: d.steps }))}
          chartTitle="Dose Ladder Completion"
          chartDescription="Employees reaching each dose of the vaccination courses"
        >
          <div className="space-y-5 mt-3">
            {doseLadders.map(({ rule, steps }) => (
              <div key={rule.key}>
                <div className="flex items-center gap-2 mb-2">
                  <Syringe size={13} style={{ color: rule.color }} />
                  <span className="text-[13px] font-bold" style={{ color: T.textPrimary }}>{rule.label}</span>
                  <span className="text-[11px]" style={{ color: T.textMuted }}>{rule.schedule}</span>
                </div>
                <div className="space-y-1.5">
                  {steps.map((step) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <span className="text-[11px] w-12 shrink-0" style={{ color: T.textSecondary }}>{step.label}</span>
                      <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ backgroundColor: T.borderLight }}>
                        <div className="h-full rounded-md transition-all" style={{ width: `${step.pct}%`, backgroundColor: rule.color }} />
                      </div>
                      <span className="text-[11.5px] font-bold w-24 text-right shrink-0" style={{ color: T.textPrimary }}>
                        {formatNum(step.count)} <span className="font-medium" style={{ color: T.textMuted }}>({step.pct}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CVCard>

        <CVCard
          accentColor={C.accent}
          title="Reminder Pipeline"
          subtitle="Outstanding doses and health checks grouped by the notification the reminder engine would send today."
          tooltipText="Reminder Rules: 30 days before the due date sends 'Upcoming Due', 7 days before sends 'Reminder', the due date itself sends 'Due Today', and anything past its date sends 'Overdue'."
          chartData={reminderPipeline}
          chartTitle="Reminder Pipeline"
          chartDescription="Outstanding compliance actions by reminder stage"
        >
          <div className="space-y-2.5 mt-3">
            {reminderPipeline.map((r) => (
              <div key={r.bucket} className="rounded-xl px-4 py-3" style={{ border: `1px solid ${r.ink}22`, backgroundColor: `${r.ink}06` }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold" style={{ color: r.ink }}>{r.notification}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: T.textSecondary }}>{r.trigger}</p>
                  </div>
                  <span className="text-[22px] font-extrabold leading-none shrink-0" style={{ color: r.ink }}>{formatNum(r.count)}</span>
                </div>
                <div className="h-1.5 rounded-full mt-2.5" style={{ backgroundColor: `${r.color}20` }}>
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                </div>
              </div>
            ))}
          </div>
          <InsightBox text={`${formatNum(reminderPipeline[0].count)} actions are already overdue and need chasing now, while ${formatNum(reminderPipeline[2].count + reminderPipeline[3].count)} fall due within the next 30 days — schedule those into the upcoming clinic calendar to stop them slipping.`} />
        </CVCard>
      </div>

      {/* ── Site + department ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CVCard
          accentColor={C.accent}
          title="Compliance by Site"
          subtitle="Which locations are keeping up and which need a catch-up drive. Click a bar to filter the page to that site."
          chartData={siteRows}
          chartTitle="Compliance by Site"
          chartDescription="Compliance rate per site"
        >
          <div style={{ height: Math.max(200, siteRows.length * 46) }} className="mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteRows} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }} barCategoryGap="28%">
                <CartesianGrid horizontal={false} stroke={T.borderLight} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMuted }} unit="%" />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: T.textPrimary, fontWeight: 600 }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }}
                  formatter={((v: number, _n: string, item: any) => [`${v}% (${formatNum(item.payload.compliant)} of ${formatNum(item.payload.total)})`, "Compliant"]) as any}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d: any) => { setSelectedSites([d.name]); setPage(0); }}>
                  {siteRows.map((s) => (
                    <Cell key={s.name} fill={C.accent} />
                  ))}
                  <LabelList dataKey="pct" position="right" formatter={((v: number) => `${v}%`) as any} style={{ fontSize: 11, fontWeight: 700, fill: T.textPrimary }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {bestSite && worstSite && bestSite.name !== worstSite.name && (
            <InsightBox text={`${bestSite.name} leads at ${bestSite.pct}% while ${worstSite.name} trails at ${worstSite.pct}% — a ${Math.round((bestSite.pct - worstSite.pct) * 10) / 10} point gap. ${formatNum(worstSite.nonCompliant)} employees at ${worstSite.name} still have an outstanding service.`} />
          )}
        </CVCard>

        <CVCard
          accentColor={C.accent}
          title="Compliance by Department"
          subtitle="Compliance rate for each department, so catch-up drives can be aimed at the teams that need them."
          chartData={deptRows}
          chartTitle="Compliance by Department"
          chartDescription="Compliance rate per department"
        >
          <div style={{ height: Math.max(200, deptRows.length * 34) }} className="mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptRows} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }} barCategoryGap="24%">
                <CartesianGrid horizontal={false} stroke={T.borderLight} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMuted }} unit="%" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: T.textPrimary, fontWeight: 600 }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }}
                  formatter={((v: number, _n: string, item: any) => [`${v}% (${formatNum(item.payload.compliant)} of ${formatNum(item.payload.total)})`, "Compliant"]) as any}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]} fill={C.accentMid} cursor="pointer" onClick={(d: any) => { setSelectedDepartments([d.name]); setPage(0); }}>
                  <LabelList dataKey="pct" position="right" formatter={((v: number) => `${v}%`) as any} style={{ fontSize: 11, fontWeight: 700, fill: T.textPrimary }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CVCard>
      </div>

      {/* ── Trend + due volume ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CVCard
          accentColor={C.accent}
          title="Compliance Trend"
          subtitle="Compliance rate at the end of each of the last 12 months, replayed from the recorded dose and health check dates."
          tooltipText="Each point re-runs the same compliance rules against only the doses that had been administered by that month — so the line reflects the actual record, not a projection."
          chartData={trend}
          chartTitle="Compliance Trend"
          chartDescription="Monthly compliance rate over the last 12 months"
        >
          <div style={{ height: 250 }} className="mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid stroke={T.borderLight} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textMuted }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMuted }} unit="%" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }}
                  formatter={((v: number, _n: string, item: any) => [`${v}% (${formatNum(item.payload.compliant)} employees)`, "Compliant"]) as any}
                />
                <Line type="monotone" dataKey="pct" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <InsightBox text={`Compliance has moved from ${trend[0]?.pct ?? 0}% to ${trend[trend.length - 1]?.pct ?? 0}% over the last 12 months${trendDelta >= 0 ? `, a gain of ${trendDelta} points` : `, a drop of ${Math.abs(trendDelta)} points`}. Boosters and annual health checks fall due continuously, so the rate only holds if the upcoming pipeline is cleared each month.`} />
        </CVCard>

        <CVCard
          accentColor={C.accent}
          title="Upcoming Due Volume"
          subtitle="Doses, boosters and health checks falling due over the next 12 months — the workload the clinic needs to plan for."
          chartData={dueByMonth}
          chartTitle="Upcoming Due Volume"
          chartDescription="Compliance actions falling due by month over the next year"
        >
          <div style={{ height: 250 }} className="mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dueByMonth} margin={{ top: 12, right: 16, left: 0, bottom: 4 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={T.borderLight} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: T.textMuted }} />
                <YAxis tick={{ fontSize: 10, fill: T.textMuted }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 12, border: `1px solid ${T.border}`, fontSize: 12 }}
                  formatter={((v: number) => [formatNum(v), "Actions due"]) as any}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={C.accentMid}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 700, fill: T.textPrimary }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <InsightBox text={`${formatNum(dueByMonth.reduce((s, m) => s + m.count, 0))} actions fall due over the next 12 months. The busiest month is ${dueByMonth.length ? [...dueByMonth].sort((a, b) => b.count - a.count)[0].label : "—"} — worth scheduling extra clinic slots ahead of it.`} />
        </CVCard>
      </div>

      {/* ── Employee register ── */}
      <CVCard
        accentColor={C.accent}
        title="Employee Compliance Register"
        subtitle="Every employee with their status for each mandatory service. Click a row to see dose dates, next due dates and the certificates on file."
        tooltipText="Read-only view. Dose dots show progress through the course — a filled dot per administered dose."
        expandable={false}
        rightHeader={
          <span className="text-[11.5px] font-medium mr-1" style={{ color: T.textMuted }}>
            {formatNum(rows.length)} of {formatNum(employees.length)} employees
          </span>
        }
      >
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th className="text-left text-[11px] font-bold uppercase tracking-[0.06em] pb-2.5 pr-3" style={{ color: T.textMuted }}>Employee</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-[0.06em] pb-2.5 px-3" style={{ color: T.textMuted }}>Site</th>
                {SERVICE_RULES.map((rule) => (
                  <th key={rule.key} className="text-center text-[11px] font-bold uppercase tracking-[0.06em] pb-2.5 px-2" style={{ color: T.textMuted }}>{rule.shortLabel}</th>
                ))}
                <th className="text-left text-[11px] font-bold uppercase tracking-[0.06em] pb-2.5 px-3" style={{ color: T.textMuted }}>Next Due</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-[0.06em] pb-2.5 pl-3" style={{ color: T.textMuted }}>Overall</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !employees.length && (
                <tr><td colSpan={9} className="py-10 text-center text-[13px]" style={{ color: T.textMuted }}>Loading register…</td></tr>
              )}
              {!isLoading && pageRows.length === 0 && (
                <tr><td colSpan={9} className="py-10 text-center text-[13px]" style={{ color: T.textMuted }}>No employees match the current filters.</td></tr>
              )}
              {pageRows.map((emp) => {
                const isOpen = openRow === emp.empId;
                return (
                  <RegisterRow key={emp.empId} emp={emp} isOpen={isOpen} onToggle={() => setOpenRow(isOpen ? null : emp.empId)} />
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${T.borderLight}` }}>
            <span className="text-[12px]" style={{ color: T.textSecondary }}>
              Showing {formatNum(currentPage * PAGE_SIZE + 1)}–{formatNum(Math.min((currentPage + 1) * PAGE_SIZE, rows.length))} of {formatNum(rows.length)}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[12px]" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button>
              <span className="text-[12px] font-medium" style={{ color: T.textSecondary }}>Page {currentPage + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8 text-[12px]" disabled={currentPage >= totalPages - 1} onClick={() => setPage(currentPage + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CVCard>

      {/* ── Rules reference ── */}
      <CVCard
        accentColor={C.accent}
        title="Compliance Rules Applied"
        subtitle="The dose schedules, booster intervals and certificates this dashboard evaluates against."
        expandable={false}
      >
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Service", "Doses Required", "Dose Schedule", "Booster", "Compliance Rule", "Certificate"].map((h) => (
                  <th key={h} className="text-left text-[11px] font-bold uppercase tracking-[0.06em] pb-2.5 pr-4" style={{ color: T.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SERVICE_RULES.map((rule) => (
                <tr key={rule.key} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2 text-[13px] font-semibold" style={{ color: T.textPrimary }}>
                      {rule.key === "medical" ? <Stethoscope size={14} style={{ color: rule.color }} /> : <Syringe size={14} style={{ color: rule.color }} />}
                      {rule.label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[13px]" style={{ color: T.textSecondary }}>{rule.key === "medical" ? "—" : rule.dosesRequired}</td>
                  <td className="py-3 pr-4 text-[13px]" style={{ color: T.textSecondary }}>{rule.schedule}</td>
                  <td className="py-3 pr-4 text-[13px]" style={{ color: T.textSecondary }}>
                    {rule.boosterMonths ? `Every ${rule.boosterMonths / 12} years` : "No"}
                  </td>
                  <td className="py-3 pr-4 text-[13px]" style={{ color: T.textSecondary }}>
                    {rule.validityMonths
                      ? `Completed if the health check is within ${rule.validityMonths} months`
                      : `Compliant only after dose ${rule.dosesRequired}`}
                  </td>
                  <td className="py-3 pr-4 text-[13px]" style={{ color: T.textSecondary }}>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={13} style={{ color: T.textMuted }} />
                      {rule.certificate}{rule.sticker ? " + sticker" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] mt-3" style={{ color: T.textMuted }}>
          Demo environment — the register is generated sample data for {formatNum(employees.length)} employees and is read-only.
        </p>
      </CVCard>
    </div>
  );
}

// ─── Register row (with expandable detail) ───
function RegisterRow({ emp, isOpen, onToggle }: {
  emp: ComplianceEmployeeRow; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition-colors hover:bg-gray-50"
        style={{ borderBottom: `1px solid ${T.borderLight}` }}
      >
        <td className="py-3 pr-3">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown size={14} style={{ color: T.textMuted }} /> : <ChevronRight size={14} style={{ color: T.textMuted }} />}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: T.textPrimary }}>{emp.name}</p>
              <p className="text-[11px]" style={{ color: T.textMuted }}>{emp.empId} · {emp.designation}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-3">
          <p className="text-[12.5px]" style={{ color: T.textSecondary }}>{emp.site}</p>
          <p className="text-[11px]" style={{ color: T.textMuted }}>{emp.department}</p>
        </td>
        {SERVICE_RULES.map((rule) => {
          const cell = emp.services[rule.key];
          const color = STATUS_INK[cell.status];
          return (
            <td key={rule.key} className="py-3 px-2">
              <div className="flex flex-col items-center gap-1">
                <DoseLadder done={cell.done} required={cell.required} color={rule.color} />
                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color }}>
                  {/* Single-dose services accumulate boosters/annual checks, so a
                      "3/1" ratio would be misleading — show the status instead. */}
                  {cell.status === "Completed" && cell.required > 1 ? `${cell.done}/${cell.required}` : cell.status}
                </span>
              </div>
            </td>
          );
        })}
        <td className="py-3 px-3">
          {emp.nextDueOn ? (
            <>
              <p className="text-[12.5px] font-medium" style={{ color: emp.daysToDue !== null && emp.daysToDue < 0 ? C.alert : T.textSecondary }}>
                {shortMonth(emp.nextDueOn)}
              </p>
              <p className="text-[11px]" style={{ color: T.textMuted }}>
                {emp.daysToDue !== null && emp.daysToDue < 0 ? `${Math.abs(emp.daysToDue)} days overdue` : `in ${emp.daysToDue} days`}
              </p>
            </>
          ) : (
            <span className="text-[12px]" style={{ color: T.textMuted }}>—</span>
          )}
        </td>
        <td className="py-3 pl-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{
              backgroundColor: emp.overall === "Compliant" ? `${C.accent}14` : `${C.alert}14`,
              color: emp.overall === "Compliant" ? C.accent : C.alert,
              border: `1px solid ${emp.overall === "Compliant" ? C.accent : C.alert}30`,
            }}
          >
            {emp.overall === "Compliant" ? <BadgeCheck size={12} /> : <AlertTriangle size={12} />}
            {emp.servicesComplete}/{emp.servicesTotal}
          </span>
        </td>
      </tr>

      {isOpen && (
        <tr style={{ borderBottom: `1px solid ${T.borderLight}` }}>
          <td colSpan={9} className="p-0">
            <div className="px-4 py-4" style={{ backgroundColor: T.warmBg }}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-4 text-[12px]" style={{ color: T.textSecondary }}>
                <span><span style={{ color: T.textMuted }}>Employee ID:</span> <strong style={{ color: T.textPrimary }}>{emp.empId}</strong></span>
                <span><span style={{ color: T.textMuted }}>Mobile:</span> <strong style={{ color: T.textPrimary }}>{emp.mobile}</strong></span>
                <span><span style={{ color: T.textMuted }}>Age / Gender:</span> <strong style={{ color: T.textPrimary }}>{emp.age} · {emp.gender}</strong></span>
                <span><span style={{ color: T.textMuted }}>Medical Package:</span> <strong style={{ color: T.textPrimary }}>{emp.medicalPackage ? "Yes" : "No"}</strong></span>
                <span><span style={{ color: T.textMuted }}>Site:</span> <strong style={{ color: T.textPrimary }}>{emp.site}</strong></span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {SERVICE_RULES.map((rule) => {
                  const cell = emp.services[rule.key];
                  return (
                    <div key={rule.key} className="rounded-xl bg-white px-4 py-3" style={{ border: `1px solid ${T.border}` }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: T.textPrimary }}>
                          {rule.key === "medical" ? <Stethoscope size={13} style={{ color: rule.color }} /> : <Syringe size={13} style={{ color: rule.color }} />}
                          {rule.label}
                        </span>
                        <StatusPill status={cell.status} size="xs" />
                      </div>

                      <div className="space-y-1">
                        {Array.from({ length: Math.max(cell.required, cell.doseDates.length) }).map((_, i) => {
                          const date = cell.doseDates[i];
                          const isCheck = rule.key === "medical";
                          const stepLabel = isCheck
                            ? (i === cell.doseDates.length - 1 ? "Latest check" : `Check ${i + 1}`)
                            : `Dose ${i + 1}`;
                          return (
                            <div key={i} className="flex items-center justify-between text-[11.5px]">
                              <span className="inline-flex items-center gap-1.5" style={{ color: T.textSecondary }}>
                                <span
                                  className="rounded-full"
                                  style={{
                                    width: 6, height: 6,
                                    backgroundColor: date ? rule.color : "transparent",
                                    border: `1.5px solid ${date ? rule.color : T.border}`,
                                  }}
                                />
                                {stepLabel}
                              </span>
                              <span style={{ color: date ? T.textPrimary : T.textMuted }}>
                                {date ? longDate(date) : "Not recorded"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2.5 pt-2.5 flex items-center justify-between text-[11.5px]" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                        <span style={{ color: T.textMuted }}>Next due</span>
                        <span className="font-semibold" style={{ color: cell.overdue ? C.alert : T.textPrimary }}>
                          {cell.nextDueOn ? longDate(cell.nextDueOn) : "—"}
                          {cell.overdue && cell.daysToDue !== null ? ` (${Math.abs(cell.daysToDue)}d overdue)` : ""}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: cell.certificate ? T.textSecondary : T.textMuted }}>
                        <FileText size={12} />
                        {cell.certificate ? `${rule.certificate} available${rule.sticker ? " (with sticker)" : ""}` : "No certificate on file yet"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
