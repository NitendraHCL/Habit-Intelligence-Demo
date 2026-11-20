"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Lock } from "lucide-react";

import { T } from "@/lib/ui/theme";
import { cn } from "@/lib/utils";
import { PageGlanceBox } from "@/components/dashboard/PageGlanceBox";
import { PageDownload } from "@/components/shared/PageDownload";
import { NotificationsBell } from "@/components/NotificationsBell";
import { ResetFilter } from "@/components/ui/reset-filter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  C,
  WalletCard,
  Toolbar,
  TabStrip,
  FilterMultiSelect,
  FilterChips,
} from "@/components/opd-wallet/ui";
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
} from "@/lib/data/ohc-risk-cohorts";

/* ─── Formatting ───────────────────────────────────────────────────────── */

/** Small labels use this instead of T.textMuted, which is too faint at 11px. */
const QUIET = "#6B7280";

const nf = (n: number) => n.toLocaleString("en-IN");
const share = (n: number, base: number) => (base > 0 ? (n / base) * 100 : 0);
const pct = (v: number) => (v > 0 && v < 10 ? `${v.toFixed(1)}%` : `${Math.round(v)}%`);
const oneIn = (v: number) => (v > 0 ? `about 1 in ${Math.max(2, Math.round(100 / v))}` : "none");
/** A group this small is not broken down, so no one can be singled out. */
const tooFew = (n: number) => n > 0 && n < MIN_GROUP_TO_SHOW;
/** High-risk counts inside a shown group are rounded off when tiny. */
const smallCount = (n: number) => (n === 0 ? "—" : n < 5 ? "<5" : nf(n));

type View = "condition" | "function";
type Dim = "age" | "gender" | "location";

const DIMS: { key: Dim; label: string; values: readonly string[]; of: (p: Person) => string }[] = [
  { key: "age", label: "Age group", values: AGE_BANDS, of: (p) => p.age },
  { key: "gender", label: "Gender", values: GENDERS, of: (p) => p.gender },
  { key: "location", label: "Location", values: LOCATIONS, of: (p) => p.location },
];

const STANDING: Record<Standing, { label: string; color: string }> = {
  higher: { label: "Higher than company average", color: TIER_BY_KEY.high.color },
  similar: { label: "Similar to company", color: QUIET },
  lower: { label: "Lower than company average", color: "#047857" },
  few: { label: "Too few to compare", color: T.textMuted },
};

/* ─── Small building blocks ────────────────────────────────────────────── */

