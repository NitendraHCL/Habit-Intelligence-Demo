"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

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
  StatusPill,
  RankedBars,
  type Column,
} from "@/components/opd-wallet/ui";
import { Donut, MultiLine, GroupedBar, StackedBar } from "@/components/opd-wallet/charts";
import {
  reimbursement,
  claimRows,
  nf,
  inr,
  inrCompact,
  compact,
  pctOf,
  ENTITIES,
  type ClaimRow,
} from "@/lib/data/opd-wallet";

const PAGE_SIZE = 12;
const CLAIM_STATUS_OPTIONS = [
  "SETTLED",
  "REJECTED",
  "CLOSED",
  "PENDING(DD)",
  "DOCUMENTS DEFICIENT",
  "QC CHECK",
];

export default function OpdWalletReimbursementPage() {
  const [entities, setEntities] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const k = reimbursement.kpis;

  const approvalRate = pctOf(k.approvedAmount, k.totalClaimAmount);
  const rejectionRate = pctOf(k.rejectedAmount, k.totalClaimAmount);

  const statusTotal = reimbursement.statusSplit.reduce((a, b) => a + b.value, 0);
  const relationTotal = reimbursement.relationSplit.reduce((a, b) => a + b.value, 0);
  const amountStatusTotal = reimbursement.amountByStatus.reduce((a, b) => a + b.value, 0);
  const amountRelationTotal = reimbursement.amountByRelation.reduce((a, b) => a + b.value, 0);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claimRows.filter((row) => {
      if (statuses.length && !statuses.includes(row.status)) return false;
      if (
        q &&
        ![row.claimId, row.sapId, row.procedure, row.relation].some((f) => f.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [statuses, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedRows = filteredRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const chips = [
    ...entities.map((e) => ({ key: "Entity", value: e, clear: () => setEntities((p) => p.filter((v) => v !== e)) })),
    ...statuses.map((s) => ({ key: "Status", value: s, clear: () => setStatuses((p) => p.filter((v) => v !== s)) })),
    ...(search ? [{ key: "Search", value: search, clear: () => setSearch("") }] : []),
  ];
  const clearAll = () => {
    setEntities([]);
    setStatuses([]);
    setSearch("");
    setPage(0);
  };

  const columns: Column<ClaimRow>[] = [
    { key: "sap", header: "SAP ID", render: (r) => <span className="font-semibold">{r.sapId}</span> },
    { key: "claim", header: "Claim ID", render: (r) => r.claimId },
    { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
    { key: "claimDate", header: "Claim Date", render: (r) => r.claimDate },
    { key: "requestDate", header: "Request Date", render: (r) => r.requestDate },
    { key: "procedure", header: "Procedure", render: (r) => r.procedure },
    {
      key: "reason",
      header: "Reason",
      width: 260,
      render: (r) => <span className="block max-w-[280px] truncate">{r.reason}</span>,
    },
    { key: "gender", header: "Gender", render: (r) => r.gender },
    { key: "relation", header: "Relation", render: (r) => r.relation },
    { key: "age", header: "Age", align: "right", render: (r) => r.age },
    { key: "claimAmount", header: "Claim Amount", align: "right", render: (r) => inr(r.claimAmount) },
    { key: "approvedAmount", header: "Approved", align: "right", render: (r) => inr(r.approvedAmount) },
  ];

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
            placeholder="Search claim ID, SAP ID or procedure"
            className="h-9 w-[300px] pl-9 text-[13px]"
            style={{ borderColor: T.border }}
          />
        </div>
        <FilterMultiSelect label="Entity" options={ENTITIES} selected={entities} onChange={setEntities} width={240} />
        <FilterMultiSelect
          label="Claim Status"
          options={CLAIM_STATUS_OPTIONS}
          selected={statuses}
          onChange={(v) => {
            setStatuses(v);
            setPage(0);
          }}
          width={220}
        />
        <ResetFilter visible={chips.length > 0} onClick={clearAll} />
        <div className="flex-1" />
        <span className="text-[11px] font-medium mr-1" style={{ color: T.textMuted }}>
          Data as of 14 September 2026
        </span>
        <PageDownload pageTitle="OPD Wallet — Reimbursement" />
        <NotificationsBell />
      </Toolbar>

      <FilterChips chips={chips} onClearAll={clearAll} />

      <PageGlanceBox
        pageTitle="OPD Wallet — Reimbursement"
        pageSubtitle="Every claim raised against the wallet: what was claimed, what was approved, what was rejected and why."
        kpis={{ ...k, approvalRate, rejectionRate }}
        fallbackSummary={`${nf(k.totalClaims)} claims worth ${inrCompact(
          k.totalClaimAmount
        )} have been raised by ${nf(k.uniqueUsers)} members. ${approvalRate}% of the claimed value has been approved and ${rejectionRate}% rejected, with ${inrCompact(
          k.outstandingAmount
        )} still outstanding. Members average ${k.avgClaimsPerEmployee} claims and ${inr(
          k.avgAmountPerEmployee
        )} each.`}
        fallbackChips={[
          { label: "Total Claims", value: compact(k.totalClaims) },
          { label: "Claimed", value: inrCompact(k.totalClaimAmount) },
          { label: "Approved", value: `${approvalRate}%` },
          { label: "Outstanding", value: inrCompact(k.outstandingAmount) },
        ]}
      />

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Unique Users" value={nf(k.uniqueUsers)} color={C.accent} compact sub="members who raised at least one claim" />
        <StatTile label="Total Claims" value={nf(k.totalClaims)} color={C.teal} compact sub={`${k.avgClaimsPerEmployee} per member on average`} />
        <StatTile label="Total Claim Amount" value={inrCompact(k.totalClaimAmount)} color={C.violet} compact sub={inr(k.totalClaimAmount)} />
        <StatTile label="Approved Amount" value={inrCompact(k.approvedAmount)} color={C.accent} compact sub={`${approvalRate}% of claimed value`} />
        <StatTile label="Outstanding Amount" value={inrCompact(k.outstandingAmount)} color={C.accentMid} compact sub="approved but not yet settled" />
        <StatTile label="Rejected Amount" value={inrCompact(k.rejectedAmount)} color={C.alert} compact sub={`${rejectionRate}% of claimed value`} />
        <StatTile label="Avg Claims / Member" value={nf(k.avgClaimsPerEmployee)} color={C.teal} compact />
        <StatTile label="Avg Amount / Member" value={inr(k.avgAmountPerEmployee)} color={C.violet} compact />
      </div>

      {/* ── Claim count splits ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WalletCard
          accentColor={C.accent}
          title="Claims by Status"
          subtitle="Where every claim raised has ended up."
          chartData={reimbursement.statusSplit}
          chartDescription="Claim count by processing status."
        >
          <Donut data={reimbursement.statusSplit} centerValue={compact(statusTotal)} centerLabel="Claims" height={230} />
          <Legend
            items={reimbursement.statusSplit.map((s, i) => ({
              name: s.name,
              value: `${compact(s.value)} (${pctOf(s.value, statusTotal)}%)`,
              color: SERIES[i % SERIES.length],
            }))}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.teal}
          title="Claims by Relation"
          subtitle="Which family members are claiming."
          chartData={reimbursement.relationSplit}
          chartDescription="Claim count by relation to the employee."
        >
          <Donut data={reimbursement.relationSplit} centerValue={compact(relationTotal)} centerLabel="Claims" height={230} />
          <Legend
            items={reimbursement.relationSplit.map((s, i) => ({
              name: s.name,
              value: `${compact(s.value)} (${pctOf(s.value, relationTotal)}%)`,
              color: SERIES[i % SERIES.length],
            }))}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.violet}
          title="Claim Amount by Status"
          subtitle="The same picture in rupees rather than claim counts."
          chartData={reimbursement.amountByStatus}
          chartDescription="Claimed value by processing status."
        >
          <Donut
            data={reimbursement.amountByStatus}
            centerValue={inrCompact(amountStatusTotal)}
            centerLabel="Claimed"
            height={230}
            format={inrCompact}
          />
          <Legend
            items={reimbursement.amountByStatus.map((s, i) => ({
              name: s.name,
              value: `${pctOf(s.value, amountStatusTotal)}%`,
              color: SERIES[i % SERIES.length],
            }))}
          />
        </WalletCard>
      </div>

      {/* ── Age/relation + amount by relation + trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WalletCard
          accentColor={C.accent}
          title="Claims by Age and Relation"
          subtitle="Claim count per age band, stacked by relation."
          chartData={reimbursement.ageRelation}
          chartDescription="Claim count by age band and relation."
        >
          <StackedBar
            data={reimbursement.ageRelation}
            series={["Self", "Spouse", "Children", "Parent", "In-laws"]}
            xKey="age"
            layout="vertical"
            height={300}
            format={compact}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.teal}
          title="Claim Amount by Relation"
          subtitle="Rupee value claimed per relation."
          chartData={reimbursement.amountByRelation}
          chartDescription="Claimed value by relation."
        >
          <Donut
            data={reimbursement.amountByRelation}
            centerValue={inrCompact(amountRelationTotal)}
            centerLabel="Claimed"
            height={250}
            format={inrCompact}
          />
          <Legend
            items={reimbursement.amountByRelation.map((s, i) => ({
              name: s.name,
              value: `${inrCompact(s.value)} (${pctOf(s.value, amountRelationTotal)}%)`,
              color: SERIES[i % SERIES.length],
            }))}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.violet}
          title="Procedures Over Time"
          subtitle="Monthly claim count by procedure category."
          chartData={reimbursement.procedureTrend}
          chartDescription="Monthly claim volume per procedure category."
        >
          <MultiLine
            data={reimbursement.procedureTrend}
            series={reimbursement.procedureSeries}
            xKey="month"
            height={300}
          />
        </WalletCard>
      </div>

      {/* ── Rejections + amount by procedure ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WalletCard
          accentColor={C.alert}
          title="Top Rejection Reasons"
          subtitle="What is actually costing members their claims."
          chartData={reimbursement.rejectionReasons}
          chartDescription="Rejection reasons ranked by claim count."
        >
          <div className="mt-3 max-h-[330px] overflow-auto pr-1">
            <RankedBars items={reimbursement.rejectionReasons.map((r) => ({ name: r.reason, value: r.claims }))} color={C.alert} />
          </div>
          <InsightBox
            text={`Documentation gaps — missing prescriptions, mismatched dates and incomplete pharmacy invoices — drive more rejections than any policy exclusion. A single reminder at upload time would address roughly a third of the reasons on this list.`}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.accent}
          title="Claimed vs Approved by Procedure"
          subtitle="Top procedures by claimed value, against what was actually approved."
          chartData={reimbursement.amountByProcedure}
          chartDescription="Claimed vs approved amount per procedure."
        >
          <GroupedBar
            data={reimbursement.amountByProcedure}
            xKey="name"
            series={[
              { key: "claimed", label: "Claimed", color: C.accent },
              { key: "approved", label: "Approved", color: C.teal },
            ]}
            height={330}
            format={inrCompact}
            labelWidth={160}
          />
        </WalletCard>
      </div>

      {/* ── Claim dump ── */}
      <WalletCard
        accentColor={C.accent}
        title="Reimbursement Claim Dump"
        subtitle={`${nf(filteredRows.length)} of ${nf(claimRows.length)} sample claims shown.`}
        tooltipText="A representative extract of the claim ledger. The complete dump is available through the data export."
      >
        <div className="mt-3">
          <DataTable columns={columns} rows={pagedRows} getKey={(r) => r.claimId} maxHeight={440} />
          <Pager page={safePage} pageCount={pageCount} total={filteredRows.length} onChange={setPage} />
        </div>
      </WalletCard>
    </div>
  );
}
