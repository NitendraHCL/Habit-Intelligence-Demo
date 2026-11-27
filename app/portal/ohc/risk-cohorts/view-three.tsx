"use client";

import { useState } from "react";
import { CalendarDays, Check, ClipboardCheck, HeartPulse, Triangle } from "lucide-react";

import { Card, Dropdown, P, Toggle } from "./view-one";
import {
  G_DAYS,
  G_DIMS,
  G_FINDINGS,
  G_LABEL,
  G_PARAMS,
  G_PEOPLE,
  G_RISKS,
  type GKey,
  type GPerson,
} from "@/lib/data/ahc-granular";

/* ─── Colours, from View 1 ─────────────────────────────────────────────── */

const ROSE = { color: "#D98C8C", wash: "#F6CDD0", ink: "#7A2B33" };
const SAND = { color: "#EBC08F", wash: "#F6DEC6", ink: "#6B4318" };
const GREEN = { color: "#8DB870", wash: "#E3EED9", ink: "#2F6B14" };

const KEYS: GKey[] = ["department", "location", "ageGroup", "gender"];
const ALL = "all";
const MIN_GROUP = 10;

const nf = (n: number) => n.toLocaleString("en-IN");
const pc = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
const small = (n: number) => (n > 0 && n < 5 ? "<5" : nf(n));
/** "High LDL cholesterol" → "high LDL cholesterol", for use mid-sentence. */
const mid = (label: string) => label.charAt(0).toLowerCase() + label.slice(1);

const CHECKED = G_PEOPLE.filter((p) => p.day >= 0);

type Narrow = Partial<Record<GKey, string>>;
const matches = (p: GPerson, f: Narrow) => KEYS.every((k) => !f[k] || p[k] === f[k]);

/* ─── Building blocks ──────────────────────────────────────────────────── */

function Head({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-[760px]">
        <h3 className="text-[19px] font-semibold tracking-[-0.01em]" style={{ color: P.ink }}>
          {title}
        </h3>
        <p className="text-[13.5px]" style={{ color: P.quiet }}>
          {sub}
        </p>
      </div>
      {right}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl px-4 py-3 text-[13.5px]" style={{ backgroundColor: P.panel, color: P.deep }}>
      {children}
    </p>
  );
}

function Bar({ value, color, className }: { value: number; color: string; className?: string }) {
  return (
    <span className={`block h-2 overflow-hidden rounded-full ${className ?? ""}`} style={{ backgroundColor: P.track }}>
      <span className="block h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
    </span>
  );
}