/** The risk mix of one group as a full-width bar, so groups of any size compare. */
function MixBar({ c, height = 10 }: { c: TierCounts; height?: number }) {
  if (c.total === 0) return <div className="w-full rounded-full" style={{ height, backgroundColor: "#F1F2F6" }} />;
  return (
    <Tooltip>
      <TooltipTrigger className="block w-full">
        <span className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height }}>
          {TIERS.map((t) =>
            c[t.key] > 0 ? (
              <span key={t.key} style={{ width: `${(c[t.key] / c.total) * 100}%`, backgroundColor: t.color }} />
            ) : null
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {TIERS.map((t) => (
          <div key={t.key} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
            {t.label}: {pct(share(c[t.key], c.total))}
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

function TierLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {TIERS.map((t) => (
        <span key={t.key} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: T.textSecondary }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
          {t.label}
        </span>
      ))}
    </div>
  );
}

function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <div className="inline-flex rounded-lg p-0.5" style={{ backgroundColor: "#F1F2F6" }}>
      {options.map((o) => (
        <button
          key={o.key}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-md px-3 py-1 text-[12px] font-semibold transition-all",
            value === o.key ? "bg-white shadow-sm" : "hover:text-[#111827]"
          )}
          style={{ color: value === o.key ? T.textPrimary : QUIET }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled dropdown; `count` sits on the right of each option. */
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
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: QUIET }}>
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="!h-10 rounded-lg bg-white px-3 text-[13.5px] font-semibold" style={{ width, color: T.textPrimary }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <span className="flex w-full items-center justify-between gap-6">
                <span>{o.label}</span>
                {o.count && (
                  <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: QUIET }}>
                    {o.count}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function StandingCell({ s, extra }: { s: Standing; extra: number }) {
  const def = STANDING[s];
  const text = (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: def.color }}>
      {s !== "few" && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: def.color }} />}
      {def.label}
    </span>
  );
  if (s === "few" || s === "similar") return text;
  return (
    <Tooltip>
      <TooltipTrigger>{text}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        About {nf(Math.abs(Math.round(extra)))} {extra > 0 ? "more" : "fewer"} people than a team with the same age
        and gender mix would have.
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * A share drawn against a reference: the bar is the group's own share, the
 * tick is the company's. Anything flagged higher is tinted so it reads at a
 * glance without a separate pill.
 */
function ShareBar({ value, reference, max, flagged }: { value: number; reference: number; max: number; flagged: boolean }) {
  return (
    <div className="relative h-3 w-full rounded-full" style={{ backgroundColor: "#F1F2F6" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: flagged ? TIER_BY_KEY.high.color : C.accentMid }}
      />
      <div
        className="absolute -top-1.5 -bottom-1.5 w-0"
        style={{ left: `${Math.min(100, (reference / max) * 100)}%`, borderLeft: `2px dashed ${T.textPrimary}` }}
      />
    </div>
  );
}

/* ─── How urgently people need support ─────────────────────────────────── */

function Ladder({
  affected,
  disease,
  subtitle,
  showChange,
}: {
  affected: Employee[];
  disease: string | null;
  subtitle: string;
  showChange: boolean;
}) {
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
    <WalletCard
      accentColor={TIER_BY_KEY.high.color}
      title="How urgently people need support"
      subtitle={subtitle}
      tooltipText="Risk levels come from the medical officers' chronic-disease classification. For all conditions together, each employee is counted once at their highest level."
      expandable={false}
    >
      <div className="mt-3 flex h-3.5 w-full gap-[2px] overflow-hidden rounded-full">
        {TIERS.map((t) =>
          c[t.key] > 0 ? (
            <div key={t.key} style={{ width: `${share(c[t.key], c.total)}%`, backgroundColor: t.color }} />
          ) : null
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
        {TIERS.map((t) => {
          const n = c[t.key];
          /* Same rule as the tables: a level inside a shown group is only rounded off when tiny. */
          const hidden = n > 0 && n < 5;
          return (
            <div key={t.key} className="pl-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: t.key === "stable" ? QUIET : t.color }}>
                {t.label}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="text-[26px] font-extrabold leading-none tracking-[-0.02em]" style={{ color: T.textPrimary }}>
                  {hidden ? "<5" : nf(n)}
                </span>
                {!hidden && (
                  <span className="text-[12px] font-semibold" style={{ color: QUIET }}>
                    {pct(share(n, c.total))}
                  </span>
                )}
                {t.key === "high" && showChange && !hidden && change !== 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold"
                    style={
                      change < 0
                        ? { backgroundColor: "#D1FAE5", color: "#047857" }
                        : { backgroundColor: "#FFE4E8", color: "#BE123C" }
                    }
                  >
                    {change < 0 ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                    {nf(Math.abs(change))} vs last quarter
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11.5px] leading-snug" style={{ color: T.textSecondary }}>
                {t.means}
              </p>
              {t.coverage && !hidden && n > 0 && (
                <div className="mt-2.5">
                  <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: "#E9EBF0" }}>
                    <div className="h-full rounded-full" style={{ width: `${share(reached[t.key], n)}%`, backgroundColor: t.color }} />
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: QUIET }}>
                    <b style={{ color: T.textPrimary }}>
                      {nf(reached[t.key])} of {nf(n)}
                    </b>{" "}
                    {t.coverage}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </WalletCard>
  );
}

/* ─── What we recommend ────────────────────────────────────────────────── */

interface Rec {
  text: string;
  owner: "Habit care team" | "HR";
  size: string;
}

function Recommendations({ items }: { items: Rec[] }) {
  return (
    <WalletCard
      accentColor={C.accent}
      title="What we recommend"
      subtitle="Three next steps drawn from the numbers above, and who owns each."
      expandable={false}
    >
      <div className="mt-3 space-y-2">
        {items.map((r, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: C.accentWash }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: C.accent }}
            >
              {i + 1}
            </span>
            <p className="min-w-[240px] flex-1 text-[13px] leading-snug" style={{ color: T.textPrimary }}>
              {r.text}
            </p>
            <span
              className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.04em]"
              style={
                r.owner === "HR"
                  ? { backgroundColor: "#fff", color: C.accent, border: `1px solid ${C.accentPale}` }
                  : { backgroundColor: "#ECFDF8", color: "#0F766E", border: "1px solid #99F6E4" }
              }
            >
              {r.owner === "HR" ? "Needs HR" : r.owner}
            </span>
            <span className="w-24 text-right text-[13px] font-bold tabular-nums" style={{ color: T.textPrimary }}>
              {r.size}
            </span>
          </div>
        ))}
      </div>
    </WalletCard>
  );
}

/* ─── Who is affected (condition view) ─────────────────────────────────── */

function GroupRows({
  heading,
  values,
  counts,
  heads,
  notApplicable,
}: {
  heading: string;
  values: readonly string[];
  counts: Map<string, TierCounts>;
  heads: Map<string, number>;
  /** Group values the condition can't apply to (men, for a women-only condition). */
  notApplicable?: string[];
}) {
  return (
    <div>
      <div
        className="grid items-center gap-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
        style={{ gridTemplateColumns: "92px 1fr 64px 76px", color: QUIET }}
      >
        <span>{heading}</span>
        <span>Risk mix</span>
        <span className="text-right">People</span>
        <span className="text-right">% of group</span>
      </div>
      {values.map((v) => {
        const c = counts.get(v) ?? emptyCounts();
        const na = notApplicable?.includes(v);
        const hidden = tooFew(c.total);
        return (
          <div
            key={v}
            className="grid items-center gap-3 py-2"
            style={{ gridTemplateColumns: "92px 1fr 64px 76px", borderTop: `1px solid ${T.borderLight}` }}
          >
            <span className="text-[12.5px] font-medium" style={{ color: T.textPrimary }}>
              {v}
            </span>
            {na || hidden || c.total === 0 ? (
              <span className="text-[11.5px]" style={{ color: T.textMuted }}>
                {na ? "Not applicable" : hidden ? "Too few people to show" : "No one affected"}
              </span>
            ) : (
              <MixBar c={c} />
            )}
            <span className="text-right text-[13px] font-bold tabular-nums" style={{ color: T.textPrimary }}>
              {na || hidden || c.total === 0 ? "—" : nf(c.total)}
            </span>
            <span className="text-right text-[13px] font-semibold tabular-nums" style={{ color: T.textSecondary }}>
              {na || hidden || c.total === 0 ? "—" : pct(share(c.total, heads.get(v) ?? 0))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function RiskCohortsPage() {
  const [view, setView] = useState<View>("condition");
  const [disease, setDisease] = useState<string | null>(null);
  /* The function picked as a filter; null means every function. */
  const [fnSel, setFnSel] = useState<string | null>(null);
  /* The By Function tab always needs a team, so it falls back to one. */
  const fnKey = fnSel ?? "sales";
  const [locations, setLocations] = useState<string[]>([]);
  const [dim, setDim] = useState<Dim>("age");

  /* Everyone, and everyone with a chronic condition, in the selected locations. */
  const wf = useMemo(
    () => (locations.length === 0 ? WORKFORCE : WORKFORCE.filter((p) => locations.includes(p.location))),
    [locations]
  );
  const people = useMemo(
    () => (locations.length === 0 ? COHORT : COHORT.filter((e) => locations.includes(e.location))),
    [locations]
  );

  const dInfo = disease ? diseaseByKey(disease) ?? null : null;
  const womenOnly = !!dInfo?.womenOnly;
  /** "Dyslipidemia (high cholesterol)" — the official name first, everyday wording after. */
  const dLabel = dInfo ? (dInfo.plain ? `${dInfo.name} (${dInfo.plain})` : dInfo.name) : "a chronic condition";
  const ofWhom = womenOnly ? "women" : "employees";

  /* ── Company figures for the condition in view ── */
  const scope = useMemo(() => totalCounts(people, disease), [people, disease]);
  const base = useMemo(() => (womenOnly ? wf.filter((p) => p.gender === "Female").length : wf.length), [wf, womenOnly]);
  const companyShare = share(scope.total, base);

  const fnRows = useMemo(() => {
    const byFn = countBy(people, disease, (e) => e.fn);
    const heads = headcountBy(wf, (p) => p.fn, womenOnly);
    const size = headcountBy(wf, (p) => p.fn);
    const expected = expectedByFunction(wf, people, disease);
    return FUNCTIONS.map((f) => {
      const c = byFn.get(f.key) ?? emptyCounts();
      const exp = expected.get(f.key) ?? 0;
      return {
        key: f.key,
        name: f.name,
        size: size.get(f.key) ?? 0,
        c,
        rate: share(c.total, heads.get(f.key) ?? 0),
        extra: c.total - exp,
        standing: standing(c.total, exp),
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [people, wf, disease, womenOnly]);
  const fnMax = Math.max(1, ...fnRows.map((r) => r.rate), companyShare) * 1.08;
  const topFn = fnRows.filter((r) => r.standing === "higher").sort((a, b) => b.extra - a.extra)[0];

  /*
   * The selection in view: the chosen condition, narrowed to the chosen
   * function when there is one. The risk levels, the demographic breakdown,
   * the banner and the recommendations all read from this, so picking
   * Dyslipidemia and then Sales shows Dyslipidemia in Sales everywhere.
   */
  const fnScope = view === "condition" ? fnSel : fnKey;
  /* Chip counts follow the chosen function, so they match the page below. */
  const focusPickerPeople = fnScope ? people.filter((e) => e.fn === fnScope) : people;
  const focusName = fnScope ? fnName(fnScope) : null;
  const focus = useMemo(() => (fnScope ? people.filter((e) => e.fn === fnScope) : people), [people, fnScope]);
  const focusWf = useMemo(() => (fnScope ? wf.filter((p) => p.fn === fnScope) : wf), [wf, fnScope]);
  const focusCounts = useMemo(() => totalCounts(focus, disease), [focus, disease]);
  const focusShare = share(
    focusCounts.total,
    womenOnly ? focusWf.filter((p) => p.gender === "Female").length : focusWf.length
  );

  const demo = useMemo(
    () =>
      DIMS.map((d) => ({
        ...d,
        counts: countBy(focus, disease, (e) => d.of(e)),
        heads: headcountBy(focusWf, (p) => d.of(p), womenOnly),
      })),
    [focus, focusWf, disease, womenOnly]
  );

  /* ── Function view figures ── */
  const team = useMemo(() => people.filter((e) => e.fn === fnKey), [people, fnKey]);
  const teamWf = useMemo(() => wf.filter((p) => p.fn === fnKey), [wf, fnKey]);
  const teamCounts = useMemo(() => totalCounts(team, null), [team]);
  const teamShare = share(teamCounts.total, teamWf.length);
  const allCounts = useMemo(() => totalCounts(people, null), [people]);
  const allShare = share(allCounts.total, wf.length);

  const teamRows = useMemo(() => {
    const teamWomen = teamWf.filter((p) => p.gender === "Female").length;
    const allWomen = wf.filter((p) => p.gender === "Female").length;
    return DISEASES.map((d) => {
      const c = totalCounts(team, d.key);
      const company = totalCounts(people, d.key).total;
      const exp = expectedByFunction(wf, people, d.key).get(fnKey) ?? 0;
      return {
        ...d,
        c,
        rate: share(c.total, d.womenOnly ? teamWomen : teamWf.length),
        companyRate: share(company, d.womenOnly ? allWomen : wf.length),
        extra: c.total - exp,
        standing: standing(c.total, exp),
      };
    })
      .filter((r) => r.c.total > 0)
      .sort((a, b) => b.c.total - a.c.total);
  }, [team, teamWf, people, wf, fnKey]);
  const teamMax = Math.max(1, ...teamRows.flatMap((r) => [r.rate, r.companyRate])) * 1.08;
  const topCondition = teamRows.filter((r) => r.standing === "higher").sort((a, b) => b.extra - a.extra)[0];

  const dimDef = DIMS.find((d) => d.key === dim)!;
  const teamGrid = useMemo(() => {
    const heads = headcountBy(teamWf, (p) => dimDef.of(p));
    const rows = teamRows.map((r) => ({ row: r, cells: countBy(team, r.key, (e) => dimDef.of(e)) }));
    return { heads, rows };
  }, [team, teamWf, teamRows, dimDef]);

  /* ── Filters and navigation ── */
  const chips = locations.map((l) => ({
    key: "Location",
    value: l,
    clear: () => setLocations((p) => p.filter((v) => v !== l)),
  }));
  const clearAll = () => setLocations([]);

  /* Clicking a row narrows the page to it; clicking it again clears it. */
  const toggleFunction = (key: string) => setFnSel((cur) => (cur === key ? null : key));
  const toggleCondition = (key: string) => setDisease((cur) => (cur === key ? null : key));

  /* ── Banner and recommendations: computed, so they follow the data ── */
  const reachedOf = (list: Employee[], d: string | null, tier: "high" | "early") =>
    list.filter((e) => tierFor(e, d) === tier && e.followedUp).length;

  const dShort = dInfo ? dInfo.name : "chronic care";
  const summary = tooFew(focusCounts.total)
    ? `${focusName}: too few people live with ${dLabel} to show a breakdown. Pick a larger team or another condition.`
    : `${focusName ? `${focusName}: ` : ""}${pct(focusShare)} of ${
        focusName ? (womenOnly ? "women in the team" : "the team") : ofWhom
      } (${oneIn(focusShare)}) live with ${dLabel}${
        focusName ? `, against ${pct(companyShare)} for the company` : ""
      } — ${nf(focusCounts.total)} people. ${smallCount(focusCounts.high)} need a doctor's follow-up now, and ${nf(
        focusCounts.early
      )} are at an early stage that is easiest to turn around.`;

  /* The middle recommendation depends on what is selected. */
  const picked = fnScope && disease ? fnRows.find((r) => r.key === fnScope) : undefined;
  const more = (n: number) =>
    `about ${nf(Math.round(n))} more people affected than a team of its age and gender mix would have`;
  const focusRec: Rec = picked
    ? {
        owner: "HR",
        size: `${tooFew(picked.c.total) ? "Too few" : nf(picked.c.total)} people`,
        text:
          picked.standing === "higher"
            ? `Approve a focused ${dShort} programme for ${picked.name} — ${more(picked.extra)}.`
            : `${picked.name} is not above the company for ${dShort}, so the company-wide programme is enough here.`,
      }
    : fnScope
    ? {
        owner: "HR",
        size: topCondition ? `${nf(topCondition.c.total)} people` : "Whole team",
        text: topCondition
          ? `Ask for a ${topCondition.name} screening and awareness drive for ${focusName} — ${more(topCondition.extra)}.`
          : `No condition stands out in ${focusName}, so the company-wide wellness calendar is enough.`,
      }
    : {
        owner: "HR",
        size: topFn ? `${nf(topFn.c.total)} people` : "Company-wide",
        text: topFn
          ? `Approve a focused ${dShort} programme for ${topFn.name} — ${more(topFn.extra)}.`
          : `No function stands out${disease ? ` for ${dShort}` : ""}, so a company-wide awareness session is enough.`,
      };

  const recs: Rec[] = [
    {
      owner: "Habit care team",
      size: `${smallCount(focusCounts.high)} people`,
      text: `Medical officers are following up the High Risk employees${focusName ? ` in ${focusName}` : ""} — ${nf(
        reachedOf(focus, disease, "high")
      )} seen in the last 90 days, the rest being contacted. Nothing is needed from HR.`,
    },
    focusRec,
    {
      owner: "HR",
      size: `${nf(focusCounts.early)} people`,
      text: `Invite everyone at Early Intervention${focusName ? ` in ${focusName}` : ""} to a wellness programme — ${nf(
        reachedOf(focus, disease, "early")
      )} have joined so far. This is the group where action pays back fastest.`,
    },
  ];

  const ladder = (
    <Ladder
      affected={focus}
      disease={disease}
      showChange={disease === null}
      subtitle={`${nf(focusCounts.total)} employees${focusName ? ` in ${focusName}` : ""} living with ${dLabel}, ${
        disease ? "by how serious it is for each of them" : "each counted once at their highest risk level"
      }.`}
    />
  );

  const demoCards = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <WalletCard
        accentColor={C.violet}
        title={`Who is affected${focusName ? ` in ${focusName}` : ""} — age and gender`}
        subtitle={`"% of group" is the share of everyone in that group${
          focusName ? ` in ${focusName}` : ""
        } living with ${dLabel}. ${focusName ? `${focusName}: ${pct(focusShare)}. ` : ""}Company: ${pct(companyShare)}.`}
        expandable={false}
      >
        <div className="mt-3 space-y-5">
          <GroupRows heading="Age" values={AGE_BANDS} counts={demo[0].counts} heads={demo[0].heads} />
          <GroupRows
            heading="Gender"
            values={GENDERS}
            counts={demo[1].counts}
            heads={demo[1].heads}
            notApplicable={womenOnly ? ["Male"] : undefined}
          />
        </div>
      </WalletCard>
      <WalletCard
        accentColor={C.teal}
        title={`Who is affected${focusName ? ` in ${focusName}` : ""} — location`}
        subtitle="The same view by office. The bar shows how serious it is for the people affected there."
        expandable={false}
      >
        <div className="mt-3">
          <GroupRows heading="Office" values={LOCATIONS} counts={demo[2].counts} heads={demo[2].heads} />
        </div>
      </WalletCard>
    </div>
  );

  const ALL = "all";
  const pickers = (
    <div
      className="flex flex-wrap items-end gap-4 rounded-2xl px-5 py-4"
      style={{ backgroundColor: T.white, border: `1px solid ${T.border}`, boxShadow: T.cardShadow }}
    >
      <Dropdown
        label="Condition"
        width={300}
        value={disease ?? ALL}
        onChange={(v) => setDisease(v === ALL ? null : v)}
        options={[
          { value: ALL, label: "All conditions", count: nf(totalCounts(focusPickerPeople, null).total) },
          ...DISEASES.map((d) => ({
            value: d.key,
            label: d.name,
            count: nf(totalCounts(focusPickerPeople, d.key).total),
          })),
        ]}
      />
      <Dropdown
        label="Function"
        width={280}
        value={fnScope ?? ALL}
        onChange={(v) => setFnSel(v === ALL ? null : v)}
        options={[
          /* The By Function tab is about one team, so it has no "all" choice. */
          ...(view === "condition" ? [{ value: ALL, label: "All functions" }] : []),
          ...FUNCTIONS.map((f) => ({ value: f.key, label: f.name })),
        ]}
      />
      {(disease !== null || (view === "condition" && fnSel !== null)) && (
        <button
          onClick={() => {
            setDisease(null);
            if (view === "condition") setFnSel(null);
          }}
          className="mb-2.5 text-[12px] font-semibold hover:underline"
          style={{ color: C.accent }}
        >
          Clear selection
        </button>
      )}
    </div>
  );

  const FN_COLS = "190px minmax(140px,1fr) 70px 70px 110px 64px 200px";
  const TEAM_COLS = "200px minmax(140px,1fr) 78px 64px 110px 64px 200px";

  return (
    <div className="animate-stagger space-y-5">
      {/* ── Toolbar ── */}
      <Toolbar>
        <FilterMultiSelect label="Location" options={LOCATIONS} selected={locations} onChange={setLocations} width={200} />
        <ResetFilter visible={chips.length > 0} onClick={clearAll} />
        <div className="flex-1" />
        <span className="text-[11px] font-medium mr-1" style={{ color: QUIET }}>
          Data as of 20 November 2026
        </span>
        <PageDownload pageTitle="OHC — Chronic Risk Cohorts" />
        <NotificationsBell />
      </Toolbar>

      <FilterChips chips={chips} onClearAll={clearAll} />

      {/* ── Banner — empty kpis keeps it on the computed summary ── */}
      <PageGlanceBox
        pageTitle="Chronic Risk Cohorts"
        pageSubtitle="Which teams long-term conditions are touching, who within them, and how urgently they need support."
        kpis={{}}
        fallbackSummary={summary}
        fallbackChips={[
          { label: "Workforce", value: nf(wf.length) },
          { label: "Living with a chronic condition", value: nf(allCounts.total) },
        ]}
      />

      {/* ── Privacy promise, up front ── */}
      <div
        className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[12px]"
        style={{ backgroundColor: T.white, border: `1px solid ${T.border}`, color: T.textSecondary }}
      >
        <Lock size={14} className="shrink-0" style={{ color: QUIET }} />
        <span>
          <b style={{ color: T.textPrimary }}>Group totals only.</b> HR cannot see individuals, and groups of fewer than{" "}
          {MIN_GROUP_TO_SHOW} people are not broken down. Not for appraisal, staffing or hiring decisions.
        </span>
      </div>

      {/* ── View switch ── */}
      <TabStrip
        tabs={[
          { key: "condition", label: "By Condition" },
          { key: "function", label: "By Function" },
        ]}
        active={view}
        onChange={(k) => setView(k as View)}
      />

      {view === "condition" ? (
        <>
          {pickers}

          {/* ── Functions ── */}
          <WalletCard
            accentColor={C.accent}
            title="Which functions are affected"
            subtitle={`Share of each team living with ${dLabel}. Click a function to narrow everything below to it; click again to clear.`}
            tooltipText="The comparison allows for each team's age and gender mix, so an older team is not marked higher just for being older. A team is only called higher when the gap is at least a quarter and at least ten people."
          >
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <TierLegend />
              <span className="inline-flex items-center gap-2 text-[11.5px]" style={{ color: T.textSecondary }}>
                <span className="inline-block h-3.5 w-0" style={{ borderLeft: `2px dashed ${T.textPrimary}` }} />
                Company: <b style={{ color: T.textPrimary }}>{pct(companyShare)}</b> of {ofWhom}
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[900px]">
                <div
                  className="grid items-center gap-4 px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ gridTemplateColumns: FN_COLS, color: QUIET }}
                >
                  <span>Function</span>
                  <span>Share of team affected</span>
                  <span className="text-right">{womenOnly ? "% of women" : "% of team"}</span>
                  <span className="text-right">People</span>
                  <span>Risk mix</span>
                  <span className="text-right">High risk</span>
                  <span>Compared with company</span>
                </div>
                {fnRows.map((r) => {
                  const hidden = tooFew(r.c.total);
                  return (
                    <div
                      key={r.key}
                      role="button"
                      tabIndex={0}
                      aria-pressed={fnSel === r.key}
                      onClick={() => toggleFunction(r.key)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleFunction(r.key)}
                      className="group grid cursor-pointer items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F5F6FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4f46e5]"
                      style={{
                        gridTemplateColumns: FN_COLS,
                        backgroundColor: fnSel === r.key ? C.accentWash : undefined,
                        boxShadow: fnSel === r.key ? `inset 3px 0 0 ${C.accent}` : undefined,
                      }}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: T.textPrimary }}>
                          <span className="truncate">{r.name}</span>
                          <ArrowUpRight size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: C.accent }} />
                        </span>
                        <span className="block text-[11px]" style={{ color: QUIET }}>
                          {nf(r.size)} employees
                        </span>
                      </span>
                      {hidden || r.c.total === 0 ? (
                        <span className="text-[11.5px]" style={{ color: T.textMuted, gridColumn: "2 / 7" }}>
                          {hidden ? "Too few people to show" : "No one affected"}
                        </span>
                      ) : (
                        <>
                          <ShareBar value={r.rate} reference={companyShare} max={fnMax} flagged={r.standing === "higher"} />
                          <span className="text-right text-[13px] font-bold tabular-nums" style={{ color: T.textPrimary }}>
                            {pct(r.rate)}
                          </span>
                          <span className="text-right text-[13px] font-semibold tabular-nums" style={{ color: T.textSecondary }}>
                            {nf(r.c.total)}
                          </span>
                          <MixBar c={r.c} />
                          <span
                            className="text-right text-[13px] font-bold tabular-nums"
                            style={{ color: r.c.high ? TIER_BY_KEY.high.color : T.textMuted }}
                          >
                            {smallCount(r.c.high)}
                          </span>
                        </>
                      )}
                      <StandingCell s={hidden ? "few" : r.standing} extra={r.extra} />
                    </div>
                  );
                })}
              </div>
            </div>
          </WalletCard>

          {ladder}
          {demoCards}
          <Recommendations items={recs} />
        </>
      ) : (
        <>
          {pickers}

          {/* ── Conditions in this team ── */}
          <WalletCard
            accentColor={C.accent}
            title={`What's affecting ${fnName(fnKey)}`}
            subtitle={`${nf(teamCounts.total)} of ${nf(teamWf.length)} people (${pct(teamShare)}) live with a chronic condition; the company figure is ${pct(allShare)}. Click a condition to narrow everything below to it; click again to clear.`}
            tooltipText="One employee with two conditions appears in both rows. The comparison allows for the team's age and gender mix, and needs at least 20 people before it says higher or lower."
          >
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <TierLegend />
              <span className="inline-flex items-center gap-2 text-[11.5px]" style={{ color: T.textSecondary }}>
                <span className="inline-block h-3.5 w-0" style={{ borderLeft: `2px dashed ${T.textPrimary}` }} />
                Company share for the same condition
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[900px]">
                <div
                  className="grid items-center gap-4 px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ gridTemplateColumns: TEAM_COLS, color: QUIET }}
                >
                  <span>Condition</span>
                  <span>Share of team affected</span>
                  <span className="text-right">% of team</span>
                  <span className="text-right">People</span>
                  <span>Risk mix</span>
                  <span className="text-right">High risk</span>
                  <span>Compared with company</span>
                </div>
                {teamRows.map((r) => {
                  const hidden = tooFew(r.c.total);
                  const carried = disease === r.key;
                  return (
                    <div
                      key={r.key}
                      role="button"
                      tabIndex={0}
                      aria-pressed={disease === r.key}
                      onClick={() => toggleCondition(r.key)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleCondition(r.key)}
                      className="group grid cursor-pointer items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F5F6FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4f46e5]"
                      style={{
                        gridTemplateColumns: TEAM_COLS,
                        backgroundColor: carried ? C.accentWash : undefined,
                        boxShadow: carried ? `inset 3px 0 0 ${C.accent}` : undefined,
                      }}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: T.textPrimary }}>
                          <span className="truncate">{r.name}</span>
                          <ArrowUpRight size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: C.accent }} />
                        </span>
                        <span className="block truncate text-[11px]" style={{ color: QUIET }}>
                          {r.womenOnly ? "Measured against women in the team" : r.plain ?? " "}
                        </span>
                      </span>
                      {hidden ? (
                        <span className="text-[11.5px]" style={{ color: T.textMuted, gridColumn: "2 / 7" }}>
                          Too few people to show
                        </span>
                      ) : (
                        <>
                          <ShareBar value={r.rate} reference={r.companyRate} max={teamMax} flagged={r.standing === "higher"} />
                          <span className="text-right text-[13px] font-bold tabular-nums" style={{ color: T.textPrimary }}>
                            {pct(r.rate)}
                          </span>
                          <span className="text-right text-[13px] font-semibold tabular-nums" style={{ color: T.textSecondary }}>
                            {nf(r.c.total)}
                          </span>
                          <MixBar c={r.c} />
                          <span
                            className="text-right text-[13px] font-bold tabular-nums"
                            style={{ color: r.c.high ? TIER_BY_KEY.high.color : T.textMuted }}
                          >
                            {smallCount(r.c.high)}
                          </span>
                        </>
                      )}
                      <StandingCell s={hidden ? "few" : r.standing} extra={r.extra} />
                    </div>
                  );
                })}
              </div>
            </div>
          </WalletCard>

          {ladder}

          {disease ? (
            demoCards
          ) : (
          <WalletCard
            accentColor={C.teal}
            title="Who is affected, condition by condition"
            subtitle={`${fnName(fnKey)} by ${dimDef.label.toLowerCase()}. Each cell shows how many people and how serious it is for them.`}
            tooltipText={`Groups of fewer than ${MIN_GROUP_TO_SHOW} people are not broken down, so no one can be identified.`}
            rightHeader={
              <Segmented options={DIMS.map((d) => ({ key: d.key, label: d.label }))} value={dim} onChange={setDim} />
            }
          >
            <div className="mt-2">
              <TierLegend />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate" style={{ borderSpacing: "8px 0" }}>
                <thead>
                  <tr>
                    <th className="pb-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: QUIET }}>
                      Condition
                    </th>
                    {dimDef.values.map((v) => (
                      <th key={v} className="pb-2 text-left align-bottom">
                        <span className="block text-[12.5px] font-semibold" style={{ color: T.textPrimary }}>
                          {v}
                        </span>
                        <span className="block text-[10.5px] font-normal" style={{ color: QUIET }}>
                          {nf(teamGrid.heads.get(v) ?? 0)} in team
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamGrid.rows.map(({ row, cells }) => (
                    <tr key={row.key}>
                      <td
                        className="py-2.5 pr-2 text-[12.5px] font-semibold whitespace-nowrap"
                        style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}
                      >
                        {row.name}
                      </td>
                      {dimDef.values.map((v) => {
                        const c = cells.get(v) ?? emptyCounts();
                        const na = row.womenOnly && v === "Male";
                        return (
                          <td key={v} className="py-2.5 pr-5 align-middle" style={{ borderTop: `1px solid ${T.borderLight}`, minWidth: 96 }}>
                            {na || c.total === 0 ? (
                              <span className="text-[12px]" style={{ color: T.textMuted }}>
                                {na ? "Not applicable" : "—"}
                              </span>
                            ) : tooFew(c.total) ? (
                              <span className="text-[11.5px]" style={{ color: T.textMuted }}>
                                Too few to show
                              </span>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 text-[13px] font-bold tabular-nums" style={{ color: T.textPrimary }}>
                                  {nf(c.total)}
                                </span>
                                <div className="flex-1">
                                  <MixBar c={c} height={8} />
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WalletCard>
          )}
          <Recommendations items={recs} />
        </>
      )}
    </div>
  );
}
