"use client";

import { useRef, useState } from "react";
import { ArrowRight, ClipboardList, ShieldAlert } from "lucide-react";

import { Card, Dropdown, P, Toggle } from "./view-one";
import {
  HC_AGES,
  HC_DATA,
  HC_DEPARTMENTS,
  HC_DISEASES,
  HC_GENDERS,
  HC_LOCATIONS,
  type HcPerson,
} from "@/lib/data/ohc-health-check";

/* ─── Severity colours, taken from View 1's risk levels ────────────────── */

const SEV = [
  { label: "Mild", color: "#7B68B5", wash: "#E4DEF5", ink: "#3B2F73", note: "Lifestyle changes needed" },
  { label: "Moderate", color: "#EBC08F", wash: "#F6DEC6", ink: "#6B4318", note: "Need a doctor and regular follow-up" },
  { label: "Severe", color: "#D98C8C", wash: "#F6CDD0", ink: "#7A2B33", note: "Need urgent medical attention" },
];
const SEVERE = SEV[2];
/** Sand steps for the funnel, lightest at the top. */
const FUNNEL = ["#F8ECDB", "#F4E2CA", "#F1DCC0", "#ECD0AC", "#E6C398", "#DFB584"];

/* ─── Filters ──────────────────────────────────────────────────────────── */

type Key = "location" | "department" | "ageGroup" | "gender" | "disease";
type PeopleKey = Exclude<Key, "disease">;
type Filters = Record<Key, string>;

const DIMS: Record<Key, { label: string; all: string; opts: string[] }> = {
  location: { label: "Location", all: "All locations", opts: HC_LOCATIONS },
  department: { label: "Department", all: "All departments", opts: HC_DEPARTMENTS },
  ageGroup: { label: "Age group", all: "All age groups", opts: HC_AGES },
  gender: { label: "Gender", all: "All genders", opts: HC_GENDERS },
  disease: { label: "Condition", all: "All conditions", opts: HC_DISEASES.map((d) => d.n) },
};
const PEOPLE_DIMS: PeopleKey[] = ["location", "department", "ageGroup", "gender"];
const FILTER_ORDER: Key[] = ["location", "department", "ageGroup", "gender", "disease"];
const FUNNEL_ORDER: Key[] = ["disease", "location", "department", "ageGroup", "gender"];
const EMPTY: Filters = { location: "", department: "", ageGroup: "", gender: "", disease: "" };
const ALL = "all";

const nf = (v: number) => Math.round(v).toLocaleString("en-IN");
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : "0%");
const pct0 = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "0%");

/** Employees matching every people-filter except the ones listed. */
function people(F: Filters, except: Key[] = []) {
  return HC_DATA.filter((r) => PEOPLE_DIMS.every((k) => except.includes(k) || !F[k] || r[k] === F[k]));
}
/** Severity of an employee under the condition filter (-1 = no condition). */
function sevOf(r: HcPerson, di: number) {
  if (di < 0) return r.worst;
  const c = r.conds.find((x) => x.d === di);
  return c ? c.s : -1;
}
function tally(rows: HcPerson[], di: number) {
  const t = { n: rows.length, c: 0, s: [0, 0, 0] };
  for (const r of rows) {
    const v = sevOf(r, di);
    if (v >= 0) {
      t.c++;
      t.s[v]++;
    }
  }
  return t;
}

/* Severe-only view: each person carries the names of their severe conditions. */
type SeverePerson = HcPerson & { sevD: string[] };
const SEVERE_PEOPLE: SeverePerson[] = HC_DATA.filter((r) => r.worst === 2).map((r) => ({
  ...r,
  sevD: r.conds.filter((c) => c.s === 2).map((c) => HC_DISEASES[c.d].n),
}));
const sMatch = (r: SeverePerson, k: Key, v: string) => (k === "disease" ? r.sevD.includes(v) : r[k] === v);
function sCount(rows: SeverePerson[], k: Key) {
  const c: Record<string, number> = Object.fromEntries(DIMS[k].opts.map((o) => [o, 0]));
  for (const r of rows) {
    if (k === "disease") r.sevD.forEach((d) => c[d]++);
    else c[r[k]]++;
  }
  return c;
}
const topOf = (c: Record<string, number>) => Object.entries(c).sort((a, b) => b[1] - a[1])[0];
const SAY: Record<Key, (v: string) => string> = {
  disease: (v) => (v ? `with severe ${v}` : ""),
  location: (v) => (v ? `at ${v}` : ""),
  department: (v) => (v ? `in ${v}` : ""),
  ageGroup: (v) => (v ? `aged ${v}` : ""),
  gender: (v) => (v ? (v === "Male" ? "men" : "women") : ""),
};

/* ─── Building blocks ──────────────────────────────────────────────────── */

function Section({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ backgroundColor: P.purple }}
        >
          {n}
        </span>
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.01em]" style={{ color: P.ink }}>
            {title}
          </h2>
          <p className="text-[13.5px]" style={{ color: P.quiet }}>
            {sub}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-middle" style={{ backgroundColor: color }} />;
}