function Swatch({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
}

/** Location / age group / gender dropdowns that narrow the people shown. */
function Narrowing({ value, onChange, hide }: { value: Narrow; onChange: (f: Narrow) => void; hide?: GKey[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <span className="text-[13px] font-medium" style={{ color: P.quiet }}>
        Filter by
      </span>
      {(["location", "ageGroup", "gender"] as GKey[])
        .filter((k) => !hide?.includes(k))
        .map((k) => (
          <Dropdown
            key={k}
            label={G_LABEL[k]}
            width={190}
            value={value[k] ?? ALL}
            onChange={(v) => onChange({ ...value, [k]: v === ALL ? undefined : v })}
            options={[{ value: ALL, label: `${G_LABEL[k]}: All` }, ...G_DIMS[k].map((o) => ({ value: o, label: o }))]}
          />
        ))}
    </div>
  );
}

const DIM_OPTIONS = KEYS.map((k) => ({ key: k, label: G_LABEL[k] }));

/* ─── 1. Participation ─────────────────────────────────────────────────── */

function progress(rows: GPerson[]) {
  const done = rows.filter((p) => p.day >= 0);
  const checks = G_DAYS.map(() => 0);
  const consults = G_DAYS.map(() => 0);
  for (const p of done) {
    checks[p.day]++;
    if (p.consultDay >= 0) consults[p.consultDay]++;
  }
  for (let i = 1; i < checks.length; i++) {
    checks[i] += checks[i - 1];
    consults[i] += consults[i - 1];
  }
  return {
    eligible: rows.length,
    completed: done.length,
    digitized: done.filter((p) => p.digitized).length,
    consulted: done.filter((p) => p.consultDay >= 0).length,
    checks,
    consults,
  };
}

function ProgressChart({ s }: { s: ReturnType<typeof progress> }) {
  const W = 470;
  const H = 230;
  const top = 18;
  const max = Math.max(1, s.eligible);
  const x = (i: number) => (i / (G_DAYS.length - 1)) * W;
  const y = (v: number) => top + (1 - v / max) * (H - top);
  const line = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = (a: number[]) => `${line(a)} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W + 130} ${H + 26}`} className="mt-4 w-full" role="img" aria-label="Checks done and consultations over the cycle">
      <line x1={0} x2={W} y1={y(max)} y2={y(max)} stroke={P.ink} strokeDasharray="4 4" strokeWidth={1.2} />
      <path d={area(s.checks)} fill={P.panel} />
      <path d={area(s.consults)} fill={SAND.wash} opacity={0.8} />
      <path d={line(s.checks)} fill="none" stroke={P.purple} strokeWidth={2.4} />
      <path d={line(s.consults)} fill="none" stroke={SAND.color} strokeWidth={2.4} />
      <line x1={0} x2={W} y1={H} y2={H} stroke={P.line} />
      <text x={W + 10} y={y(max) + 4} fontSize={12} fill={P.body}>
        <tspan fontWeight={700}>{nf(s.eligible)}</tspan> eligible
      </text>
      <text x={W + 10} y={Math.max(y(max) + 20, y(s.completed) + 4)} fontSize={12} fill={P.purple}>
        <tspan fontWeight={700}>{nf(s.completed)}</tspan> checks done
      </text>
      <text x={W + 10} y={Math.max(y(max) + 36, y(s.consulted) + 4)} fontSize={12} fill={SAND.ink}>
        <tspan fontWeight={700}>{nf(s.consulted)}</tspan> consulted
      </text>
      {G_DAYS.map((d, i) =>
        i % 5 === 0 ? (
          <text key={d.label} x={x(i)} y={H + 18} fontSize={11} fill={P.quiet}>
            {d.label}
          </text>
        ) : null
      )}
    </svg>
  );
}

function Participation() {
  const [dim, setDim] = useState<GKey>("department");
  const [picked, setPicked] = useState<string | null>(null);

  const rows = [
    { name: "All employees", value: null as string | null, s: progress(G_PEOPLE) },
    ...G_DIMS[dim].map((g) => ({ name: g, value: g as string | null, s: progress(G_PEOPLE.filter((p) => p[dim] === g)) })),
  ];
  const sel = rows.find((r) => r.value === picked) ?? rows[0];
  const s = sel.s;
  const kpis = [
    { label: "Eligible employees", value: s.eligible, sub: "Invited to this cycle", color: P.ink },
    { label: "Checks completed", value: s.completed, sub: `${pc(s.completed, s.eligible)}% of eligible`, color: P.purple },
    { label: "Reports digitized", value: s.digitized, sub: `${pc(s.digitized, s.completed)}% of completed`, color: P.mid },
    { label: "Consultations done", value: s.consulted, sub: `${pc(s.consulted, s.completed)}% of completed`, color: SAND.color },
  ];

  return (
    <Card>
      <Head
        title="AHC Participation"
        sub="Health checks completed and reports digitized, group by group. Select a row to see that group's progress over time."
        right={
          <Toggle
            options={DIM_OPTIONS}
            value={dim}
            onChange={(k) => {
              setDim(k);
              setPicked(null);
            }}
          />
        }
      />
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1fr_1.15fr]">
        <div>
          <div className="grid grid-cols-[150px_1fr_92px_64px] gap-3 px-2.5 pb-2 text-[12px] font-semibold" style={{ color: P.body }}>
            <span>{G_LABEL[dim]}</span>
            <span>Share of eligible employees</span>
            <span className="text-right">Completed</span>
            <span className="text-right">Digitized</span>
          </div>
          {rows.map((r) => {
            const active = r === sel;
            return (
              <button
                key={r.name}
                onClick={() => setPicked(r.value)}
                aria-pressed={active}
                className="grid w-full grid-cols-[150px_1fr_92px_64px] items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#F7F6FB]"
                style={active ? { backgroundColor: P.panel, boxShadow: `inset 3px 0 0 ${P.purple}` } : undefined}
              >
                <span>
                  <span className="block text-[13.5px] font-semibold" style={{ color: P.ink }}>
                    {r.name}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: P.quiet }}>
                    {nf(r.s.eligible)} eligible
                  </span>
                </span>
                <span className="flex h-3 overflow-hidden rounded" style={{ backgroundColor: P.track }}>
                  <span style={{ width: `${(100 * r.s.digitized) / r.s.eligible}%`, backgroundColor: P.purple }} />
                  <span style={{ width: `${(100 * (r.s.completed - r.s.digitized)) / r.s.eligible}%`, backgroundColor: P.sand }} />
                </span>
                <span className="text-right text-[14px] font-bold tabular-nums" style={{ color: P.ink }}>
                  {nf(r.s.completed)}{" "}
                  <small className="font-medium" style={{ color: P.quiet }}>
                    {pc(r.s.completed, r.s.eligible)}%
                  </small>
                </span>
                <span className="text-right text-[14px] font-bold tabular-nums" style={{ color: P.ink }}>
                  {nf(r.s.digitized)}
                </span>
              </button>
            );
          })}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 px-2.5 text-[12.5px]" style={{ color: P.body }}>
            <Swatch color={P.purple}>Completed and digitized</Swatch>
            <Swatch color={P.sand}>Completed, report not yet digitized</Swatch>
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="mb-3 text-[15px] font-semibold" style={{ color: P.ink }}>
            {sel.name}: progress over the cycle
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="pl-3" style={{ borderLeft: `3px solid ${k.color}` }}>
                <div className="text-[12px]" style={{ color: P.body }}>
                  {k.label}
                </div>
                <div className="text-[26px] font-bold leading-tight tabular-nums" style={{ color: P.ink }}>
                  {nf(k.value)}
                </div>
                <div className="text-[12px]" style={{ color: P.quiet }}>
                  {k.sub}
                </div>
              </div>
            ))}
          </div>
          <ProgressChart s={s} />
        </div>
      </div>
      <Note>
        {sel.name}: {pc(s.completed, s.eligible)}% of eligible employees have completed their health check,{" "}
        {nf(s.completed - s.digitized)} employee reports are still waiting to be digitized, and {pc(s.consulted, s.completed)}% of
        those checked have seen a doctor.
      </Note>
    </Card>
  );
}

