"use client";

import { useMemo, useState } from "react";
import { Search, Users, UserCheck, UserPlus, Percent } from "lucide-react";

import { T } from "@/lib/ui/theme";
import { Input } from "@/components/ui/input";
import { PageGlanceBox } from "@/components/dashboard/PageGlanceBox";
import { PageDownload } from "@/components/shared/PageDownload";
import { NotificationsBell } from "@/components/NotificationsBell";
import { ResetFilter } from "@/components/ui/reset-filter";
import {
  C,
  SERIES,
  WalletCard,
  StatTile,
  InsightBox,
  Toolbar,
  FilterMultiSelect,
  FilterChips,
  DataTable,
  Pager,
  Legend,
  type Column,
} from "@/components/opd-wallet/ui";
import { Donut, HBar, TrendArea } from "@/components/opd-wallet/charts";
import {
  registration,
  memberRows,
  compact,
  nf,
  pctOf,
  ENTITIES,
  RELATIONS,
  type MemberRow,
} from "@/lib/data/opd-wallet";

const PAGE_SIZE = 12;

export default function OpdWalletRegistrationPage() {
  const [entities, setEntities] = useState<string[]>([]);
  const [relations, setRelations] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const r = registration;

  const dependants = r.activeLives - (r.relationSplit.find((s) => s.name === "self")?.value ?? 0);
  const signupRate = pctOf(r.totalSignup, r.employeesOnRoll);
  const livesPerSignup = Math.round((r.activeLives / r.totalSignup) * 10) / 10;

  /* ── Register table ── */
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memberRows.filter((row) => {
      if (entities.length && !entities.includes(row.entity)) return false;
      if (relations.length && !relations.includes(row.relation)) return false;
      if (
        q &&
        ![row.name, row.email, row.memberId, row.policyNumber, row.phone].some((f) =>
          f.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [entities, relations, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedRows = filteredRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const chips = [
    ...entities.map((e) => ({
      key: "Entity",
      value: e,
      clear: () => setEntities((p) => p.filter((v) => v !== e)),
    })),
    ...relations.map((rel) => ({
      key: "Relation",
      value: rel,
      clear: () => setRelations((p) => p.filter((v) => v !== rel)),
    })),
    ...(search ? [{ key: "Search", value: search, clear: () => setSearch("") }] : []),
  ];

  const clearAll = () => {
    setEntities([]);
    setRelations([]);
    setSearch("");
    setPage(0);
  };

  const columns: Column<MemberRow>[] = [
    { key: "id", header: "Member ID", render: (row) => <span className="font-semibold">{row.memberId}</span> },
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "email", header: "Email", render: (row) => row.email },
    { key: "phone", header: "Phone", render: (row) => row.phone },
    { key: "dob", header: "DOB", render: (row) => row.dob },
    { key: "gender", header: "Gender", render: (row) => row.gender },
    { key: "relation", header: "Relation", render: (row) => row.relation },
    { key: "policy", header: "Policy Number", render: (row) => row.policyNumber },
    { key: "start", header: "Policy Start", render: (row) => row.policyStart },
    { key: "entity", header: "Entity", render: (row) => row.entity },
  ];

  const genderTotal = r.genderSplit.reduce((a, b) => a + b.value, 0);
  const relationTotal = r.relationSplit.reduce((a, b) => a + b.value, 0);

  return (
    <div className="animate-stagger space-y-6">
      {/* ── Toolbar ── */}
      <Toolbar>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search name, member ID, email, phone or policy number"
            className="h-9 w-[340px] pl-9 text-[13px]"
            style={{ borderColor: T.border }}
          />
        </div>
        <FilterMultiSelect
          label="Entity"
          options={ENTITIES}
          selected={entities}
          onChange={(v) => {
            setEntities(v);
            setPage(0);
          }}
          width={240}
        />
        <FilterMultiSelect
          label="Relation"
          options={RELATIONS}
          selected={relations}
          onChange={(v) => {
            setRelations(v);
            setPage(0);
          }}
        />
        <ResetFilter visible={chips.length > 0} onClick={clearAll} />
        <div className="flex-1" />
        <span className="text-[11px] font-medium mr-1" style={{ color: T.textMuted }}>
          Data as of 14 September 2026
        </span>
        <PageDownload pageTitle="OPD Wallet — Registration Status" />
        <NotificationsBell />
      </Toolbar>

      <FilterChips chips={chips} onClearAll={clearAll} />

      <PageGlanceBox
        pageTitle="OPD Wallet — Registration Status"
        pageSubtitle="Who is on the OPD wallet today: employees who have signed up, the dependants they have added, and how that register splits by age, relation and gender."
        kpis={{
          activeLives: r.activeLives,
          totalSignup: r.totalSignup,
          signupRate,
          livesPerSignup,
          dependants,
        }}
        fallbackSummary={`${nf(r.activeLives)} lives are active on the wallet, added by ${nf(
          r.totalSignup
        )} employees — ${signupRate}% of the ${nf(
          r.employeesOnRoll
        )} on roll. Each signed-up employee is covering ${livesPerSignup} lives on average, and ${nf(
          dependants
        )} of the register are dependants rather than employees.`}
        fallbackChips={[
          { label: "Active Lives", value: compact(r.activeLives) },
          { label: "Sign-ups", value: nf(r.totalSignup) },
          { label: "Sign-up Rate", value: `${signupRate}%` },
          { label: "Lives per Employee", value: String(livesPerSignup) },
        ]}
      />

      {/* ── Headline tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Active Lives"
          value={nf(r.activeLives)}
          color={C.accent}
          icon={<Users size={16} />}
          sub="employees plus dependants currently covered"
          tooltip="Every member with an active policy on the wallet today, including dependants added by the employee."
        />
        <StatTile
          label="Total Sign-ups"
          value={nf(r.totalSignup)}
          color={C.teal}
          icon={<UserCheck size={16} />}
          sub={`of ${nf(r.employeesOnRoll)} employees on roll`}
          tooltip="Employees who have completed wallet registration at least once."
        />
        <StatTile
          label="Sign-up Rate"
          value={`${signupRate}%`}
          color={C.violet}
          icon={<Percent size={16} />}
          sub={`${nf(r.employeesOnRoll - r.totalSignup)} employees yet to register`}
        />
        <StatTile
          label="Dependants Added"
          value={compact(dependants)}
          color={C.accentMid}
          icon={<UserPlus size={16} />}
          sub={`${livesPerSignup} lives per registered employee`}
        />
      </div>

      {/* ── Age / relation / gender ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WalletCard
          accentColor={C.accent}
          title="Age Split"
          subtitle="Active lives by age band."
          chartData={r.ageSplit}
          chartDescription="Active lives on the OPD wallet by age band."
        >
          <HBar data={r.ageSplit} height={280} format={(n) => compact(n)} labelWidth={60} />
          <InsightBox
            text={`The 30-39 band is the single largest at ${compact(
              r.ageSplit[0].value
            )} lives — working-age employees and their spouses. Together with the 60+ parents band it accounts for just over 40% of the register.`}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.teal}
          title="Relation Bifurcation"
          subtitle="How the register splits between employees and their dependants."
          chartData={r.relationSplit}
          chartDescription="Active lives by relation to the employee."
        >
          <Donut
            data={r.relationSplit}
            centerValue={compact(relationTotal)}
            centerLabel="Active Lives"
            height={250}
          />
          <Legend
            items={r.relationSplit.slice(0, 8).map((s, i) => ({
              name: s.name,
              value: `${compact(s.value)} (${pctOf(s.value, relationTotal)}%)`,
              color: SERIES[i % SERIES.length],
            }))}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.violet}
          title="Gender Bifurcation"
          subtitle="Active lives by gender."
          chartData={r.genderSplit}
          chartDescription="Active lives on the OPD wallet by gender."
        >
          <Donut
            data={r.genderSplit}
            centerValue={compact(genderTotal)}
            centerLabel="Active Lives"
            height={250}
            colors={["#4f46e5", "#a78bfa", "#a1a1aa"]}
          />
          <Legend
            items={r.genderSplit.map((s, i) => ({
              name: s.name,
              value: `${compact(s.value)} (${pctOf(s.value, genderTotal)}%)`,
              color: ["#4f46e5", "#a78bfa", "#a1a1aa"][i],
            }))}
          />
          <InsightBox text="The register is an almost exact 50:50 split — a signal that dependant enrolment is happening evenly rather than skewing to one side of the family." />
        </WalletCard>
      </div>

      {/* ── Sign-up curve + entity completeness ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WalletCard
          className="lg:col-span-2"
          accentColor={C.accent}
          title="Sign-up Curve"
          subtitle="Cumulative employee registrations since the policy went live in October 2025."
          chartData={r.signupTrend}
          chartDescription="Monthly and cumulative OPD wallet sign-ups."
        >
          <TrendArea data={r.signupTrend} xKey="month" yKey="cumulative" height={280} format={(n) => compact(n)} />
          <InsightBox
            text={`Sign-ups front-loaded hard — ${compact(
              r.signupTrend[0].signups
            )} in the launch month alone, a quarter of everything since. The curve has flattened to roughly ${nf(
              r.signupTrend[r.signupTrend.length - 1].signups
            )} a month, so further growth now depends on targeted nudges rather than launch momentum.`}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.teal}
          title="Registration by Entity"
          subtitle="Completeness against the eligible headcount."
          chartData={r.entityStatus}
          chartDescription="Registered vs eligible employees per entity."
        >
          <div className="mt-3 space-y-4">
            {r.entityStatus.map((e) => (
              <div key={e.entity}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-medium truncate" style={{ color: T.textPrimary }}>
                    {e.entity}
                  </span>
                  <span className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: C.accent }}>
                    {e.pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-[7px] rounded-full" style={{ backgroundColor: "#F1F2F6" }}>
                  <div
                    className="h-[7px] rounded-full"
                    style={{ width: `${e.pct}%`, backgroundColor: C.accent }}
                  />
                </div>
                <p className="mt-1 text-[11px]" style={{ color: T.textMuted }}>
                  {nf(e.registered)} of {nf(e.eligible)} registered · {nf(e.pending)} pending
                </p>
              </div>
            ))}
          </div>
        </WalletCard>
      </div>

      {/* ── Register dump ── */}
      <WalletCard
        accentColor={C.accent}
        title="Active Member Register"
        subtitle={`${nf(filteredRows.length)} of ${nf(memberRows.length)} sample rows shown. Use the filters above to narrow the register.`}
        tooltipText="A representative extract of the active register. The full dump runs to the complete active-lives count and is available through the data export."
        expandable
      >
        <div className="mt-3">
          <DataTable
            columns={columns}
            rows={pagedRows}
            getKey={(row) => row.memberId + row.email}
            maxHeight={440}
          />
          <Pager page={safePage} pageCount={pageCount} total={filteredRows.length} onChange={setPage} />
        </div>
      </WalletCard>
    </div>
  );
}
