"use client";

/**
 * Shared shell pieces for the OPD Wallet Analytics section.
 *
 * These mirror the card / stat / insight vocabulary the Compliance page
 * established, pulled out here because four dashboards share them.
 */

import { useState } from "react";
import { Info, Maximize2, Minimize2, ChevronDown } from "lucide-react";

import { T } from "@/lib/ui/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AskAIButton } from "@/components/ai/AskAIButton";

/** One accent carries the section; rose is kept for things that need action. */
export const C = {
  accent: "#4f46e5",
  accentMid: "#818cf8",
  accentPale: "#c7d2fe",
  accentWash: "#eef2ff",
  teal: "#0d9488",
  violet: "#7c3aed",
  alert: "#e11d48",
  grey: "#d4d4d8",
};

/** Donut / bar series colours — the house palette, ordered for contrast. */
export const SERIES = [
  "#4f46e5", "#0d9488", "#8b5cf6", "#14b8a6", "#6366f1",
  "#a78bfa", "#06b6d4", "#818cf8", "#34d399", "#c4b5fd",
  "#0891b2", "#4338ca",
];

export function AccentBar({ color = C.accent }: { color?: string }) {
  return <div className="w-10 h-1 rounded-sm mb-3.5" style={{ background: color }} />;
}

/* ─── Card ─────────────────────────────────────────────────────────────── */

