"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Building2, Info, Stethoscope } from "lucide-react";

import { cn } from "@/lib/utils";
import { PageDownload } from "@/components/shared/PageDownload";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AGE_BANDS,
  GENDERS,
  LOCATIONS,
  TIERS,
  TIER_BY_KEY,
  FUNCTIONS,
  DISEASES,
  COHORT,
  WORKFORCE,
  MIN_GROUP_TO_SHOW,
  countBy,
  totalCounts,
  emptyCounts,
  headcountBy,
  expectedByFunction,
  standing,
  tierFor,
  fnName,
  diseaseByKey,
  type Employee,
  type Person,
  type Standing,
  type TierCounts,
  type TierKey,
} from "@/lib/data/ohc-risk-cohorts";

/* ─── Look: the corporate health dashboard's palette ───────────────────── */

const P = {
  ink: "#1B1B1F",
  body: "#3F3F46",
  quiet: "#6B6B76",
  line: "#DCDCE2",
  purple: "#4F3E96",
  deep: "#43357A",
  mid: "#7B68B5",
  lilac: "#B5A9D6",
  panel: "#EFEDF8",
  sand: "#F1DCC0",
  cream: "#FCF3EE",
  rose: "#D9A0A0",
  track: "#EBEBEB",
  good: "#5C9E31",
};

/* ─── Formatting ───────────────────────────────────────────────────────── */

const nf = (n: number) => n.toLocaleString("en-IN");
const share = (n: number, base: number) => (base > 0 ? (n / base) * 100 : 0);
const pct = (v: number) => (v > 0 && v < 10 ? `${v.toFixed(1)}%` : `${Math.round(v)}%`);
const oneIn = (v: number) => (v > 0 ? `about 1 in ${Math.max(2, Math.round(100 / v))}` : "none");
/** A group this small is not broken down, so no one can be singled out. */
const tooFew = (n: number) => n > 0 && n < MIN_GROUP_TO_SHOW;
/** A level inside a shown group is only rounded off when tiny. */
const smallCount = (n: number) => (n === 0 ? "—" : n < 5 ? "<5" : nf(n));

type View = "condition" | "function";
type Dim = "age" | "gender" | "location";

const DIMS: { key: Dim; label: string; values: readonly string[]; of: (p: Person) => string }[] = [
  { key: "gender", label: "Gender", values: GENDERS, of: (p) => p.gender },
  { key: "age", label: "Age", values: AGE_BANDS, of: (p) => p.age },
  { key: "location", label: "Location", values: LOCATIONS, of: (p) => p.location },
];

const STANDING_LABEL: Record<Standing, string> = {
  higher: "Higher than company average",
  similar: "Similar to company",
  lower: "Lower than company average",
  few: "Too few to compare",
};

/* ─── Building blocks ──────────────────────────────────────────────────── */

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-[20px] bg-white p-6", className)} style={{ border: `1px solid ${P.line}` }}>
      {children}
    </div>
  );
}

function CardTitle({ children, hint, right }: { children: React.ReactNode; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-[19px] font-semibold tracking-[-0.01em]" style={{ color: P.ink }}>
        {children}
        {hint && (
          <Tooltip>
            <TooltipTrigger>
              <Info size={15} style={{ color: P.quiet }} />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {hint}
            </TooltipContent>
          </Tooltip>
        )}
      </h3>
      {right}
    </div>
  );
}