/** Rose heat-map cell: the darker, the more severe employees. */
function heat(v: number, max: number): React.CSSProperties {
  if (!v) return { backgroundColor: "#F7F7F9", color: "#B9B9C2" };
  const a = 0.14 + 0.78 * (v / max);
  return { backgroundColor: `rgba(196, 92, 104, ${a.toFixed(2)})`, color: a > 0.55 ? "#fff" : SEVERE.ink };
}

function HeatTable({
  corner,
  rows,
  cols,
  value,
  rowTotal,
  colTotal,
  grand,
  totalRowLabel = "Total",
  picked,
  onPick,
}: {
  corner?: string;
  rows: string[];
  cols: string[];
  value: (row: string, col: string) => number;
  rowTotal: (row: string) => number;
  colTotal: (col: string) => number;
  grand: number;
  totalRowLabel?: string;
  picked?: (row: string, col: string) => boolean;
  onPick?: (row: string, col: string) => void;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => value(r, c))));
  const th = "px-1.5 py-1.5 text-center text-[12px] font-semibold";
  const tot: React.CSSProperties = { backgroundColor: P.panel, color: P.ink };
  return (
    <div className="overflow-x-auto">
      <table className="w-full tabular-nums" style={{ borderCollapse: "separate", borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className={`${th} text-left`} style={{ color: P.quiet }}>
              {corner}
            </th>
            {cols.map((c) => (
              <th key={c} className={th} style={{ color: P.quiet }}>
                {c}
              </th>
            ))}
            <th className={th} style={{ color: P.quiet }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th className="whitespace-nowrap px-1.5 text-left text-[13px] font-semibold" style={{ color: P.ink }}>
                {r}
              </th>
              {cols.map((c) => {
                const v = value(r, c);
                return (
                  <td
                    key={c}
                    onClick={onPick ? () => onPick(r, c) : undefined}
                    className="min-w-[70px] rounded-lg px-1 py-2.5 text-center text-[14px] font-bold"
                    style={{
                      ...heat(v, max),
                      cursor: onPick ? "pointer" : undefined,
                      boxShadow: picked?.(r, c) ? `inset 0 0 0 2px ${SEVERE.ink}` : undefined,
                    }}
                  >
                    {v}
                  </td>
                );
              })}
              <td className="rounded-lg px-1 py-2.5 text-center text-[14px] font-bold" style={tot}>
                {rowTotal(r)}
              </td>
            </tr>
          ))}
          <tr>
            <th className="whitespace-nowrap px-1.5 text-left text-[13px] font-semibold" style={{ color: P.ink }}>
              {totalRowLabel}
            </th>
            {cols.map((c) => (
              <td key={c} className="rounded-lg px-1 py-2.5 text-center text-[14px] font-bold" style={tot}>
                {colTotal(c)}
              </td>
            ))}
            <td className="rounded-lg px-1 py-2.5 text-center text-[14px] font-bold" style={tot}>
              {grand}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Full report ──────────────────────────────────────────────────────── */

function FullReport({
  F,
  setF,
  onSeeSevere,
}: {
  F: Filters;
  setF: (f: Filters) => void;
  onSeeSevere: () => void;
}) {
  const [tab, setTab] = useState<PeopleKey>("location");
  const toggle = (k: Key, v: string) => setF({ ...F, [k]: F[k] === v ? "" : v });

  const di = F.disease ? HC_DISEASES.findIndex((d) => d.n === F.disease) : -1;
  const base = people(F);
  const T = tally(base, di);
  const active = FILTER_ORDER.filter((k) => F[k]).map((k) => F[k]);
  const where = PEOPLE_DIMS.filter((k) => F[k])
    .map((k) => F[k])
    .join(", ");
  const condName = F.disease ? F.disease.toLowerCase() : "a chronic condition";

  /* 3. Conditions, on the current people filters. */
  const dRows = HC_DISEASES.map((d, i) => {
    const t = { n: 0, s: [0, 0, 0] };
    for (const r of base) {
      const c = r.conds.find((x) => x.d === i);
      if (c) {
        t.n++;
        t.s[c.s]++;
      }
    }
    return { d, t };
  }).sort((a, b) => b.t.n - a.t.n);
  const dMax = Math.max(1, ...dRows.map((x) => x.t.n));

  /* 4. Where the severe employees are. */
  const byDim = Object.fromEntries(
    PEOPLE_DIMS.map((k) => {
      const rows = people(F, [k]);
      return [k, DIMS[k].opts.map((o) => ({ o, t: tally(rows.filter((r) => r[k] === o), di) }))];
    })
  ) as Record<PeopleKey, { o: string; t: ReturnType<typeof tally> }[]>;
  const list = [...byDim[tab]];
  if (tab !== "ageGroup") list.sort((a, b) => b.t.s[2] - a.t.s[2]);
  const topSev = Math.max(...list.map((x) => x.t.s[2]));
  const maxRate = Math.max(0.0001, ...list.map((x) => (x.t.n ? x.t.s[2] / x.t.n : 0)));
  const tot = tally(people(F, [tab]), di);

  /* 5. Location × department. */
  const hRows = people(F, ["location", "department"]);
  const locs = F.location ? [F.location] : HC_LOCATIONS;
  const depts = F.department ? [F.department] : HC_DEPARTMENTS;
  const cell: Record<string, number> = {};
  for (const l of locs) for (const d of depts) cell[`${l}|${d}`] = 0;
  for (const r of hRows) {
    const key = `${r.location}|${r.department}`;
    if (key in cell && sevOf(r, di) === 2) cell[key]++;
  }

  const th = "whitespace-nowrap px-3 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-[0.04em]";
  const td = "px-3 py-2.5 text-right text-[14px]";

  return (
    <>
      {/* ── Filters ── */}
      <Card className="!py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="mr-1 text-[13px] font-semibold" style={{ color: P.quiet }}>
            Filter:
          </span>
          {FILTER_ORDER.map((k) => (
            <Dropdown
              key={k}
              label={DIMS[k].label}
              width={k === "disease" ? 210 : 170}
              value={F[k] || ALL}
              onChange={(v) => setF({ ...F, [k]: v === ALL ? "" : v })}
              options={[{ value: ALL, label: DIMS[k].all }, ...DIMS[k].opts.map((o) => ({ value: o, label: o }))]}
            />
          ))}
          <button
            onClick={() => setF(EMPTY)}
            className="ml-auto h-10 rounded-xl px-4 text-[13px] font-semibold text-white"
            style={{ backgroundColor: P.purple }}
          >
            Clear filters
          </button>
        </div>
        <p className="mt-3 text-[13px]" style={{ color: P.quiet }}>
          Showing: <b style={{ color: P.ink }}>{active.length ? active.join(" · ") : "all employees"}</b>
        </p>
      </Card>

      {/* ── 1. Summary ── */}
      <Section n={1} title="Summary" sub="From employees checked, to those with a chronic condition, to how serious it is.">
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_2.2fr]">
          <Card className="flex flex-col justify-center">
            <div className="text-[40px] font-extrabold leading-none tracking-[-0.03em] tabular-nums" style={{ color: P.purple }}>
              {nf(T.n)}
            </div>
            <div className="mt-2 text-[14px] font-semibold" style={{ color: P.ink }}>
              Employees checked
            </div>
            <div className="text-[12.5px]" style={{ color: P.quiet }}>
              completed the Annual Health Check
            </div>
          </Card>
          <div className="hidden items-center lg:flex" style={{ color: P.lilac }}>
            <ArrowRight size={22} />
          </div>
          <Card className="flex flex-col justify-center">
            <div className="text-[40px] font-extrabold leading-none tracking-[-0.03em] tabular-nums" style={{ color: P.ink }}>
              {nf(T.c)}
            </div>
            <div className="mt-2 text-[14px] font-semibold" style={{ color: P.ink }}>
              Have a chronic condition
            </div>
            <div className="text-[12.5px]" style={{ color: P.quiet }}>
              {pct(T.c, T.n)} of employees checked{F.disease ? ` · ${F.disease}` : ""}
            </div>
          </Card>
          <div className="hidden items-center lg:flex" style={{ color: P.lilac }}>
            <ArrowRight size={22} />
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {SEV.map((s, i) => {
              const severe = i === 2;
              return (
                <div
                  key={s.label}
                  onClick={severe ? onSeeSevere : undefined}
                  title={severe ? "See only these employees" : undefined}
                  className={`flex flex-col justify-center rounded-[20px] p-5 ${severe ? "cursor-pointer transition-shadow hover:shadow-md" : ""}`}
                  style={{ backgroundColor: s.wash, border: severe ? `1px solid ${s.color}` : "1px solid transparent" }}
                >
                  <div className="text-[34px] font-extrabold leading-none tracking-[-0.03em] tabular-nums" style={{ color: s.ink }}>
                    {nf(T.s[i])}
                  </div>
                  <div className="mt-2 text-[14px] font-bold" style={{ color: s.ink }}>
                    {severe ? "Severe · high risk" : s.label}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: P.body }}>
                    {s.note}
                  </div>
                  {severe && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: s.ink }}>
                      See these employees <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-[20px] px-6 py-4 text-[15.5px] leading-relaxed" style={{ backgroundColor: P.panel, color: P.body }}>
          {T.n ? (
            <>
              Out of <b style={{ color: P.ink }}>{nf(T.n)} employees</b>
              {where ? ` (${where})` : ""} who completed the Annual Health Check,{" "}
              <b style={{ color: P.ink }}>
                {nf(T.c)} ({pct(T.c, T.n)})
              </b>{" "}
              have {condName}. Of these, <b style={{ color: P.ink }}>{nf(T.s[0])}</b> are mild,{" "}
              <b style={{ color: P.ink }}>{nf(T.s[1])}</b> are moderate and{" "}
              <b style={{ color: SEVERE.ink }}>{nf(T.s[2])} are severe</b>. The severe group is{" "}
              <b style={{ color: SEVERE.ink }}>{pct(T.s[2], T.n)} of all employees checked</b> and needs urgent medical attention.
            </>
          ) : (
            "No employees match these filters."
          )}
        </div>
      </Section>

      {/* ── 2. Who was checked ── */}
      <Section
        n={2}
        title="Who was checked"
        sub="Employees who completed the health check, by location, department, age group and gender. Click any row to filter the report."
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {PEOPLE_DIMS.map((k) => {
            const rows = people(F, [k]);
            const total = rows.length || 1;
            const cnt: Record<string, number> = Object.fromEntries(DIMS[k].opts.map((o) => [o, 0]));
            for (const r of rows) cnt[r[k]]++;
            const opts = [...DIMS[k].opts];
            if (k !== "ageGroup") opts.sort((a, b) => cnt[b] - cnt[a]);
            const mx = Math.max(1, ...Object.values(cnt));
            return (
              <Card key={k} className="!p-5">
                <h3 className="mb-2.5 text-[15px] font-semibold" style={{ color: P.ink }}>
                  By {DIMS[k].label.toLowerCase()}
                </h3>
                {opts.map((o) => (
                  <button
                    key={o}
                    onClick={() => toggle(k, o)}
                    aria-pressed={F[k] === o}
                    className="-mx-2 block w-[calc(100%+16px)] rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#F7F6FB]"
                    style={F[k] === o ? { backgroundColor: P.panel } : undefined}
                  >
                    <span className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span style={{ color: P.body }}>{o}</span>
                      <span className="font-bold tabular-nums" style={{ color: P.ink }}>
                        {nf(cnt[o])}
                        <small className="ml-1 font-medium" style={{ color: P.quiet }}>
                          {pct0(cnt[o], total)}
                        </small>
                      </span>
                    </span>
                    <span className="mt-1 block h-[7px] overflow-hidden rounded" style={{ backgroundColor: P.track }}>
                      <span className="block h-full rounded" style={{ width: `${(100 * cnt[o]) / mx}%`, backgroundColor: P.purple }} />
                    </span>
                  </button>
                ))}
              </Card>
            );
          })}
        </div>
      </Section>

      {/* ── 3. Conditions ── */}
      <Section
        n={3}
        title="Which chronic conditions were found"
        sub="Number of employees with each condition, split into mild, moderate and severe. Click a condition to see only that condition."
      >
        <Card>
          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]" style={{ color: P.quiet }}>
            {SEV.map((s) => (
              <span key={s.label}>
                <Dot color={s.color} />
                <b style={{ color: P.ink }}>{s.label}</b>
              </span>
            ))}
            <span>Some employees have more than one condition, so these numbers add up to more than the total.</span>
          </div>
          <div className="grid grid-cols-1 gap-x-9 gap-y-1 lg:grid-cols-2">
            {dRows.map(({ d, t }) => (
              <button
                key={d.n}
                onClick={() => toggle("disease", d.n)}
                aria-pressed={F.disease === d.n}
                className="-mx-2.5 block w-[calc(100%+20px)] rounded-[10px] p-2.5 text-left transition-colors hover:bg-[#F7F6FB]"
                style={F.disease === d.n ? { backgroundColor: P.panel } : undefined}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-[14px] font-semibold" style={{ color: P.ink }}>
                      {d.n}
                    </span>
                    <span className="block text-[12px]" style={{ color: P.quiet }}>
                      {d.sub}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[18px] font-extrabold tabular-nums" style={{ color: P.ink }}>
                      {nf(t.n)}
                    </span>
                    <span className="block text-[12px]" style={{ color: P.quiet }}>
                      {pct(t.n, T.n)} of employees
                    </span>
                  </span>
                </span>
                <span
                  className="mt-1.5 flex h-3 overflow-hidden rounded-md"
                  style={{ width: `${Math.max(4, (100 * t.n) / dMax)}%`, backgroundColor: P.track }}
                >
                  {t.n > 0 && SEV.map((s, i) => <span key={s.label} style={{ width: `${(100 * t.s[i]) / t.n}%`, backgroundColor: s.color }} />)}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-x-4 text-[12px] tabular-nums" style={{ color: P.quiet }}>
                  {SEV.map((s, i) => (
                    <span key={s.label} style={i === 2 ? { color: s.ink, fontWeight: 600 } : undefined}>
                      <Dot color={s.color} />
                      {s.label} {nf(t.s[i])}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </Section>

      {/* ── 4. Where is the risk ── */}
      <Section
        n={4}
        title="Where are the high-risk employees?"
        sub={`Employees in the severe (high-risk) group${F.disease ? ` for ${F.disease}` : ""}, by location, department, age group and gender. Click a card or a row to filter.`}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PEOPLE_DIMS.map((k) => {
            const top = [...byDim[k]].sort((a, b) => b.t.s[2] - a.t.s[2])[0];
            const has = top && top.t.s[2] > 0;
            return (
              <button
                key={k}
                onClick={has ? () => toggle(k, top.o) : undefined}
                className="rounded-[16px] bg-white px-4 py-3.5 text-left"
                style={{ border: `1px solid ${P.line}`, borderTop: `4px solid ${SEVERE.color}` }}
              >
                <span className="block text-[11.5px] font-semibold uppercase tracking-[0.05em]" style={{ color: P.quiet }}>
                  {DIMS[k].label} with most severe cases
                </span>
                <span className="mb-0.5 mt-1.5 block text-[19px] font-extrabold" style={{ color: P.ink }}>
                  {has ? top.o : "–"}
                </span>
                <span className="block text-[13px]" style={{ color: P.body }}>
                  {has ? (
                    <>
                      <b style={{ color: SEVERE.ink }}>{nf(top.t.s[2])} severe</b> out of {nf(top.t.n)} checked ({pct(top.t.s[2], top.t.n)})
                    </>
                  ) : (
                    "No severe cases"
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <Card>
          <Toggle options={PEOPLE_DIMS.map((k) => ({ key: k, label: `By ${DIMS[k].label.toLowerCase()}` }))} value={tab} onChange={setTab} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse tabular-nums">
              <thead>
                <tr style={{ color: P.quiet, borderBottom: `2px solid ${P.line}` }}>
                  <th className={`${th} !text-left`}>{DIMS[tab].label}</th>
                  <th className={th}>Employees checked</th>
                  <th className={th}>Have a condition</th>
                  <th className={th}>Mild</th>
                  <th className={th}>Moderate</th>
                  <th className={th}>Severe</th>
                  <th className={th}>Severe as % of checked</th>
                </tr>
              </thead>
              <tbody>
                {list.map(({ o, t }) => {
                  const isTop = t.s[2] === topSev && topSev > 0;
                  return (
                    <tr
                      key={o}
                      onClick={() => toggle(tab, o)}
                      className="cursor-pointer hover:bg-[#F7F6FB]"
                      style={{ borderBottom: `1px solid ${P.line}`, backgroundColor: isTop ? P.cream : undefined }}
                    >
                      <td className={`${td} !text-left font-semibold`} style={{ color: P.ink }}>
                        {o}
                        {isTop && (
                          <span
                            className="ml-2 rounded-full px-2 py-0.5 align-middle text-[10.5px] font-bold uppercase tracking-[0.04em]"
                            style={{ backgroundColor: SEVERE.wash, color: SEVERE.ink }}
                          >
                            Most severe
                          </span>
                        )}
                      </td>
                      <td className={td}>{nf(t.n)}</td>
                      <td className={td}>
                        {nf(t.c)}{" "}
                        <span className="text-[12px]" style={{ color: P.quiet }}>
                          ({pct0(t.c, t.n)})
                        </span>
                      </td>
                      <td className={`${td} font-semibold`} style={{ color: SEV[0].ink }}>
                        {nf(t.s[0])}
                      </td>
                      <td className={`${td} font-semibold`} style={{ color: SEV[1].ink }}>
                        {nf(t.s[1])}
                      </td>
                      <td className={`${td} font-extrabold`} style={{ color: SEVERE.ink }}>
                        {nf(t.s[2])}
                      </td>
                      <td className={td}>
                        <span className="inline-flex items-center justify-end gap-2">
                          {pct(t.s[2], t.n)}
                          <span className="inline-block h-2 w-[110px] overflow-hidden rounded" style={{ backgroundColor: P.track }}>
                            <span
                              className="block h-full rounded"
                              style={{ width: `${t.n ? (100 * (t.s[2] / t.n)) / maxRate : 0}%`, backgroundColor: SEVERE.color }}
                            />
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${P.line}` }}>
                  <td className={`${td} !text-left font-semibold`}>Total</td>
                  <td className={`${td} font-bold`}>{nf(tot.n)}</td>
                  <td className={`${td} font-bold`}>{nf(tot.c)}</td>
                  <td className={`${td} font-semibold`} style={{ color: SEV[0].ink }}>
                    {nf(tot.s[0])}
                  </td>
                  <td className={`${td} font-semibold`} style={{ color: SEV[1].ink }}>
                    {nf(tot.s[1])}
                  </td>
                  <td className={`${td} font-extrabold`} style={{ color: SEVERE.ink }}>
                    {nf(tot.s[2])}
                  </td>
                  <td className={`${td} font-bold`}>{pct(tot.s[2], tot.n)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </Section>

      {/* ── 5. Location × department ── */}
      <Section
        n={5}
        title="High-risk hotspots: location × department"
        sub="Number of severe (high-risk) employees in each location and department. The darker the colour, the more severe cases."
      >
        <Card>
          <HeatTable
            rows={locs}
            cols={depts}
            value={(l, d) => cell[`${l}|${d}`]}
            rowTotal={(l) => depts.reduce((s, d) => s + cell[`${l}|${d}`], 0)}
            colTotal={(d) => locs.reduce((s, l) => s + cell[`${l}|${d}`], 0)}
            grand={Object.values(cell).reduce((a, b) => a + b, 0)}
          />
        </Card>
      </Section>

      {/* ── 6. Definitions ── */}
      <Section n={6} title="What mild, moderate and severe mean" sub="Each employee is placed in the group of their most serious condition.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            "Readings slightly above normal. Can usually be managed with diet, exercise and a re-check in 6 months. Example: BP 130–139 / 85–89, HbA1c 5.7–6.4%.",
            "Condition is present and needs a doctor's consultation, usually medicines and regular follow-up. Example: BP 140–159 / 90–99, HbA1c 6.5–8.9%.",
            "Readings are dangerously high or the condition is advanced. Needs urgent medical attention. Example: BP 160 / 100 or above, HbA1c 9% or above, known heart or kidney disease.",
          ].map((text, i) => (
            <div key={SEV[i].label} className="rounded-[16px] px-4 py-3.5 text-[13px]" style={{ backgroundColor: SEV[i].wash, color: P.body }}>
              <b className="mb-1 block text-[14px]" style={{ color: SEV[i].ink }}>
                {i === 2 ? "Severe (high risk)" : SEV[i].label}
              </b>
              {text}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ─── Severe employees only ────────────────────────────────────────────── */

function SevereReport({ SF, setSF }: { SF: Filters; setSF: (f: Filters) => void }) {
  const [stab, setStab] = useState<PeopleKey>("location");
  const funnelRef = useRef<HTMLDivElement>(null);

  const N = SEVERE_PEOPLE.length;
  const total = HC_DATA.length;
  const sRows = (except: Key[] = []) =>
    SEVERE_PEOPLE.filter((r) => FUNNEL_ORDER.every((k) => except.includes(k) || !SF[k] || sMatch(r, k, SF[k])));

  /* 1. At a glance, for the whole severe group. */
  const dAll = sCount(SEVERE_PEOPLE, "disease");
  const topD = topOf(dAll);
  const multi = SEVERE_PEOPLE.filter((r) => r.sevD.length >= 2).length;
  const diseaseOrder = Object.entries(dAll)
    .sort((a, b) => b[1] - a[1])
    .map((x) => x[0]);

  /* 2. Funnel: each step narrows the group above it. */
  let cur = SEVERE_PEOPLE;
  const counts = [N];
  const before: SeverePerson[][] = [];
  for (const k of FUNNEL_ORDER) {
    before.push(cur);
    if (SF[k]) cur = cur.filter((r) => sMatch(r, k, SF[k]));
    counts.push(cur.length);
  }
  const W = (n: number) => 26 + 74 * Math.sqrt(n / (N || 1));
  const shape = (i: number): React.CSSProperties => {
    const t = W(counts[i]);
    const b = i < FUNNEL_ORDER.length ? W(counts[i + 1]) : W(counts[i]) * 0.82;
    return {
      clipPath: `polygon(${50 - t / 2}% 0, ${50 + t / 2}% 0, ${50 + b / 2}% 100%, ${50 - b / 2}% 100%)`,
      backgroundColor: FUNNEL[i],
      transition: "clip-path .35s",
    };
  };
  const fin = counts[counts.length - 1];
  const any = FUNNEL_ORDER.some((k) => SF[k]);
  const who = SF.gender ? SAY.gender(SF.gender) : "employees";
  const bits = (["ageGroup", "disease", "department", "location"] as Key[]).map((k) => SAY[k](SF[k])).filter(Boolean);

  const pickStep = (k: Key, v: string) => {
    const next = { ...SF, [k]: v };
    FUNNEL_ORDER.slice(FUNNEL_ORDER.indexOf(k) + 1).forEach((x) => (next[x] = ""));
    setSF(next);
  };

  /* 3. Condition × chosen dimension. */
  const hr = sRows([stab, "disease"]);
  const cols = DIMS[stab].opts;
  const cell: Record<string, number> = {};
  for (const d of diseaseOrder) for (const c of cols) cell[`${d}|${c}`] = 0;
  for (const r of hr) for (const d of r.sevD) cell[`${d}|${r[stab]}`]++;

  /* 4. Location × department. */
  const r2 = sRows(["location", "department"]);
  const c2: Record<string, number> = {};
  for (const l of HC_LOCATIONS) for (const d of HC_DEPARTMENTS) c2[`${l}|${d}`] = 0;
  for (const r of r2) c2[`${r.location}|${r.department}`]++;

  const funnelRow = "grid grid-cols-1 items-center gap-x-5 gap-y-1.5 md:grid-cols-[250px_1fr_250px]";
  const stepLabel = "mb-1 text-[11px] font-bold uppercase tracking-[0.05em]";
  const shapeBox = "flex h-16 flex-col items-center justify-center text-center";

  return (
    <>
      <Section
        n={1}
        title="Severe (high-risk) employees at a glance"
        sub="Employees with at least one condition at a severe level. They need urgent medical attention."
      >
        <div
          className="grid grid-cols-1 items-center gap-5 rounded-[20px] p-6 md:grid-cols-[1.3fr_1fr_1fr]"
          style={{ background: `linear-gradient(135deg, #fff 0%, ${P.cream} 100%)`, border: `1px solid ${SEVERE.wash}` }}
        >
          <div>
            <div className="text-[52px] font-extrabold leading-none tracking-[-0.03em] tabular-nums" style={{ color: SEVERE.ink }}>
              {nf(N)}
            </div>
            <div className="mt-1.5 text-[16px] font-bold" style={{ color: P.ink }}>
              Severe (high-risk) employees
            </div>
            <div className="text-[13px]" style={{ color: P.quiet }}>
              {pct(N, total)} of the {nf(total)} employees checked
            </div>
          </div>
          {[
            { v: topD[0], l: "Most common severe condition", s: `${nf(topD[1])} of the ${nf(N)} severe employees` },
            { v: nf(multi), l: "Have 2 or more severe conditions", s: `${pct(multi, N)} of severe employees · highest priority` },
          ].map((m) => (
            <div key={m.l} className="md:pl-5" style={{ borderLeft: `1px solid ${SEVERE.wash}` }}>
              <div className="text-[28px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: SEVERE.ink }}>
                {m.v}
              </div>
              <div className="mt-1 text-[15px] font-bold" style={{ color: P.ink }}>
                {m.l}
              </div>
              <div className="text-[13px]" style={{ color: P.quiet }}>
                {m.s}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        n={2}
        title="Funnel: condition → location → department → age group → gender"
        sub="Pick one option at each step to narrow down the severe employees. If you skip a step, the right side shows which option has the most."
      >
        <Card>
          <div ref={funnelRef} className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="flex-1 rounded-xl px-4 py-3 text-[15px] leading-relaxed" style={{ backgroundColor: P.panel, color: P.body }}>
              {any ? (
                <>
                  Showing{" "}
                  <b style={{ color: SEVERE.ink }}>
                    {nf(fin)} severe {who}
                  </b>{" "}
                  {bits.join(", ")}. That is {pct(fin, N)} of all {nf(N)} severe employees.
                </>
              ) : (
                <>
                  Showing all <b style={{ color: SEVERE.ink }}>{nf(N)} severe employees</b>. Start by choosing a condition in step 1.
                </>
              )}
            </p>
            <button
              onClick={() => setSF(EMPTY)}
              className="h-10 rounded-xl bg-white px-4 text-[13px] font-semibold"
              style={{ border: `1px solid ${P.line}`, color: P.ink }}
            >
              Start over
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className={funnelRow}>
              <div>
                <div className={stepLabel} style={{ color: P.quiet }}>
                  Start
                </div>
                <div className="text-[14px] font-bold" style={{ color: P.ink }}>
                  All severe employees
                </div>
              </div>
              <div className={shapeBox} style={{ ...shape(0), color: P.ink }}>
                <b className="text-[21px] font-extrabold leading-tight tabular-nums">{nf(N)}</b>
                <span className="text-[12.5px]">severe employees</span>
              </div>
              <div className="text-[13px] leading-normal" style={{ color: P.quiet }}>
                {pct(N, total)} of all {nf(total)}
                <br />
                employees checked
              </div>
            </div>
            {FUNNEL_ORDER.map((k, j) => {
              const i = j + 1;
              const c = sCount(before[j], k);
              const v = SF[k];
              const n = counts[i];
              const prev = counts[i - 1];
              const opts = [...DIMS[k].opts];
              if (k !== "ageGroup") opts.sort((a, b) => c[b] - c[a]);
              const top = topOf(c);
              const words = v ? (k === "gender" ? SAY[k](v) : `employees ${SAY[k](v)}`) : `employees, ${DIMS[k].all.toLowerCase()}`;
              return (
                <div key={k} className={funnelRow}>
                  <div>
                    <div className={stepLabel} style={{ color: P.quiet }}>
                      Step {i} · {DIMS[k].label}
                    </div>
                    <Dropdown
                      label={DIMS[k].label}
                      width={250}
                      value={v || ALL}
                      onChange={(x) => pickStep(k, x === ALL ? "" : x)}
                      options={[{ value: ALL, label: DIMS[k].all }, ...opts.map((o) => ({ value: o, label: o, count: nf(c[o]) }))]}
                    />
                  </div>
                  <div className={shapeBox} style={{ ...shape(i), color: P.ink }}>
                    <b className="text-[21px] font-extrabold leading-tight tabular-nums">{nf(n)}</b>
                    <span className="text-[12.5px]">{words}</span>
                  </div>
                  <div className="text-[13px] leading-normal" style={{ color: P.quiet }}>
                    {v ? (
                      <>
                        <b style={{ color: P.ink }}>{pct(n, prev)}</b> of the step above
                        <br />
                        {nf(prev - n)} employees not included
                      </>
                    ) : (
                      <>
                        Not chosen, everyone continues.
                        <br />
                        Most: <b style={{ color: P.ink }}>{top[0]}</b> ({nf(top[1])})
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Section>

      <Section
        n={3}
        title="Risk heat map: where each severe condition sits"
        sub="Each box is the number of severe employees. The darker the colour, the more severe employees. Follows your funnel choices."
      >
        <Card>
          <Toggle
            options={PEOPLE_DIMS.map((k) => ({ key: k, label: `Condition × ${DIMS[k].label}` }))}
            value={stab}
            onChange={setStab}
          />
          <div className="mt-3">
            <HeatTable
              corner="Severe condition"
              rows={diseaseOrder}
              cols={cols}
              value={(d, c) => cell[`${d}|${c}`]}
              rowTotal={(d) => cols.reduce((s, c) => s + cell[`${d}|${c}`], 0)}
              colTotal={(c) => hr.filter((r) => r[stab] === c).length}
              grand={hr.length}
              totalRowLabel="All severe employees"
              picked={(d, c) => SF.disease === d && SF[stab] === c}
              onPick={(d, c) => {
                setSF({ ...EMPTY, disease: d, [stab]: c });
                funnelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </div>
          <p className="mt-2.5 text-[12.5px]" style={{ color: P.quiet }}>
            An employee with two severe conditions appears in two rows, so “All severe employees” counts each person only once.
          </p>
        </Card>
      </Section>

      <Section
        n={4}
        title="Risk heat map: location × department"
        sub="Where the severe employees work. Follows your funnel choices for condition, age group and gender."
      >
        <Card>
          <HeatTable
            rows={HC_LOCATIONS}
            cols={HC_DEPARTMENTS}
            value={(l, d) => c2[`${l}|${d}`]}
            rowTotal={(l) => HC_DEPARTMENTS.reduce((s, d) => s + c2[`${l}|${d}`], 0)}
            colTotal={(d) => HC_LOCATIONS.reduce((s, l) => s + c2[`${l}|${d}`], 0)}
            grand={r2.length}
            picked={(l, d) => SF.location === l && SF.department === d}
          />
        </Card>
      </Section>
    </>
  );
}

/* ─── View option 2 ────────────────────────────────────────────────────── */

export default function ViewTwo() {
  const [mode, setMode] = useState<"all" | "severe">("all");
  const [F, setF] = useState<Filters>(EMPTY);
  const [SF, setSF] = useState<Filters>(EMPTY);

  const tabs = [
    { key: "all" as const, label: "Full Report", icon: <ClipboardList size={17} />, badge: null },
    { key: "severe" as const, label: "Severe Employees Only", icon: <ShieldAlert size={17} />, badge: nf(SEVERE_PEOPLE.length) },
  ];
  const go = (m: "all" | "severe") => {
    setMode(m);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="animate-stagger min-w-0 space-y-5">
      {/* ── View tabs ── */}
      <div
        className="-mx-2 flex flex-wrap items-center justify-center gap-3 rounded-[20px] px-4 py-3.5"
        style={{ background: "linear-gradient(90deg, #EFEAFB 0%, #F7F1F6 55%, #FCF1E8 100%)" }}
      >
        {tabs.map((t) => {
          const active = mode === t.key;
          return (
            <button
              key={t.key}
              aria-pressed={active}
              onClick={() => go(t.key)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-all"
              style={
                active
                  ? { backgroundColor: P.purple, color: "#fff", boxShadow: "0 4px 12px rgba(79,62,150,0.3)" }
                  : { backgroundColor: "#fff", color: P.body, border: `1px solid ${P.line}` }
              }
            >
              {t.icon}
              {t.label}
              {t.badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-[12px] tabular-nums"
                  style={active ? { backgroundColor: "rgba(255,255,255,0.25)" } : { backgroundColor: SEVERE.wash, color: SEVERE.ink }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: P.purple }}>
            Annual Health Check 2026
          </p>
          <h1 className="text-[30px] font-semibold tracking-[-0.02em]" style={{ color: P.ink }}>
            Chronic Disease Report
          </h1>
          <p className="text-[14px]" style={{ color: P.quiet }}>
            How many employees were checked, what conditions were found, and where the high-risk employees are.
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11.5px] font-semibold"
          style={{ backgroundColor: P.panel, color: P.deep }}
        >
          Sample data for demonstration
        </span>
      </div>

      {mode === "all" ? (
        <FullReport
          F={F}
          setF={setF}
          onSeeSevere={() => {
            setSF(F);
            go("severe");
          }}
        />
      ) : (
        <SevereReport SF={SF} setSF={setSF} />
      )}

      <p className="pt-2 text-[12px]" style={{ color: P.quiet }}>
        All figures are made-up sample data for 6,000 employees, for demonstration only. They will be replaced with your Annual
        Health Check results.
      </p>
    </div>
  );
}