export function WalletCard({
  children,
  className = "",
  accentColor,
  title,
  subtitle,
  tooltipText,
  expandable = true,
  rightHeader,
  chartData,
  chartDescription,
}: {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  title?: string;
  subtitle?: string;
  tooltipText?: string;
  expandable?: boolean;
  rightHeader?: React.ReactNode;
  chartData?: unknown;
  chartDescription?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={cn(
        "bg-white rounded-2xl overflow-hidden transition-all h-full flex flex-col",
        expanded && "col-span-full",
        className
      )}
      style={{ border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
    >
      {(title || accentColor) && (
        <div className="px-6 pt-5 pb-1">
          {accentColor && <AccentBar color={accentColor} />}
          {title && (
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[15px] font-bold" style={{ color: T.textPrimary }}>
                    {title}
                  </h3>
                  {tooltipText && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={13} style={{ color: T.textMuted }} />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        {tooltipText}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {subtitle && (
                  <p className="text-[12px] mt-0.5" style={{ color: T.textSecondary }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {!!chartData && (
                  <AskAIButton title={title} description={chartDescription} data={chartData} />
                )}
                {rightHeader}
                {expandable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    style={{ color: T.textMuted }}
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div data-chart-body className="px-6 pb-5 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

/* ─── Stat tile ────────────────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  sub,
  color = C.accent,
  icon,
  tooltip,
  onClick,
  active,
  compact,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl overflow-hidden transition-all h-full flex flex-col",
        onClick && "cursor-pointer hover:-translate-y-px"
      )}
      style={{
        border: `1px solid ${active ? color : T.border}`,
        boxShadow: active ? `0 0 0 3px ${color}22, ${T.cardShadow}` : T.cardShadow,
      }}
    >
      <div className={cn("flex-1 flex flex-col", compact ? "px-4 pt-4 pb-3.5" : "px-6 pt-6 pb-5")}>
        <div className="flex items-center gap-1.5">
          {icon && <span style={{ color: T.textMuted }}>{icon}</span>}
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.08em] leading-tight"
            style={{ color: T.textMuted }}
          >
            {label}
          </p>
          {tooltip && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex items-center" onClick={(e) => e.stopPropagation()}>
                  <Info size={13} style={{ color: T.textMuted }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="text-xs max-w-xs" side="top">
                {tooltip}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <p
          className={cn(
            "font-extrabold mt-2.5 leading-none tracking-[-0.02em]",
            compact ? "text-[26px]" : "text-[34px]"
          )}
          style={{ color }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11.5px] mt-2" style={{ color: T.textSecondary }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Insight ──────────────────────────────────────────────────────────── */

export function InsightBox({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("mt-auto pt-4", className)}>
      <div
        className="rounded-[14px] px-4 py-3 text-[12px] leading-relaxed"
        style={{ backgroundColor: C.accentWash, border: `1px solid ${C.accentPale}`, color: "#3730a3" }}
      >
        {text}
      </div>
    </div>
  );
}

/* ─── Tab strip ────────────────────────────────────────────────────────── */

export function TabStrip({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5"
      style={{ backgroundColor: T.white, border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-150",
              isActive ? "text-white" : "hover:bg-[#F5F6FA]"
            )}
            style={
              isActive
                ? { backgroundColor: C.accent, boxShadow: "0 2px 8px rgba(79,70,229,0.28)" }
                : { color: T.textSecondary }
            }
          >
            {tab.label}
            {tab.count && (
              <span
                className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={
                  isActive
                    ? { backgroundColor: "rgba(255,255,255,0.22)", color: "#fff" }
                    : { backgroundColor: C.accentWash, color: C.accent }
                }
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Toolbar ──────────────────────────────────────────────────────────── */

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 flex-wrap px-5 py-3.5 rounded-2xl"
      style={{ backgroundColor: T.white, border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
    >
      {children}
    </div>
  );
}

export function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
  width = 200,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="h-9 inline-flex items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors hover:bg-[#F5F6FA]"
          style={{ borderColor: T.border, color: selected.length ? C.accent : T.textSecondary }}
        >
          {label}
          {selected.length > 0 && (
            <span
              className="rounded-full px-1.5 text-[10px] font-bold"
              style={{ backgroundColor: C.accentWash, color: C.accent }}
            >
              {selected.length}
            </span>
          )}
          <ChevronDown size={13} style={{ color: T.textMuted }} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width }} align="start">
        <ScrollArea className="max-h-64">
          <div className="p-1.5">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => toggle(option)}
                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-[#F5F6FA]"
                style={{ color: T.textPrimary }}
              >
                <Checkbox checked={selected.includes(option)} className="pointer-events-none" />
                <span className="truncate">{option}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <div className="border-t p-1.5" style={{ borderColor: T.borderLight }}>
            <button
              onClick={() => onChange([])}
              className="w-full rounded-md px-2 py-1.5 text-left text-[12px] font-medium hover:bg-[#F5F6FA]"
              style={{ color: C.alert }}
            >
              Clear {label.toLowerCase()}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Chips ────────────────────────────────────────────────────────────── */

export function FilterChips({
  chips,
  onClearAll,
}: {
  chips: { key: string; value: string; clear: () => void }[];
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <span
          key={`${chip.key}-${chip.value}`}
          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium"
          style={{ border: `1px solid ${C.accentPale}`, color: C.accent, backgroundColor: C.accentWash }}
        >
          <span style={{ color: T.textMuted }}>{chip.key}:</span> {chip.value}
          <button
            onClick={chip.clear}
            className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-white"
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-[11px] font-medium ml-1 hover:underline"
        style={{ color: T.coral }}
      >
        Clear all
      </button>
    </div>
  );
}

/* ─── Table ────────────────────────────────────────────────────────────── */

export interface Column<Row> {
  key: string;
  header: string;
  align?: "left" | "right";
  width?: number;
  render: (row: Row) => React.ReactNode;
}

export function DataTable<Row>({
  columns,
  rows,
  getKey,
  emptyLabel = "No rows match the current filters.",
  maxHeight = 420,
}: {
  columns: Column<Row>[];
  rows: Row[];
  getKey: (row: Row, index: number) => string;
  emptyLabel?: string;
  maxHeight?: number;
}) {
  return (
    <div
      className="overflow-auto rounded-xl"
      style={{ border: `1px solid ${T.border}`, maxHeight }}
    >
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-10">
          <tr style={{ backgroundColor: C.accentWash }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2.5 font-bold whitespace-nowrap",
                  col.align === "right" ? "text-right" : "text-left"
                )}
                style={{ color: "#3730a3", borderBottom: `1px solid ${C.accentPale}`, minWidth: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-[12.5px]"
                style={{ color: T.textMuted }}
              >
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={getKey(row, i)} className="hover:bg-[#F8F9FC]">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-3 py-2 whitespace-nowrap",
                    col.align === "right" ? "text-right tabular-nums" : "text-left"
                  )}
                  style={{ color: T.textSecondary, borderBottom: `1px solid ${T.borderLight}` }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (next: number) => void;
}) {
  if (pageCount <= 1) {
    return (
      <p className="mt-3 text-[11.5px]" style={{ color: T.textMuted }}>
        {total.toLocaleString("en-IN")} rows
      </p>
    );
  }
  return (
    <div className="mt-3 flex items-center justify-between">
      <p className="text-[11.5px]" style={{ color: T.textMuted }}>
        Page {page + 1} of {pageCount} · {total.toLocaleString("en-IN")} rows
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[12px]"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[12px]"
          disabled={page >= pageCount - 1}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/* ─── Status pill ──────────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  SETTLED: { bg: "#ecfdf5", fg: "#047857" },
  APPROVED: { bg: "#ecfdf5", fg: "#047857" },
  CLOSED: { bg: "#eef2ff", fg: "#4338ca" },
  REJECTED: { bg: "#fff1f2", fg: "#be123c" },
  "NEFT REJECTED": { bg: "#fff1f2", fg: "#be123c" },
  "PENDING(DD)": { bg: "#fff7ed", fg: "#c2410c" },
  "DOCUMENTS DEFICIENT": { bg: "#fff7ed", fg: "#c2410c" },
  "QC CHECK": { bg: "#f5f3ff", fg: "#6d28d9" },
  "SENT IN DEBIT NOTE": { bg: "#f0fdfa", fg: "#0f766e" },
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? { bg: "#f4f4f5", fg: "#52525b" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.03em]"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {status}
    </span>
  );
}

/* ─── Legend ───────────────────────────────────────────────────────────── */

export function Legend({
  items,
}: {
  items: { name: string; value: string; color: string }[];
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-[11.5px] truncate" style={{ color: T.textSecondary }}>
            {item.name}
          </span>
          <span className="ml-auto text-[11.5px] font-semibold tabular-nums" style={{ color: T.textPrimary }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Ranked bar list (used where a chart would be overkill) ──────────── */

export function RankedBars({
  items,
  format = (n: number) => n.toLocaleString("en-IN"),
  color = C.accent,
}: {
  items: { name: string; value: number }[];
  format?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div key={item.name}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] truncate" style={{ color: T.textSecondary }}>
              {item.name}
            </span>
            <span className="text-[12px] font-semibold tabular-nums shrink-0" style={{ color: T.textPrimary }}>
              {format(item.value)}
            </span>
          </div>
          <div className="mt-1 h-[6px] rounded-full" style={{ backgroundColor: "#F1F2F6" }}>
            <div
              className="h-[6px] rounded-full transition-all"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