/** The purple pill toggle used on the reference dashboard. */
function Toggle<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-white p-[3px]" style={{ border: `1px solid ${P.line}` }}>
      {options.map((o) => (
        <button
          key={o.key}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className="rounded-full px-4 py-1 text-[12.5px] font-semibold transition-colors"
          style={value === o.key ? { backgroundColor: P.purple, color: "#fff" } : { color: P.quiet }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Dropdown({
  label,
  value,
  onChange,
  options,
  width,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; count?: string }[];
  width: number;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="!h-10 rounded-xl bg-white px-3.5 text-[14px] font-medium"
        style={{ width, color: P.ink, borderColor: P.line }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span className="flex w-full items-center justify-between gap-6">
              <span>{o.label}</span>
              {o.count && (
                <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: P.quiet }}>
                  {o.count}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TierPill({ tier, children }: { tier: TierKey; children?: React.ReactNode }) {
  const t = TIER_BY_KEY[tier];
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-center text-[12px] font-semibold leading-tight"
      style={{ backgroundColor: t.wash, color: t.ink }}
    >
      {children ?? t.label}
    </span>
  );
}

function TierLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
      {TIERS.map((t) => (
        <span key={t.key} className="inline-flex items-center gap-2 text-[13px]" style={{ color: P.body }}>
          <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: t.color }} />
          {t.label}
        </span>
      ))}
    </div>
  );
}

/* ─── Headline: share living with the selection ────────────────────────── */

function Headline({
  title,
  value,
  company,
  status,
  note,
}: {
  title: string;
  value: number;
  /** Company share to mark on the scale; null when the selection is the company. */
  company: number | null;
  status: Standing | "company";
  note: string;
}) {
  const top = Math.max(50, Math.ceil(Math.max(value, company ?? 0) / 10) * 10 + 10);
  const tone = status === "higher" ? "#C0504D" : status === "lower" ? P.good : P.purple;
  return (
    <Card className="h-full">
      <CardTitle hint="Share of the selected group living with the selected condition. Women-only conditions are measured against women.">
        {title}
      </CardTitle>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(170px,2fr)_3fr]">
        <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: P.panel }}>
          <div className="flex items-baseline gap-1">
            <span className="text-[40px] font-bold leading-none tracking-[-0.02em]" style={{ color: tone }}>
              {value > 0 && value < 10 ? value.toFixed(1) : Math.round(value)}
            </span>
            <span className="text-[17px]" style={{ color: P.quiet }}>
              /100
            </span>
          </div>
          <div className="relative mt-3 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${P.good}, #E7C14B, #E08A4F, #C0504D)` }}>
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
              style={{ left: `${Math.min(100, (value / top) * 100)}%`, backgroundColor: tone }}
            />
            {company !== null && (
              <span
                className="absolute -top-1.5 -bottom-1.5 w-0"
                style={{ left: `${Math.min(100, (company / top) * 100)}%`, borderLeft: `2px dashed ${P.ink}` }}
              />
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums" style={{ color: P.quiet }}>
            <span>0</span>
            <span>{top / 2}</span>
            <span>{top}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold" style={{ backgroundColor: P.panel, color: P.ink }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone }} />
            {status === "company" ? "Company-wide" : STANDING_LABEL[status]}
          </div>
          <p className="mt-2.5 text-[13.5px] italic leading-snug" style={{ color: P.body }}>
            {note}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ─── Care funnel ──────────────────────────────────────────────────────── */

function CareFunnel({ stages }: { stages: { label: string; value: number }[] }) {
  const W = 600;
  const H = 230;
  const mid = H / 2;
  const first = Math.max(1, stages[0].value);
  const half = stages.map((s) => Math.max(5, (s.value / first) * (H / 2 - 6)));
  const col = W / stages.length;
  const cx = stages.map((_, i) => col * i + col / 2);

  /* One smooth edge through the stage centres; mirrored for the other side. */
  const edge = (sign: 1 | -1) => {
    const y = (i: number) => (mid + sign * half[i]).toFixed(1);
    let d = `0,${y(0)} L${cx[0]},${y(0)}`;
    for (let i = 1; i < stages.length; i++) {
      const bend = (cx[i] - cx[i - 1]) / 2;
      d += ` C${cx[i - 1] + bend},${y(i - 1)} ${cx[i] - bend},${y(i)} ${cx[i]},${y(i)}`;
    }
    return `${d} L${W},${y(stages.length - 1)}`;
  };
  /* Walk the lower edge back by rebuilding it right-to-left. */
  const back = (() => {
    const y = (i: number) => (mid + half[i]).toFixed(1);
    const last = stages.length - 1;
    let d = `L${W},${y(last)} L${cx[last]},${y(last)}`;
    for (let i = last; i > 0; i--) {
      const bend = (cx[i] - cx[i - 1]) / 2;
      d += ` C${cx[i] - bend},${y(i)} ${cx[i - 1] + bend},${y(i - 1)} ${cx[i - 1]},${y(i - 1)}`;
    }
    return `${d} L0,${y(0)} Z`;
  })();

  return (
    <div className="mt-4 overflow-hidden rounded-2xl" style={{ backgroundColor: P.cream }}>
      <div className="relative">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
          {stages.map((s, i) => (
            <div key={s.label} className="px-4 pt-4" style={{ borderLeft: i ? `1px solid ${P.sand}` : undefined }}>
              <p className="text-[13px] tabular-nums" style={{ color: P.body }}>
                {nf(s.value)}
              </p>
              <p className="text-[14px] font-semibold leading-tight" style={{ color: P.ink }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" preserveAspectRatio="none" style={{ height: 230 }}>
          <path d={`M${edge(-1)} ${back}`} fill={P.sand} />
          {stages.slice(1).map((_, i) => (
            <line key={i} x1={col * (i + 1)} x2={col * (i + 1)} y1={0} y2={H} stroke="#E3C9A6" strokeWidth={1} />
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 pb-4 pt-1">
        {stages.map((s, i) => (
          <span key={s.label} className="inline-flex items-center gap-2 text-[13px] tabular-nums" style={{ color: P.body }}>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: i === 0 ? "#EBCB9F" : P.sand }} />
            {nf(s.value)} : ({i === 0 ? "100%" : pct(share(s.value, stages[i - 1].value))})
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Bubbles: who is affected ─────────────────────────────────────────── */

const BUBBLE_FILL = [P.deep, P.sand, P.mid, P.lilac, P.rose];
const BUBBLE_TEXT = ["#fff", P.ink, "#fff", P.ink, P.ink];

/** Greedy packing: each circle goes as close to the middle as it can without overlapping. */
function pack(radii: number[]) {
  const placed: { x: number; y: number; r: number }[] = [];
  radii.forEach((r, i) => {
    if (i === 0) return void placed.push({ x: 0, y: 0, r });
    let best: { x: number; y: number; d: number } | null = null;
    for (const p of placed) {
      for (let a = 0; a < 360; a += 6) {
        const rad = (a * Math.PI) / 180;
        const x = p.x + Math.cos(rad) * (p.r + r + 3);
        const y = p.y + Math.sin(rad) * (p.r + r + 3) * 0.92;
        if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + r + 2.5)) continue;
        const d = Math.hypot(x, y * 1.35);
        if (!best || d < best.d) best = { x, y, d };
      }
    }
    placed.push({ x: best?.x ?? 0, y: best?.y ?? 0, r });
  });
  return placed;
}

function Bubbles({ items }: { items: { label: string; value: number; share: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const order = items.map((it, i) => ({ ...it, i })).sort((a, b) => b.value - a.value);
  const circles = pack(order.map((o) => Math.max(20, Math.sqrt(o.value / max) * 92)));
  const minX = Math.min(...circles.map((c) => c.x - c.r));
  const maxX = Math.max(...circles.map((c) => c.x + c.r));
  const minY = Math.min(...circles.map((c) => c.y - c.r));
  const maxY = Math.max(...circles.map((c) => c.y + c.r));
  const r2 = (n: number) => Math.round(n * 10) / 10;
  return (
    <svg
      viewBox={`${r2(minX - 6)} ${r2(minY - 6)} ${r2(maxX - minX + 12)} ${r2(maxY - minY + 12)}`}
      className="mx-auto block h-[290px] w-full max-w-[420px]"
      role="img"
      aria-label="Share of affected employees by group"
    >
      {circles.map((c, k) => {
        const o = order[k];
        return (
          <g key={o.label}>
            <circle cx={r2(c.x)} cy={r2(c.y)} r={r2(c.r)} fill={BUBBLE_FILL[o.i % BUBBLE_FILL.length]} />
            <text
              x={r2(c.x)}
              y={r2(c.y)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={r2(Math.max(10, c.r * 0.42))}
              fontWeight={600}
              fill={BUBBLE_TEXT[o.i % BUBBLE_TEXT.length]}
            >
              {Math.round(o.share)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Grey-track bar chart ─────────────────────────────────────────────── */

interface BarItem {
  key: string;
  label: string;
  note?: string;
  people: number;
  base: number;
  rate: number;
  c: TierCounts;
  standing: Standing;
  extra: number;
  /** Company share for this same item, drawn as a tick on its bar. */
  reference?: number;
}

function CompareBars({
  items,
  selected,
  onSelect,
  line,
}: {
  items: BarItem[];
  selected: string | null;
  onSelect: (key: string) => void;
  /** One company-average line across every bar. */
  line?: number;
}) {
  const H = 300;
  const peak = Math.max(1, ...items.map((i) => Math.max(i.rate, i.reference ?? 0)), line ?? 0);
  const step = peak > 40 ? 20 : peak > 20 ? 10 : peak > 8 ? 5 : 2;
  const top = Math.ceil((peak * 1.25) / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const y = (v: number) => (v / top) * H;

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex" style={{ minWidth: Math.max(640, items.length * 104 + 56) }}>
        <div className="relative w-12 shrink-0" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 -translate-y-1/2 text-[12px] tabular-nums" style={{ bottom: y(t) - 8, color: P.quiet }}>
              {t}%
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* grid */}
          <div className="absolute inset-x-0 top-0" style={{ height: H }}>
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0" style={{ bottom: y(t), borderTop: `1px solid ${t === 0 ? "#BDBDC4" : "#EFEFF2"}` }} />
            ))}
            {line !== undefined && (
              <div className="absolute inset-x-0 z-10" style={{ bottom: y(line), borderTop: `2px dashed ${P.ink}` }}>
                <span className="absolute right-0 -top-5 rounded bg-white px-1 text-[11.5px] font-semibold" style={{ color: P.ink }}>
                  Company {pct(line)}
                </span>
              </div>
            )}
          </div>
          {/* bars */}
          <div className="relative flex">
            {items.map((it) => {
              const hidden = tooFew(it.people);
              const active = selected === it.key;
              return (
                <button
                  key={it.key}
                  aria-pressed={active}
                  onClick={() => onSelect(it.key)}
                  className="group flex flex-1 flex-col items-center rounded-xl pb-2 outline-none transition-colors hover:bg-[#FAF8FF] focus-visible:ring-2 focus-visible:ring-[#4F3E96]"
                  style={{ minWidth: 96, backgroundColor: active ? P.panel : undefined }}
                >
                  <div className="relative w-11" style={{ height: H, backgroundColor: P.track }}>
                    {!hidden && it.people > 0 && (
                      <>
                        <div className="absolute inset-x-0 bottom-0 flex flex-col" style={{ height: y(it.rate) }}>
                          {TIERS.map((t) =>
                            it.c[t.key] > 0 ? (
                              <div key={t.key} style={{ flexGrow: it.c[t.key], backgroundColor: t.color }} />
                            ) : null
                          )}
                        </div>
                        <span
                          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[13px] font-bold tabular-nums"
                          style={{ bottom: y(it.rate) + 5, color: P.ink }}
                        >
                          {pct(it.rate)}
                        </span>
                      </>
                    )}
                    {it.reference !== undefined && !hidden && (
                      <div className="absolute -inset-x-2 z-10" style={{ bottom: y(it.reference), borderTop: `2px dashed ${P.ink}` }} />
                    )}
                  </div>
                  <span className="mt-2 text-[13.5px] tabular-nums" style={{ color: P.ink }}>
                    {hidden ? "Too few to show" : `${nf(it.people)} / ${nf(it.base)}`}
                  </span>
                  <span
                    className="mt-0.5 max-w-[120px] text-center text-[13px] leading-tight"
                    style={{ color: active ? P.purple : P.quiet, fontWeight: active ? 700 : 400 }}
                  >
                    {it.label}
                  </span>
                  {it.note && (
                    <span className="max-w-[120px] text-center text-[11px] leading-tight" style={{ color: P.quiet }}>
                      {it.note}
                    </span>
                  )}
                  {!hidden && (it.standing === "higher" || it.standing === "lower") && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="mt-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
                          style={
                            it.standing === "higher"
                              ? { backgroundColor: TIER_BY_KEY.high.wash, color: TIER_BY_KEY.high.ink }
                              : { backgroundColor: "#E3F1D8", color: "#35651B" }
                          }
                        >
                          {it.standing === "higher" ? "Higher than company" : "Lower than company"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        About {nf(Math.abs(Math.round(it.extra)))} {it.extra > 0 ? "more" : "fewer"} people than a team
                        with the same age and gender mix would have.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Body map: where each condition sits ──────────────────────────────── */

/** Marker position on the figure, in % of its width and height, and which side its card sits on. */
const BODY_SPOTS: Record<string, { x: number; y: number; side: "left" | "right" }> = {
  thyroid: { x: 50, y: 15, side: "left" },
  cld: { x: 43, y: 31, side: "left" },
  anaemia: { x: 21, y: 36, side: "left" },
  pcos: { x: 49, y: 45.5, side: "left" },
  msk: { x: 38, y: 68.5, side: "left" },
  htn: { x: 56, y: 23, side: "right" },
  dys: { x: 58, y: 26.5, side: "right" },
  dm: { x: 55, y: 33.5, side: "right" },
  prediab: { x: 51, y: 35.5, side: "right" },
  obesity: { x: 58, y: 40.5, side: "right" },
};

const ORGANS = [
  { src: "/risk-cohorts/thyroid.png", x: 50, y: 15.2, w: 5 },
  { src: "/risk-cohorts/heart.png", x: 55.5, y: 24.5, w: 13 },
  { src: "/risk-cohorts/liver.png", x: 44, y: 31, w: 21 },
  { src: "/risk-cohorts/pancreas.svg", x: 53.5, y: 34.8, w: 12 },
];

function BodyMap({
  items,
  selected,
  onSelect,
}: {
  items: { key: string; label: string; note?: string; c: TierCounts }[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const FIG_W = 300;
  /* The figure is 540×1070; the card columns need more height than it does. */
  const FIG_H = 594;
  const H = 720;
  const TOP = (H - FIG_H) / 2;
  const GUTTER = 70;
  const byKey = new Map(items.map((i) => [i.key, i]));
  const sides = (["left", "right"] as const).map((side) =>
    Object.entries(BODY_SPOTS)
      .filter(([k, s]) => s.side === side && byKey.has(k))
      .sort((a, b) => a[1].y - b[1].y)
      .map(([k, s], i, all) => ({ key: k, spot: s, cy: (H / all.length) * (i + 0.5) }))
  );

  const card = (key: string) => {
    const it = byKey.get(key)!;
    const hidden = tooFew(it.c.total);
    const serious = share(it.c.high + it.c.moderate, it.c.total);
    const active = selected === key;
    return (
      <button
        aria-pressed={active}
        onClick={() => onSelect(key)}
        className="w-full rounded-2xl bg-white px-4 py-3 text-left transition-shadow hover:shadow-md"
        style={{ border: `1.5px solid ${active ? P.purple : P.line}`, backgroundColor: active ? "#FAF8FF" : "#fff" }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14.5px] font-semibold" style={{ color: P.ink }}>
            {it.label}
          </span>
          <span className="shrink-0 truncate text-[11.5px]" style={{ color: P.quiet }}>
            {it.note}
          </span>
        </div>
        <span className="mt-1 inline-block rounded-md px-2 py-0.5 text-[12px] font-medium" style={{ backgroundColor: P.panel, color: P.ink }}>
          {hidden ? "Too few to show" : `${nf(it.c.total)} Employees`}
        </span>
        {!hidden && it.c.total > 0 && (
          <>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#F6DEC6" }}>
              <div style={{ width: `${serious}%`, backgroundColor: "#E9B4B4" }} />
            </div>
            <div className="mt-1 flex justify-between text-[11.5px]" style={{ color: P.quiet }}>
              <span>High/Moderate Risk</span>
              <span>Early/Stable</span>
            </div>
            <div className="flex justify-between text-[13.5px] tabular-nums" style={{ color: P.ink }}>
              <span>{Math.round(serious)}%</span>
              <span>{100 - Math.round(serious)}%</span>
            </div>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="mx-auto grid items-stretch" style={{ gridTemplateColumns: `1fr ${FIG_W + GUTTER * 2}px 1fr`, minWidth: 980, maxWidth: 1180 }}>
        <div className="flex flex-col justify-around gap-2" style={{ height: H }}>
          {sides[0].map((s) => (
            <div key={s.key}>{card(s.key)}</div>
          ))}
        </div>
        <div className="relative" style={{ height: H }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/risk-cohorts/body.png" alt="" className="absolute" style={{ left: GUTTER, top: TOP, width: FIG_W, height: FIG_H }} />
          {ORGANS.map((o) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={o.src}
              src={o.src}
              alt=""
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: GUTTER + (o.x / 100) * FIG_W, top: TOP + (o.y / 100) * FIG_H, width: (o.w / 100) * FIG_W }}
            />
          ))}
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${FIG_W + GUTTER * 2} ${H}`}>
            {sides.flatMap((list, si) =>
              list.map((s) => {
                const x = GUTTER + (s.spot.x / 100) * FIG_W;
                const y = TOP + (s.spot.y / 100) * FIG_H;
                const active = selected === s.key;
                return (
                  <g key={s.key}>
                    <line
                      x1={x}
                      y1={y}
                      x2={si === 0 ? 0 : FIG_W + GUTTER * 2}
                      y2={s.cy}
                      stroke={active ? P.purple : P.mid}
                      strokeWidth={active ? 2 : 1.4}
                      strokeDasharray="5 5"
                    />
                    <circle cx={x} cy={y} r={active ? 7.5 : 6} fill={P.deep} stroke="#fff" strokeWidth={1.5} />
                  </g>
                );
              })
            )}
          </svg>
        </div>
        <div className="flex flex-col justify-around gap-2" style={{ height: H }}>
          {sides[1].map((s) => (
            <div key={s.key}>{card(s.key)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Risk levels ──────────────────────────────────────────────────────── */

function RiskLevels({ affected, disease, showChange }: { affected: Employee[]; disease: string | null; showChange: boolean }) {
  const c = totalCounts(affected, disease);
  const reached = emptyCounts();
  let wasHigh = 0;
  for (const e of affected) {
    const t = tierFor(e, disease);
    if (!t) continue;
    if (e.followedUp) reached[t]++;
    if (e.wasHigh) wasHigh++;
  }
  const change = c.high - wasHigh;

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {TIERS.map((t) => {
        const n = c[t.key];
        const hidden = n > 0 && n < 5;
        const done = share(reached[t.key], n);
        return (
          <div key={t.key} className="rounded-2xl p-4" style={{ border: `1px solid ${P.line}` }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[15px] font-semibold" style={{ color: P.ink }}>
                {t.label}
              </p>
              <p className="text-right text-[12.5px]" style={{ color: P.body }}>
                {pct(share(n, c.total))} of affected
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-md px-2 py-0.5 text-[12.5px] font-medium" style={{ backgroundColor: P.panel, color: P.ink }}>
                {hidden ? "<5" : nf(n)} Employees
              </span>
              {t.key === "high" && showChange && !hidden && change !== 0 && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                  style={change < 0 ? { backgroundColor: "#E3F1D8", color: "#35651B" } : { backgroundColor: t.wash, color: t.ink }}
                >
                  {change < 0 ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                  {nf(Math.abs(change))} vs last quarter
                </span>
              )}
            </div>
            <p className="mt-2 text-[12.5px]" style={{ color: P.quiet }}>
              {t.means}
            </p>
            {t.coverage && !hidden && n > 0 ? (
              <>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#F3E3D0" }}>
                  <div style={{ width: `${done}%`, backgroundColor: t.color }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[12px]" style={{ color: P.quiet }}>
                  <span className="capitalize">{t.coverage.split(" in the ")[0]}</span>
                  <span>Yet to reach</span>
                </div>
                <div className="flex justify-between text-[14px] tabular-nums" style={{ color: P.ink }}>
                  <span>
                    {Math.round(done)}% <span style={{ color: P.quiet }}>({nf(reached[t.key])})</span>
                  </span>
                  <span>{100 - Math.round(done)}%</span>
                </div>
              </>
            ) : (
              <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: t.color }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Areas of concern: the largest age and gender groups per level ────── */

function AreasOfConcern({ affected, disease }: { affected: Employee[]; disease: string | null }) {
  const total = totalCounts(affected, disease).total;
  const groups = (() => {
    const m = new Map<string, { gender: string; age: string; c: TierCounts }>();
    for (const e of affected) {
      const t = tierFor(e, disease);
      if (!t) continue;
      const k = `${e.gender}|${e.age}`;
      let g = m.get(k);
      if (!g) m.set(k, (g = { gender: e.gender, age: e.age, c: emptyCounts() }));
      g.c[t]++;
      g.c.total++;
    }
    return [...m.values()];
  })();

  const rows = TIERS.filter((t) => t.key !== "stable").map((t) => ({
    tier: t,
    count: groups.reduce((s, g) => s + g.c[t.key], 0),
    cards: groups
      .filter((g) => g.c[t.key] >= MIN_GROUP_TO_SHOW)
      .sort((a, b) => b.c[t.key] - a.c[t.key])
      .slice(0, 6),
  }));

  return (
    <div className="mt-4 space-y-5 rounded-2xl p-5" style={{ backgroundColor: P.panel }}>
      {rows.map(({ tier, count, cards }) => (
        <div key={tier.key}>
          <p className="text-[15.5px] font-semibold" style={{ color: P.ink }}>
            {tier.label} ({count > 0 && count < 5 ? "<5" : nf(count)} Employees)
          </p>
          {cards.length === 0 ? (
            <p className="mt-2 rounded-xl bg-white px-4 py-4 text-[13px]" style={{ color: P.quiet }}>
              Too few people in any one age and gender group to show.
            </p>
          ) : (
            <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
              {cards.map((g) => (
                <div
                  key={`${g.gender}${g.age}`}
                  className="grid shrink-0 items-center gap-3 rounded-xl bg-white px-4 py-3.5"
                  style={{ gridTemplateColumns: "auto 1fr auto", minWidth: 318 }}
                >
                  <div>
                    <p className="text-[24px] font-bold leading-none tabular-nums" style={{ color: P.ink }}>
                      {share(g.c[tier.key], total).toFixed(1)}
                      <span className="text-[14px]">%</span>
                    </p>
                    <p className="mt-1 text-[12.5px] tabular-nums" style={{ color: P.quiet }}>
                      EMP ({nf(g.c[tier.key])})
                    </p>
                  </div>
                  <div className="text-[14px] leading-snug" style={{ color: P.body }}>
                    <p>{g.gender}</p>
                    <p>Age: {g.age}</p>
                  </div>
                  <TierPill tier={tier.key} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

const ALL = "all";

export default function RiskCohortsPage() {
  const [view, setView] = useState<View>("condition");
  const [disease, setDisease] = useState<string | null>(null);
  /* The function picked as a filter; null means every function. */
  const [fnSel, setFnSel] = useState<string | null>(null);
  /* The By Function tab always needs a team, so it falls back to one. */
  const fnKey = fnSel ?? "sales";
  const [location, setLocation] = useState<string | null>(null);
  const [dim, setDim] = useState<Dim>("age");
  const [sort, setSort] = useState<"rate" | "people">("rate");

  /* Everyone, and everyone with a chronic condition, in the selected location. */
  const wf = useMemo(() => (location ? WORKFORCE.filter((p) => p.location === location) : WORKFORCE), [location]);
  const people = useMemo(() => (location ? COHORT.filter((e) => e.location === location) : COHORT), [location]);

  const dInfo = disease ? diseaseByKey(disease) ?? null : null;
  const womenOnly = !!dInfo?.womenOnly;
  /** "Dyslipidemia (high cholesterol)" — the official name first, everyday wording after. */
  const dLabel = dInfo ? (dInfo.plain ? `${dInfo.name} (${dInfo.plain})` : dInfo.name) : "a chronic condition";
  const dShort = dInfo ? dInfo.name : "chronic care";

  /* ── Company figures for the condition in view ── */
  const company = useMemo(() => totalCounts(people, disease), [people, disease]);
  const women = useMemo(() => wf.filter((p) => p.gender === "Female").length, [wf]);
  const companyShare = share(company.total, womenOnly ? women : wf.length);

  /*
   * The selection in view: the chosen condition, narrowed to the chosen
   * function when there is one. Every card below reads from this, so picking
   * Dyslipidemia and then Sales shows Dyslipidemia in Sales everywhere.
   */
  const fnScope = view === "condition" ? fnSel : fnKey;
  const focusName = fnScope ? fnName(fnScope) : null;
  const focus = useMemo(() => (fnScope ? people.filter((e) => e.fn === fnScope) : people), [people, fnScope]);
  const focusWf = useMemo(() => (fnScope ? wf.filter((p) => p.fn === fnScope) : wf), [wf, fnScope]);
  const focusCounts = useMemo(() => totalCounts(focus, disease), [focus, disease]);
  const focusBase = womenOnly ? focusWf.filter((p) => p.gender === "Female").length : focusWf.length;
  const focusShare = share(focusCounts.total, focusBase);

  /* ── Functions, for the chosen condition ── */
  const fnBars = useMemo<BarItem[]>(() => {
    const byFn = countBy(people, disease, (e) => e.fn);
    const heads = headcountBy(wf, (p) => p.fn, womenOnly);
    const expected = expectedByFunction(wf, people, disease);
    return FUNCTIONS.map((f) => {
      const c = byFn.get(f.key) ?? emptyCounts();
      const exp = expected.get(f.key) ?? 0;
      const base = heads.get(f.key) ?? 0;
      return {
        key: f.key,
        label: f.name,
        people: c.total,
        base,
        rate: share(c.total, base),
        c,
        extra: c.total - exp,
        standing: standing(c.total, exp),
      };
    });
  }, [people, wf, disease, womenOnly]);

  /* ── Conditions, for the chosen function ── */
  const conditionBars = useMemo<BarItem[]>(() => {
    const team = people.filter((e) => e.fn === fnKey);
    const teamWf = wf.filter((p) => p.fn === fnKey);
    const teamWomen = teamWf.filter((p) => p.gender === "Female").length;
    return DISEASES.map((d) => {
      const c = totalCounts(team, d.key);
      const exp = expectedByFunction(wf, people, d.key).get(fnKey) ?? 0;
      const base = d.womenOnly ? teamWomen : teamWf.length;
      return {
        key: d.key,
        label: d.name,
        note: d.womenOnly ? "of women in the team" : d.plain,
        people: c.total,
        base,
        rate: share(c.total, base),
        c,
        extra: c.total - exp,
        standing: standing(c.total, exp),
        reference: share(totalCounts(people, d.key).total, d.womenOnly ? women : wf.length),
      };
    }).filter((b) => b.people > 0);
  }, [people, wf, fnKey, women]);

  const bars = [...(view === "condition" ? fnBars : conditionBars)].sort((a, b) =>
    sort === "rate" ? b.rate - a.rate : b.people - a.people
  );

  /* ── Body map: every condition, for the chosen function (or everyone) ── */
  const bodyItems = useMemo(
    () =>
      DISEASES.map((d) => ({
        key: d.key,
        label: d.name,
        note: d.womenOnly ? "women only" : d.plain,
        c: totalCounts(focus, d.key),
      })),
    [focus]
  );

  /* ── Who is affected ── */
  const dimDef = DIMS.find((d) => d.key === dim)!;
  const demo = useMemo(() => {
    const counts = countBy(focus, disease, (e) => dimDef.of(e));
    const heads = headcountBy(focusWf, (p) => dimDef.of(p), womenOnly);
    const rows = dimDef.values.map((v) => {
      const n = counts.get(v)?.total ?? 0;
      return { label: v, value: n, ofGroup: share(n, heads.get(v) ?? 0) };
    });
    const shown = rows.filter((r) => r.value >= MIN_GROUP_TO_SHOW);
    const total = shown.reduce((s, r) => s + r.value, 0);
    return {
      shown: shown.map((r) => ({ ...r, share: share(r.value, total) })),
      hidden: rows.filter((r) => tooFew(r.value)).map((r) => r.label),
      total,
    };
  }, [focus, focusWf, disease, dimDef, womenOnly]);

  /* ── Care funnel ── */
  const needCare = focusCounts.high + focusCounts.moderate;
  const reachedCare = focus.filter((e) => {
    const t = tierFor(e, disease);
    return (t === "high" || t === "moderate") && e.followedUp;
  }).length;

  /* ── Headline, summary and recommendations ── */
  const picked = fnScope ? fnBars.find((b) => b.key === fnScope) : undefined;
  const status: Standing | "company" = !fnScope ? "company" : picked?.standing ?? "similar";
  const hiddenFocus = tooFew(focusCounts.total);

  const summary = hiddenFocus
    ? `Too few people in ${focusName} live with ${dLabel} to show a breakdown. Pick a larger team or another condition.`
    : `${pct(focusShare)} of ${focusName ? (womenOnly ? "women in the team" : "the team") : womenOnly ? "women" : "employees"} (${oneIn(
        focusShare
      )}) live with ${dLabel}${focusName ? `, against ${pct(companyShare)} for the company` : ""}. ${smallCount(
        focusCounts.high
      )} need a doctor's follow-up now, and ${nf(focusCounts.early)} are at an early stage that is easiest to turn around.`;

  const headlineNote =
    status === "company"
      ? `${nf(focusCounts.total)} of ${nf(focusBase)} ${womenOnly ? "women" : "employees"} — ${oneIn(focusShare)}.`
      : status === "few"
      ? `Only ${hiddenFocus ? "a few" : nf(focusCounts.total)} people, so a comparison with the company would be noise.`
      : `${nf(focusCounts.total)} of ${nf(focusBase)} people. The dashed mark is the company at ${pct(companyShare)}; the comparison allows for the team's age and gender mix.`;

  const reachedOf = (tier: TierKey) => focus.filter((e) => tierFor(e, disease) === tier && e.followedUp).length;
  const more = (n: number) => `about ${nf(Math.round(n))} more people affected than a team of its age and gender mix would have`;
  const topFn = fnBars.filter((b) => b.standing === "higher").sort((a, b) => b.extra - a.extra)[0];
  const topCondition = conditionBars.filter((b) => b.standing === "higher").sort((a, b) => b.extra - a.extra)[0];

  const middle =
    fnScope && disease && picked
      ? {
          size: `${tooFew(picked.people) ? "Too few" : nf(picked.people)} people`,
          text:
            picked.standing === "higher"
              ? `Approve a focused ${dShort} programme for ${picked.label} — ${more(picked.extra)}.`
              : `${picked.label} is not above the company for ${dShort}, so the company-wide programme is enough here.`,
        }
      : fnScope
      ? {
          size: topCondition ? `${nf(topCondition.people)} people` : "Whole team",
          text: topCondition
            ? `Ask for a ${topCondition.label} screening and awareness drive for ${focusName} — ${more(topCondition.extra)}.`
            : `No condition stands out in ${focusName}, so the company-wide wellness calendar is enough.`,
        }
      : {
          size: topFn ? `${nf(topFn.people)} people` : "Company-wide",
          text: topFn
            ? `Approve a focused ${dShort} programme for ${topFn.label} — ${more(topFn.extra)}.`
            : `No function stands out${disease ? ` for ${dShort}` : ""}, so a company-wide awareness session is enough.`,
        };

  const recs: { owner: "Habit care team" | "Needs HR"; text: string; size: string }[] = [
    {
      owner: "Habit care team",
      size: `${smallCount(focusCounts.high)} people`,
      text: `Medical officers are following up the High Risk employees${focusName ? ` in ${focusName}` : ""} — ${nf(
        reachedOf("high")
      )} seen in the last 90 days, the rest being contacted. Nothing is needed from HR.`,
    },
    { owner: "Needs HR", ...middle },
    {
      owner: "Needs HR",
      size: `${nf(focusCounts.early)} people`,
      text: `Invite everyone at Early Intervention${focusName ? ` in ${focusName}` : ""} to a wellness programme — ${nf(
        reachedOf("early")
      )} have joined so far. This is the group where action pays back fastest.`,
    },
  ];

  const scopeWords = `${dInfo ? dInfo.name : "All conditions"} · ${focusName ?? "All functions"}${location ? ` · ${location}` : ""}`;

  return (
    <div className="animate-stagger min-w-0 space-y-5">
      {/* ── View tabs ── */}
      <div
        className="-mx-2 flex flex-wrap items-center justify-center gap-3 rounded-[20px] px-4 py-3.5"
        style={{ background: "linear-gradient(90deg, #EFEAFB 0%, #F7F1F6 55%, #FCF1E8 100%)" }}
      >
        {[
          { key: "condition" as View, label: "By Condition", icon: <Stethoscope size={17} /> },
          { key: "function" as View, label: "By Function", icon: <Building2 size={17} /> },
        ].map((t) => {
          const active = view === t.key;
          return (
            <button
              key={t.key}
              aria-pressed={active}
              onClick={() => setView(t.key)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-all"
              style={
                active
                  ? { backgroundColor: P.purple, color: "#fff", boxShadow: "0 4px 12px rgba(79,62,150,0.3)" }
                  : { backgroundColor: "#fff", color: P.body, border: `1px solid ${P.line}` }
              }
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <Card className="!py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium" style={{ color: P.ink }}>
              Data Last Updated
            </p>
            <p className="text-[13px] tabular-nums" style={{ color: P.quiet }}>
              20/11/2026, 10:49:27
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Dropdown
              label="Condition"
              width={236}
              value={disease ?? ALL}
              onChange={(v) => setDisease(v === ALL ? null : v)}
              options={[
                { value: ALL, label: "All conditions", count: nf(totalCounts(focus, null).total) },
                ...DISEASES.map((d) => ({ value: d.key, label: d.name, count: nf(totalCounts(focus, d.key).total) })),
              ]}
            />
            <Dropdown
              label="Function"
              width={236}
              value={fnScope ?? ALL}
              onChange={(v) => setFnSel(v === ALL ? null : v)}
              options={[
                /* The By Function tab is about one team, so it has no "all" choice. */
                ...(view === "condition" ? [{ value: ALL, label: "All functions" }] : []),
                ...FUNCTIONS.map((f) => ({ value: f.key, label: f.name })),
              ]}
            />
            <Dropdown
              label="Location"
              width={170}
              value={location ?? ALL}
              onChange={(v) => setLocation(v === ALL ? null : v)}
              options={[{ value: ALL, label: "All locations" }, ...LOCATIONS.map((l) => ({ value: l, label: l }))]}
            />
            <PageDownload pageTitle="OHC — Chronic Risk Cohorts" />
            <NotificationsBell />
          </div>
        </div>
      </Card>

      <h1 className="pt-1 text-[26px] font-semibold tracking-[-0.02em]" style={{ color: P.ink }}>
        Chronic Risk Cohorts
      </h1>

      {/* ── Greeting + headline ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <p className="text-[32px] font-semibold leading-tight tracking-[-0.02em]" style={{ color: P.ink }}>
            {view === "condition" ? "Who needs support," : "How is this team doing,"}
          </p>
          <p className="mt-1 text-[17px] font-semibold" style={{ color: P.ink }}>
            {scopeWords}
          </p>
          <p className="mt-1.5 text-[15.5px] leading-relaxed" style={{ color: P.body }}>
            {summary}
          </p>
        </Card>
        <Headline
          title={`Share living with ${dInfo ? dInfo.name : "a chronic condition"}`}
          value={focusShare}
          company={fnScope ? companyShare : null}
          status={hiddenFocus ? "few" : status}
          note={headlineNote}
        />
      </div>

      {/* ── Comparison ── */}
      <Card>
        <CardTitle
          hint={
            view === "condition"
              ? "Each bar is the share of that team living with the selected condition, split by risk level. A team is only marked higher when it is a quarter above what its age and gender mix predicts, by at least ten people."
              : "Each bar is the share of the team living with that condition, split by risk level. The dashed mark on each bar is the company's share for the same condition."
          }
          right={
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold" style={{ color: P.ink }}>
                Sort By:
              </span>
              <Dropdown
                label="Sort by"
                width={150}
                value={sort}
                onChange={(v) => setSort(v as "rate" | "people")}
                options={[
                  { value: "rate", label: "Percentage" },
                  { value: "people", label: "People" },
                ]}
              />
            </div>
          }
        >
          {view === "condition" ? "Which Functions Are Affected" : `What's Affecting ${fnName(fnKey)}`}
        </CardTitle>
        <p className="mt-1 text-[13.5px]" style={{ color: P.quiet }}>
          {view === "condition"
            ? `Share of each team living with ${dLabel}. Click a bar to narrow the page to that function; click again to clear.`
            : "Share of the team living with each condition. Click a bar to narrow the page to that condition; click again to clear."}
        </p>
        <CompareBars
          items={bars}
          selected={view === "condition" ? fnSel : disease}
          onSelect={(k) =>
            view === "condition" ? setFnSel((c) => (c === k ? null : k)) : setDisease((c) => (c === k ? null : k))
          }
          line={view === "condition" ? companyShare : undefined}
        />
        <div className="mt-4">
          <TierLegend />
        </div>
      </Card>

      {/* ── Body map ── */}
      <Card>
        <CardTitle hint="Where each chronic condition sits in the body, how many employees live with it, and how many of them are at High or Moderate risk. Click a card to narrow the page to that condition.">
          Employee Condition Map
        </CardTitle>
        <p className="mt-1 text-[13.5px]" style={{ color: P.quiet }}>
          {focusName ? `${focusName}: every` : "Every"} tracked condition and how serious it is for the people living with it. Click a
          card to narrow the page to that condition; click again to clear.
        </p>
        <BodyMap items={bodyItems} selected={disease} onSelect={(k) => setDisease((c) => (c === k ? null : k))} />
      </Card>

      {/* ── Funnel + who is affected ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardTitle hint="From everyone living with the condition, to those who need active care (High or Moderate risk), to those the care team has already followed up in the last 90 days.">
            Care Funnel Overview
          </CardTitle>
          <CareFunnel
            stages={[
              { label: "Living with condition", value: focusCounts.total },
              { label: "Need active care", value: needCare },
              { label: "Followed up", value: reachedCare },
            ]}
          />
        </Card>
        <Card>
          <CardTitle right={<Toggle options={DIMS.map((d) => ({ key: d.key, label: d.label }))} value={dim} onChange={setDim} />}>
            Who Is Affected
          </CardTitle>
          {demo.shown.length === 0 ? (
            <p className="mt-10 text-center text-[14px]" style={{ color: P.quiet }}>
              Too few people to show a breakdown.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-1 items-center gap-4 md:grid-cols-[1.3fr_1fr]">
              <Bubbles items={demo.shown} />
              <ul className="space-y-3.5">
                {demo.shown.map((r, i) => (
                  <li key={r.label} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: BUBBLE_FILL[i % BUBBLE_FILL.length] }} />
                    <span>
                      <span className="block text-[14.5px]" style={{ color: P.ink }}>
                        {r.label} — {Math.round(r.share)}%
                      </span>
                      <span className="block text-[12px]" style={{ color: P.quiet }}>
                        {nf(r.value)} people · {pct(r.ofGroup)} of that group
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-[14px]" style={{ color: P.ink }}>
            <b>Total employees: {nf(demo.total)}</b>{" "}
            <span style={{ color: P.body }}>
              (living with {dInfo ? dInfo.name : "a chronic condition"}
              {focusName ? ` in ${focusName}` : ""}
              {demo.hidden.length ? `; ${demo.hidden.join(", ")} too few to show` : ""})
            </span>
          </p>
        </Card>
      </div>

      <p className="px-1 text-[13.5px]" style={{ color: P.body }}>
        <span className="font-semibold" style={{ color: "#A8651B" }}>
          ⚠ Note:
        </span>{" "}
        Group totals only — HR cannot see individuals, and groups of fewer than {MIN_GROUP_TO_SHOW} people are not broken
        down. Not for appraisal, staffing or hiring decisions.
      </p>

      {/* ── Risk levels + areas of concern ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.45fr]">
        <Card>
          <CardTitle hint="Risk levels come from the medical officers' chronic-disease classification. For all conditions together, each employee is counted once at their highest level.">
            Employee Risk Levels
          </CardTitle>
          <RiskLevels affected={focus} disease={disease} showChange={disease === null} />
          <p className="mt-3 text-right text-[13px]" style={{ color: P.quiet }}>
            Employees = {nf(focusCounts.total)}
          </p>
        </Card>
        <Card>
          <CardTitle hint="The largest age and gender groups at each risk level. The percentage is that group's share of everyone affected in the current selection.">
            Areas of Concerns (Risks)
          </CardTitle>
          <AreasOfConcern affected={focus} disease={disease} />
        </Card>
      </div>

      {/* ── What we recommend ── */}
      <Card>
        <CardTitle>What We Recommend</CardTitle>
        <div className="mt-4 space-y-2.5">
          {recs.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3.5" style={{ backgroundColor: P.panel }}>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white"
                style={{ backgroundColor: P.purple }}
              >
                {i + 1}
              </span>
              <p className="min-w-[240px] flex-1 text-[14px] leading-snug" style={{ color: P.ink }}>
                {r.text}
              </p>
              <span
                className="rounded-lg px-3 py-1.5 text-[12px] font-semibold"
                style={
                  r.owner === "Needs HR"
                    ? { backgroundColor: TIER_BY_KEY.moderate.wash, color: TIER_BY_KEY.moderate.ink }
                    : { backgroundColor: "#fff", color: P.purple, border: `1px solid ${P.lilac}` }
                }
              >
                {r.owner}
              </span>
              <span className="w-28 text-right text-[14px] font-bold tabular-nums" style={{ color: P.ink }}>
                {r.size}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