/* ─── 2. Health checks by date ─────────────────────────────────────────── */

const WEEKS = Array.from(new Set(G_DAYS.map((d) => d.week)));

function ChecksByDate() {
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [dayIdx, setDayIdx] = useState(12);
  const [weekIdx, setWeekIdx] = useState(2);
  const [sort, setSort] = useState<"high" | "low">("high");

  const daily = mode === "daily";
  const bars = daily
    ? G_DAYS.map((d, i) => ({ label: d.label, rows: CHECKED.filter((p) => p.day === i) }))
    : WEEKS.map((w) => {
        const days = G_DAYS.filter((d) => d.week === w);
        return { label: `${days[0].label} – ${days[days.length - 1].label}`, rows: CHECKED.filter((p) => G_DAYS[p.day].week === w) };
      });
  const idx = daily ? dayIdx : weekIdx;
  const cur = bars[idx];
  const max = Math.max(1, ...bars.map((b) => b.rows.length));
  const n = cur.rows.length;

  const order = (a: { n: number }, b: { n: number }) => (sort === "high" ? b.n - a.n : a.n - b.n);
  const concerns = G_FINDINGS.map((f) => ({ label: f.short, n: cur.rows.filter(f.test).length })).sort(order);
  const wins = [
    { label: "Healthy bilirubin levels", n: cur.rows.filter((p) => p.bilirubinOk).length },
    { label: "Normal platelet count", n: cur.rows.filter((p) => p.plateletOk).length },
  ].sort(order);

  const list = (items: { label: string; n: number }[], color: string) =>
    items.map((it) => (
      <div key={it.label} className="grid grid-cols-[150px_1fr_38px_38px] items-center gap-3 py-1.5 text-[13px]">
        <span style={{ color: P.ink }}>{it.label}</span>
        <Bar value={pc(it.n, n)} color={color} />
        <span className="text-right font-bold tabular-nums" style={{ color: P.ink }}>
          {small(it.n)}
        </span>
        <span className="text-right text-[12px] tabular-nums" style={{ color: P.quiet }}>
          {it.n >= 5 ? `${pc(it.n, n)}%` : ""}
        </span>
      </div>
    ));

  return (
    <Card>
      <Head
        title="Health checks by date"
        sub={`How many checks were done each ${daily ? "day" : "week"}, with that ${daily ? "day" : "week"}'s wins and concerns. Select a bar to see that ${daily ? "day" : "week"}.`}
        right={
          <Toggle
            options={[
              { key: "daily", label: "Daily" },
              { key: "weekly", label: "Weekly" },
            ]}
            value={mode}
            onChange={setMode}
          />
        }
      />
      <div className="overflow-x-auto pb-2">
        <div className="flex items-end gap-2" style={{ minWidth: daily ? 1280 : undefined }}>
          {bars.map((b, i) => {
            const on = i === idx;
            return (
              <button
                key={b.label}
                onClick={() => (daily ? setDayIdx(i) : setWeekIdx(i))}
                aria-pressed={on}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="text-[12px] font-bold tabular-nums" style={{ color: P.ink }}>
                  {b.rows.length}
                </span>
                <span
                  className="w-full rounded-t-md transition-colors"
                  style={{ height: Math.max(4, (140 * b.rows.length) / max), backgroundColor: on ? P.purple : P.sand }}
                />
                <span className="whitespace-nowrap text-[11.5px]" style={{ color: on ? P.ink : P.quiet, fontWeight: on ? 700 : 400 }}>
                  {b.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl p-5" style={{ backgroundColor: "#F6F5FA" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: P.quiet }}>
              Wins and concerns from health checks {daily ? "on" : "in the week of"}
            </p>
            <p className="text-[17px] font-semibold" style={{ color: P.ink }}>
              {daily ? `${G_DAYS[idx].dow} ${cur.label}` : cur.label}
            </p>
          </div>
          <p className="text-[13.5px]" style={{ color: P.body }}>
            <b style={{ color: P.ink }}>{nf(n)}</b> health checks
          </p>
        </div>
        <div className="my-3 flex items-center gap-2.5 text-[13px]" style={{ color: P.quiet }}>
          Sort
          <Toggle
            options={[
              { key: "high", label: "High to low" },
              { key: "low", label: "Low to high" },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4" style={{ border: `1px solid ${P.line}` }}>
            <p className="mb-1.5 text-[13px]" style={{ color: P.body }}>
              <span className="mr-2 rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ backgroundColor: ROSE.wash, color: ROSE.ink }}>
                Concerns
              </span>
              People with a result that needs attention
            </p>
            {list(concerns, ROSE.color)}
          </div>
          <div className="rounded-xl bg-white p-4" style={{ border: `1px solid ${P.line}` }}>
            <p className="mb-1.5 text-[13px]" style={{ color: P.body }}>
              <span className="mr-2 rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ backgroundColor: GREEN.wash, color: GREEN.ink }}>
                Wins
              </span>
              People with a healthy result
            </p>
            {list(wins, GREEN.color)}
          </div>
        </div>
        <p className="mt-3 text-[12.5px]" style={{ color: P.quiet }}>
          Number of people, and share of that period&apos;s checks. Counts under 5 show as &quot;&lt;5&quot;.
        </p>
      </div>
    </Card>
  );
}

/* ─── 3. Lab findings across groups ────────────────────────────────────── */

const TILE = [
  { upTo: 20, label: "Low, up to 20%", bg: GREEN.wash },
  { upTo: 40, label: "Moderate, 21 to 40%", bg: "#FCEFDD" },
  { upTo: 60, label: "High, 41 to 60%", bg: "#F9D8C3" },
  { upTo: 101, label: "Very high, above 60%", bg: "#EFA9AD" },
];
const HIDDEN_BG = "#F1F1F4";
const HEAT_ROWS = G_FINDINGS.filter((f) => f.heat);

type LabMode = "department" | "location" | "agegender";

function LabFindings() {
  const [mode, setMode] = useState<LabMode>("department");
  const [values, setValues] = useState(false);
  const [narrow, setNarrow] = useState<Narrow>({});

  const base = CHECKED.filter((p) => matches(p, narrow));
  const colKeys: GKey[] = mode === "agegender" ? ["ageGroup", "gender"] : [mode];
  const cols = colKeys.flatMap((k) => G_DIMS[k].map((g) => ({ name: g, rows: base.filter((p) => p[k] === g) })));
  const all = { name: "All", rows: base };

  const grid = HEAT_ROWS.map((f) => {
    const cell = (c: { name: string; rows: GPerson[] }) => {
      const n = c.rows.length;
      return { name: c.name, n, share: n >= MIN_GROUP ? pc(c.rows.filter(f.test).length, n) : null };
    };
    const cells = cols.map(cell);
    const top = Math.max(-1, ...cells.map((c) => c.share ?? -1));
    return { f, all: cell(all), cells, top };
  });

  const common = [...grid].sort((a, b) => (b.all.share ?? 0) - (a.all.share ?? 0))[0];
  let gap: { group: string; finding: string; share: number; allShare: number } | null = null;
  for (const r of grid)
    for (const c of r.cells)
      if (c.share !== null && r.all.share !== null && (!gap || c.share - r.all.share > gap.share - gap.allShare))
        gap = { group: c.name, finding: r.f.label, share: c.share, allShare: r.all.share };

  const template = `170px 76px repeat(${cols.length}, minmax(70px, 1fr))`;
  const tile = (c: { name: string; n: number; share: number | null }, isTop: boolean, key: string) => (
    <div
      key={key}
      title={c.share === null ? `${c.name}: fewer than ${MIN_GROUP} people` : `${c.name}: ${c.share}% of ${nf(c.n)} people`}
      className="relative flex h-[46px] items-center justify-center rounded-xl text-[13px] font-bold tabular-nums"
      style={{ backgroundColor: c.share === null ? HIDDEN_BG : TILE.find((t) => c.share! <= t.upTo)!.bg, color: P.ink }}
    >
      {values && c.share !== null ? `${c.share}%` : ""}
      {isTop && <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: "#B83A3A" }} />}
    </div>
  );

  return (
    <Card>
      <Head
        title="Lab findings across groups"
        sub="Each tile is the share of that group with the finding. Greener is better, redder needs attention. Use the filters to narrow the people shown."
        right={
          <div className="flex flex-wrap items-center gap-4">
            <button
              role="switch"
              aria-checked={values}
              onClick={() => setValues(!values)}
              className="inline-flex items-center gap-2 text-[13px] font-medium"
              style={{ color: P.body }}
            >
              <span className="relative h-5 w-9 rounded-full transition-colors" style={{ backgroundColor: values ? P.purple : "#C9C9D1" }}>
                <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: values ? 18 : 2 }} />
              </span>
              View values
            </button>
            <Toggle
              options={[
                { key: "department", label: "Department" },
                { key: "location", label: "Location" },
                { key: "agegender", label: "Age and gender" },
              ]}
              value={mode}
              onChange={setMode}
            />
          </div>
        }
      />
      <Narrowing value={narrow} onChange={setNarrow} />
      <div className="overflow-x-auto">
        <div className="grid gap-2" style={{ gridTemplateColumns: template, minWidth: 250 + cols.length * 78 }}>
          {[{ name: "Finding", n: null as number | null }, { name: "All", n: base.length }, ...cols.map((c) => ({ name: c.name, n: c.rows.length }))].map(
            (h) => (
              <div
                key={h.name}
                className="flex flex-col items-center justify-center rounded-xl px-1.5 py-2 text-center text-[12px] font-semibold leading-tight"
                style={{ backgroundColor: HIDDEN_BG, color: P.ink }}
              >
                {h.name}
                {h.n !== null && (
                  <span className="text-[11px] font-normal" style={{ color: P.quiet }}>
                    {nf(h.n)}
                  </span>
                )}
              </div>
            )
          )}
          {grid.map((r) => [
            <div
              key={r.f.label}
              className="flex items-center rounded-xl bg-white px-3 text-[13px] font-semibold leading-tight"
              style={{ border: `1px solid ${P.line}`, color: P.ink }}
            >
              {r.f.label}
            </div>,
            tile(r.all, false, `${r.f.label}-all`),
            ...r.cells.map((c) => tile(c, c.share !== null && c.share === r.top, `${r.f.label}-${c.name}`)),
          ])}
        </div>
      </div>
      <div
        className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl px-4 py-3 text-[12.5px]"
        style={{ border: `1px solid ${P.line}`, color: P.body }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: P.quiet }}>
          Share affected
        </span>
        {!values && <span style={{ color: P.quiet }}>Hover over a tile to see the exact %</span>}
        {TILE.map((t) => (
          <Swatch key={t.label} color={t.bg}>
            {t.label}
          </Swatch>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#B83A3A" }} />
          Highest in the row
        </span>
        <Swatch color={HIDDEN_BG}>Fewer than {MIN_GROUP} people</Swatch>
      </div>
      <Note>
        {base.length >= MIN_GROUP && common ? (
          <>
            Most common finding: {mid(common.f.label)}, in {common.all.share}% of people checked (
            {nf(base.filter(common.f.test).length)}).
            {gap && gap.share > gap.allShare
              ? ` Biggest gap: ${gap.group}, ${mid(gap.finding)} at ${gap.share}% against ${gap.allShare}% for everyone shown.`
              : ""}
          </>
        ) : (
          `Fewer than ${MIN_GROUP} people match these filters, so nothing is shown.`
        )}
      </Note>
    </Card>
  );
}

/* ─── 4. Predicted high risk ───────────────────────────────────────────── */

const band = (v: number) =>
  v < 20 ? { label: "Low", ...GREEN } : v < 35 ? { label: "Moderate", ...SAND } : { label: "High", ...ROSE };

function PredictedRisk() {
  const [dim, setDim] = useState<GKey>("department");
  const [narrow, setNarrow] = useState<Narrow>({});

  /* A filter on the dimension shown as rows would leave a single row, so it is ignored. */
  const base = CHECKED.filter((p) => matches(p, { ...narrow, [dim]: undefined }));

  return (
    <Card>
      <Head
        title="Predicted high risk"
        sub="Share of each group predicted to be at high risk. Choose what the rows show, then narrow the people with the filters; all three charts follow."
        right={<Toggle options={DIM_OPTIONS} value={dim} onChange={setDim} />}
      />
      <Narrowing value={narrow} onChange={setNarrow} hide={[dim]} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {G_RISKS.map((r, ri) => {
          const hit = base.filter((p) => p.risk[ri]).length;
          const share = pc(hit, base.length);
          const b = band(share);
          const enough = base.length >= MIN_GROUP;
          return (
            <div key={r.label} className="rounded-2xl p-5" style={{ border: `1px solid ${P.line}` }}>
              <div className="text-[15px] font-semibold" style={{ color: P.ink }}>
                {r.label}
              </div>
              <div className="text-[12.5px]" style={{ color: P.quiet }}>
                {r.horizon}
              </div>
              {enough ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <span className="text-[34px] font-extrabold leading-none tabular-nums" style={{ color: b.ink }}>
                      {share}%
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ backgroundColor: b.wash, color: b.ink }}>
                      {b.label}
                    </span>
                    <span className="text-[13px]" style={{ color: P.body }}>
                      {nf(hit)} of {nf(base.length)} people checked
                    </span>
                  </div>
                  <Bar value={share} color={b.color} className="mt-3 !h-2.5" />
                  <div className="mt-4 space-y-2.5 pt-3" style={{ borderTop: `1px solid ${P.line}` }}>
                    {G_DIMS[dim].map((g) => {
                      const rows = base.filter((p) => p[dim] === g);
                      const n = rows.filter((p) => p.risk[ri]).length;
                      const v = pc(n, rows.length);
                      const show = rows.length >= MIN_GROUP;
                      return (
                        <div key={g} className="grid grid-cols-[130px_1fr_70px] items-center gap-3 text-[13px]">
                          <span className="font-semibold" style={{ color: P.ink }}>
                            {g}
                          </span>
                          <Bar value={show ? v : 0} color={band(v).color} className="!h-2.5 !rounded" />
                          <span className="text-right tabular-nums">
                            {show ? (
                              <>
                                <b style={{ color: P.ink }}>{v}%</b>{" "}
                                <span className="text-[12px]" style={{ color: P.quiet }}>
                                  {small(n)}
                                </span>
                              </>
                            ) : (
                              <span className="text-[12px]" style={{ color: P.quiet }}>
                                Too few
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-[13px]" style={{ color: P.quiet }}>
                  Fewer than {MIN_GROUP} people match these filters.
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px]" style={{ color: P.body }}>
        Share of the group at high risk:
        <Swatch color={GREEN.color}>Low, under 20%</Swatch>
        <Swatch color={SAND.color}>Moderate, 20% to 34%</Swatch>
        <Swatch color={ROSE.color}>High, 35% and above</Swatch>
        <span style={{ color: P.quiet }}>The grey number is the count of people.</span>
      </div>
    </Card>
  );
}

/* ─── 5. Health parameters for a group ─────────────────────────────────── */

const ALL_CHIP: Record<GKey, string> = {
  department: "All departments",
  location: "All locations",
  ageGroup: "All ages",
  gender: "All genders",
};
const PARAM_GROUPS = Array.from(new Set(G_PARAMS.map((p) => p.group)));

function Parameters() {
  const [pick, setPick] = useState<Record<GKey, string[]>>({ department: [], location: [], ageGroup: [], gender: [] });

  const rows = CHECKED.filter((p) => KEYS.every((k) => !pick[k].length || pick[k].includes(p[k])));
  const chosen = KEYS.flatMap((k) => (pick[k].length ? [pick[k].join(" + ")] : []));
  const chip = (on: boolean): React.CSSProperties =>
    on
      ? { backgroundColor: P.panel, border: `1px solid ${P.purple}`, color: P.deep }
      : { backgroundColor: "#fff", border: `1px solid ${P.line}`, color: P.body };
  const flip = (k: GKey, v: string) =>
    setPick({ ...pick, [k]: pick[k].includes(v) ? pick[k].filter((x) => x !== v) : [...pick[k], v] });

  return (
    <Card>
      <Head
        title="Health parameters for a group"
        sub="The closest view to an individual report. Pick any mix of departments, locations, age groups and genders; the chart shows that combined group."
      />
      <div className="space-y-2.5">
        {KEYS.map((k) => (
          <div key={k} className="flex flex-wrap items-center gap-2">
            <span className="w-[92px] text-[13px]" style={{ color: P.quiet }}>
              {G_LABEL[k]}
            </span>
            <button
              onClick={() => setPick({ ...pick, [k]: [] })}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium"
              style={chip(!pick[k].length)}
            >
              {ALL_CHIP[k]}
            </button>
            {G_DIMS[k].map((g) => (
              <button
                key={g}
                onClick={() => flip(k, g)}
                aria-pressed={pick[k].includes(g)}
                className="rounded-full px-3.5 py-1.5 text-[13px] font-medium"
                style={chip(pick[k].includes(g))}
              >
                {g}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#F6F5FA" }}>
        <span className="text-[15px] font-semibold" style={{ color: P.ink }}>
          {chosen.length ? chosen.join(" · ") : "All employees checked"}
        </span>
        <span className="text-[13px]" style={{ color: P.body }}>
          {nf(rows.length)} people checked
        </span>
      </div>

      {rows.length < MIN_GROUP ? (
        <p className="mt-4 text-[13.5px]" style={{ color: P.quiet }}>
          This group has fewer than {MIN_GROUP} people, so its results are hidden to keep individuals from being identified.
        </p>
      ) : (
        <div className="mt-3 max-w-[860px] overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.2fr_1.3fr_1fr_1.2fr] gap-4 px-2.5 py-2 text-[12px] font-semibold" style={{ color: P.body }}>
              <span>Parameter</span>
              <span>Group average against the healthy range</span>
              <span>Status</span>
              <span>Share of people out of range</span>
            </div>
            {PARAM_GROUPS.map((g) => (
              <div key={g}>
                <div
                  className="mt-1.5 rounded-md px-3 py-2 text-[11.5px] font-bold uppercase tracking-[0.06em]"
                  style={{ backgroundColor: P.panel, color: P.deep, boxShadow: `inset 3px 0 0 ${P.purple}` }}
                >
                  {g}
                </div>
                {G_PARAMS.map((p, i) => {
                  if (p.group !== g) return null;
                  const avg = rows.reduce((s, r) => s + r.v[i], 0) / rows.length;
                  const out = pc(rows.filter((r) => r.v[i] > p.hi || r.v[i] < p.lo).length, rows.length);
                  const state = avg > p.hi ? "Above range" : avg < p.lo ? "Below range" : "In range";
                  const ok = state === "In range";
                  return (
                    <div
                      key={p.key}
                      className="grid grid-cols-[1.2fr_1.3fr_1fr_1.2fr] items-center gap-4 px-2.5 py-2.5 text-[13.5px]"
                      style={{ borderBottom: `1px solid ${P.line}` }}
                    >
                      <span className="font-semibold" style={{ color: P.ink }}>
                        {p.label}
                      </span>
                      <span className="relative block h-2 rounded-full" style={{ backgroundColor: P.track }}>
                        <span
                          className="absolute inset-y-0 rounded-full"
                          style={{ left: `${p.lo * 100}%`, width: `${(p.hi - p.lo) * 100}%`, backgroundColor: "#CFC9E6" }}
                        />
                        <span
                          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                          style={{ left: `${avg * 100}%`, backgroundColor: P.ink, boxShadow: "0 0 0 2px #fff" }}
                        />
                      </span>
                      <span className="inline-flex items-center gap-2" style={{ color: P.body }}>
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: ok ? GREEN.wash : ROSE.wash, color: ok ? GREEN.ink : ROSE.ink }}
                        >
                          {ok ? (
                            <Check size={12} strokeWidth={3} />
                          ) : (
                            <Triangle size={9} fill="currentColor" className={state === "Below range" ? "rotate-180" : ""} />
                          )}
                        </span>
                        {state}
                      </span>
                      <span className="grid grid-cols-[1fr_40px] items-center gap-3">
                        <Bar value={out} color={ROSE.color} />
                        <span className="text-right text-[12.5px] tabular-nums" style={{ color: P.body }}>
                          {out}%
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px]" style={{ color: P.body }}>
        <Swatch color="#CFC9E6">Healthy range</Swatch>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: P.ink }} />
          Group average
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check size={13} strokeWidth={3} style={{ color: GREEN.ink }} />
          In healthy range
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Triangle size={9} fill="currentColor" style={{ color: ROSE.ink }} />
          Above or below healthy range
        </span>
      </div>
    </Card>
  );
}

/* ─── View option 3 ────────────────────────────────────────────────────── */

export default function ViewThree() {
  const [screen, setScreen] = useState<"participation" | "findings">("participation");
  const tabs = [
    { key: "participation" as const, label: "Participation", icon: <ClipboardCheck size={17} /> },
    { key: "findings" as const, label: "Findings & Risk", icon: <HeartPulse size={17} /> },
  ];

  return (
    <div className="animate-stagger min-w-0 space-y-5">
      {/* ── Screen tabs ── */}
      <div
        className="-mx-2 flex flex-wrap items-center justify-center gap-3 rounded-[20px] px-4 py-3.5"
        style={{ background: "linear-gradient(90deg, #EFEAFB 0%, #F7F1F6 55%, #FCF1E8 100%)" }}
      >
        {tabs.map((t) => {
          const active = screen === t.key;
          return (
            <button
              key={t.key}
              aria-pressed={active}
              onClick={() => {
                setScreen(t.key);
                window.scrollTo({ top: 0 });
              }}
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

      <Card className="!py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[14px] font-medium"
              style={{ border: `1px solid ${P.line}`, color: P.ink }}
            >
              <CalendarDays size={15} />
              06 Jul 2026 – 14 Aug 2026
            </span>
            <span className="text-[13px]" style={{ color: P.quiet }}>
              AHC cycle FY 26-27
            </span>
          </div>
          <span className="rounded-full px-3 py-1 text-[11.5px] font-semibold" style={{ backgroundColor: P.sand, color: SAND.ink }}>
            Sample data for layout review
          </span>
        </div>
      </Card>

      <div>
        <h1 className="text-[30px] font-semibold tracking-[-0.02em]" style={{ color: P.ink }}>
          AHC Granular Insights
        </h1>
        <p className="text-[14px]" style={{ color: P.quiet }}>
          Progress of the annual health check, what it found, and who is at risk. Every number describes a group; groups smaller
          than {MIN_GROUP} people are hidden so no individual can be identified.
        </p>
      </div>

      {screen === "participation" ? (
        <>
          <Participation />
          <ChecksByDate />
        </>
      ) : (
        <>
          <LabFindings />
          <PredictedRisk />
          <Parameters />
        </>
      )}
    </div>
  );
}
