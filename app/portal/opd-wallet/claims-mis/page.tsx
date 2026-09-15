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
  WalletCard,
  StatTile,
  InsightBox,
  Toolbar,
  TabStrip,
  FilterMultiSelect,
  FilterChips,
  DataTable,
  Pager,
  StatusPill,
  type Column,
} from "@/components/opd-wallet/ui";
import {
  claimsMis,
  misRows,
  nf,
  inr,
  inrCompact,
  pctOf,
  type MisRow,
} from "@/lib/data/opd-wallet";

const PAGE_SIZE = 14;

const TABS = [
  { key: "summary", label: "Reimbursement Summary" },
  { key: "mis", label: "Reimbursement Claim MIS" },
];

const MIS_STATUS_OPTIONS = ["SETTLED", "REJECTED", "CLOSED", "PENDING(DD)", "QC CHECK"];
const BROAD_PROCEDURE_OPTIONS = ["MEDICINE", "LABS", "CONSULTATION", "OPTICAL", "OPD PROCEDURES", "DENTAL"];

/* ─── TAT table ────────────────────────────────────────────────────────── */

function TatCard({
  table,
}: {
  table: {
    id: string;
    title: string;
    note: string;
    rows: { bucket: string; count: number; pct: number }[];
    total: number;
  };
}) {
  const fastBucket = table.rows[0];
  return (
    <WalletCard
      accentColor={C.accent}
      title={table.title}
      subtitle={table.note}
      chartData={table.rows}
      chartDescription={`${table.title} — claim counts by TAT bucket.`}
    >
      <div className="mt-3 overflow-hidden rounded-xl" style={{ border: `1px solid ${T.border}` }}>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ backgroundColor: C.accentWash }}>
              <th className="px-3 py-2 text-left font-bold" style={{ color: "#3730a3" }}>
                TAT Bucket
              </th>
              <th className="px-3 py-2 text-right font-bold" style={{ color: "#3730a3" }}>
                Claim Count
              </th>
              <th className="px-3 py-2 text-right font-bold" style={{ color: "#3730a3" }}>
                % Claims
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.bucket}>
                <td
                  className="px-3 py-1.5 relative"
                  style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}
                >
                  {/* share-of-total rule behind the label, so the shape reads without a chart */}
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-sm"
                    style={{ width: `${row.pct}%`, backgroundColor: C.accentWash }}
                  />
                  <span className="relative">{row.bucket}</span>
                </td>
                <td
                  className="px-3 py-1.5 text-right tabular-nums font-medium"
                  style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}
                >
                  {nf(row.count)}
                </td>
                <td
                  className="px-3 py-1.5 text-right tabular-nums"
                  style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}
                >
                  {row.pct}%
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: C.accent }}>
              <td className="px-3 py-2 font-bold text-white">Total</td>
              <td className="px-3 py-2 text-right font-bold text-white tabular-nums">{nf(table.total)}</td>
              <td className="px-3 py-2 text-right font-bold text-white tabular-nums">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11.5px]" style={{ color: T.textSecondary }}>
        <span className="font-semibold" style={{ color: C.accent }}>
          {fastBucket.pct}%
        </span>{" "}
        of these claims clear in the {fastBucket.bucket.replace(/^[a-g]\. /, "")} bucket.
      </p>
    </WalletCard>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function OpdWalletClaimsMisPage() {
  const [tab, setTab] = useState("summary");

  /* MIS tab filters */
  const [statuses, setStatuses] = useState<string[]>([]);
  const [broad, setBroad] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const h = claimsMis.headline;
  const approvalRate = pctOf(h.approvedClaims, h.totalClaims);
  const settlementRate = pctOf(h.settledAmount, h.approvedAmount);

  const benefitTotals = useMemo(() => {
    const claims = claimsMis.benefitSummary.reduce((a, b) => a + b.claims, 0);
    const approved = claimsMis.benefitSummary.reduce((a, b) => a + b.approvedAmount, 0);
    const disallowed = claimsMis.benefitSummary.reduce((a, b) => a + b.disallowedAmount, 0);
    return { claims, approved, disallowed };
  }, []);

  const statusTotals = useMemo(() => {
    const claims = claimsMis.statusSummary.reduce((a, b) => a + b.claims, 0);
    const claimed = claimsMis.statusSummary.reduce((a, b) => a + b.claimed, 0);
    const approved = claimsMis.statusSummary.reduce((a, b) => a + b.approved, 0);
    const disallowed = claimsMis.statusSummary.reduce((a, b) => a + b.disallowed, 0);
    return { claims, claimed, approved, disallowed };
  }, []);

  const rejectionTotal = useMemo(
    () => claimsMis.rejectionSummary.reduce((a, b) => a + b.claims, 0),
    []
  );

  const byStatus = useMemo(
    () => Object.fromEntries(claimsMis.statusSummary.map((s) => [s.status, s])),
    []
  );

  const sortedRejections = useMemo(
    () => [...claimsMis.rejectionSummary].sort((a, b) => b.claims - a.claims),
    []
  );

  /* MIS rows */
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return misRows.filter((row) => {
      if (statuses.length && !statuses.includes(row.status)) return false;
      if (broad.length && !broad.includes(row.broadProcedure)) return false;
      if (
        q &&
        ![row.claimNo, row.email, row.employeeId, row.procedure].some((f) => f.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [statuses, broad, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedRows = filteredRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const chips = [
    ...statuses.map((s) => ({ key: "Status", value: s, clear: () => setStatuses((p) => p.filter((v) => v !== s)) })),
    ...broad.map((b) => ({ key: "Procedure", value: b, clear: () => setBroad((p) => p.filter((v) => v !== b)) })),
    ...(search ? [{ key: "Search", value: search, clear: () => setSearch("") }] : []),
  ];
  const clearAll = () => {
    setStatuses([]);
    setBroad([]);
    setSearch("");
    setPage(0);
  };

  const misColumns: Column<MisRow>[] = [
    { key: "claimNo", header: "Claim No", render: (r) => <span className="font-semibold">{r.claimNo}</span> },
    { key: "email", header: "Email", render: (r) => r.email },
    { key: "employeeId", header: "Employee ID", render: (r) => r.employeeId },
    { key: "procedure", header: "Procedure Name", render: (r) => r.procedure },
    { key: "broad", header: "Broad Procedure", render: (r) => r.broadProcedure },
    { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
    { key: "claimed", header: "Claimed Amount", align: "right", render: (r) => inr(r.claimedAmount) },
    { key: "approved", header: "Approved Amount", align: "right", render: (r) => inr(r.approvedAmount) },
    { key: "utr", header: "UTR", render: (r) => r.utr },
    { key: "invoice", header: "Invoice Date", render: (r) => r.invoiceDate },
    { key: "received", header: "Claim Received", render: (r) => r.receivedDate },
    { key: "ldr", header: "LDR", render: (r) => r.ldr },
  ];

  return (
    <div className="animate-stagger space-y-6">
      {/* ── Toolbar ── */}
      <Toolbar>
        {tab === "mis" ? (
          <>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search claim no, employee ID, email or procedure"
                className="h-9 w-[320px] pl-9 text-[13px]"
                style={{ borderColor: T.border }}
              />
            </div>
            <FilterMultiSelect
              label="Status"
              options={MIS_STATUS_OPTIONS}
              selected={statuses}
              onChange={(v) => {
                setStatuses(v);
                setPage(0);
              }}
              width={200}
            />
            <FilterMultiSelect
              label="Broad Procedure"
              options={BROAD_PROCEDURE_OPTIONS}
              selected={broad}
              onChange={(v) => {
                setBroad(v);
                setPage(0);
              }}
              width={220}
            />
            <ResetFilter visible={chips.length > 0} onClick={clearAll} />
          </>
        ) : (
          <span className="text-[12.5px] font-medium" style={{ color: T.textSecondary }}>
            Claims received between 1 April 2026 and 31 August 2026
          </span>
        )}
        <div className="flex-1" />
        <span className="text-[11px] font-medium mr-1" style={{ color: T.textMuted }}>
          Data as of 14 September 2026, 3:00 pm
        </span>
        <PageDownload pageTitle="OPD Wallet — Claims TAT & MIS" />
        <NotificationsBell />
      </Toolbar>

      {tab === "mis" && <FilterChips chips={chips} onClearAll={clearAll} />}

      <TabStrip tabs={TABS} active={tab} onChange={setTab} />

      {tab === "summary" ? (
        <>
          <PageGlanceBox
            pageTitle="OPD Wallet — Reimbursement Claims Summary"
            pageSubtitle="Turnaround times across every stage of claim processing, plus benefit, status and rejection summaries for the reporting window."
            kpis={{ ...h, approvalRate, settlementRate }}
            fallbackSummary={`${nf(h.totalClaims)} claims were received in the window and ${nf(
              h.approvedClaims
            )} approved — an ${approvalRate}% approval rate. ${inrCompact(
              h.settledAmount
            )} of the ${inrCompact(
              h.approvedAmount
            )} approved has already been settled, and the overwhelming majority of claims clear their first action inside three days.`}
            fallbackChips={[
              { label: "Total Claims", value: nf(h.totalClaims) },
              { label: "Approved", value: nf(h.approvedClaims) },
              { label: "Approved Amount", value: inrCompact(h.approvedAmount) },
              { label: "Settled", value: inrCompact(h.settledAmount) },
            ]}
          />

          {/* ── Headline ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Total Claims" value={nf(h.totalClaims)} color={C.accent} sub="received in the reporting window" />
            <StatTile label="Total Approved Claims" value={nf(h.approvedClaims)} color={C.teal} sub={`${approvalRate}% approval rate`} />
            <StatTile label="Total Approved Amount" value={inrCompact(h.approvedAmount)} color={C.violet} sub={inr(h.approvedAmount)} />
            <StatTile label="Total Settled Amount" value={inrCompact(h.settledAmount)} color={C.accentMid} sub={`${settlementRate}% of approved value paid out`} />
          </div>

          {/* ── TAT tables ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {claimsMis.tatTables.map((table) => (
              <TatCard key={table.id} table={table} />
            ))}
          </div>

          {/* ── Benefit + status summary ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WalletCard
              accentColor={C.accent}
              title="Benefit Wise Summary"
              subtitle="Claims and value by benefit category."
              chartData={claimsMis.benefitSummary}
              chartDescription="Claim count, approved and disallowed amount per benefit category."
            >
              <div className="mt-3 overflow-auto rounded-xl" style={{ border: `1px solid ${T.border}` }}>
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr style={{ backgroundColor: C.accentWash }}>
                      <th className="px-3 py-2.5 text-left font-bold" style={{ color: "#3730a3" }}>Benefit Category</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}># Claims</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>% Claims</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Approved</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Disallowed</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>% Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsMis.benefitSummary.map((b) => (
                      <tr key={b.benefit} className="hover:bg-[#F8F9FC]">
                        <td className="px-3 py-2.5 font-medium" style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}>
                          {b.benefit}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                          {nf(b.claims)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                          {pctOf(b.claims, benefitTotals.claims)}%
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                          {inrCompact(b.approvedAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                          {inrCompact(b.disallowedAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold" style={{ color: C.accent, borderTop: `1px solid ${T.borderLight}` }}>
                          {pctOf(b.approvedAmount, b.approvedAmount + b.disallowedAmount)}%
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: C.accent }}>
                      <td className="px-3 py-2.5 font-bold text-white">Total</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(benefitTotals.claims)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">100%</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{inrCompact(benefitTotals.approved)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{inrCompact(benefitTotals.disallowed)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">
                        {pctOf(benefitTotals.approved, benefitTotals.approved + benefitTotals.disallowed)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <InsightBox
                text={`Medication and investigation claims carry ${pctOf(
                  claimsMis.benefitSummary[2].claims,
                  benefitTotals.claims
                )}% of all volume and approve at the highest rate. Health check claims approve at the lowest — most of the disallowance there is sub-limit exhaustion rather than rejection.`}
              />
            </WalletCard>

            <WalletCard
              accentColor={C.teal}
              title="Claim Status Wise Summary"
              subtitle="Claim counts and value by final processing status."
              chartData={claimsMis.statusSummary}
              chartDescription="Claim count, claimed, approved and disallowed amount per status."
            >
              <div className="mt-3 overflow-auto rounded-xl" style={{ border: `1px solid ${T.border}`, maxHeight: 360 }}>
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ backgroundColor: C.accentWash }}>
                      <th className="px-3 py-2.5 text-left font-bold" style={{ color: "#3730a3" }}>Claim Status</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Total Claims</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Claimed</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Approved</th>
                      <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>% Claims</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsMis.statusSummary.map((s) => (
                      <tr key={s.status} className="hover:bg-[#F8F9FC]">
                        <td className="px-3 py-2" style={{ borderTop: `1px solid ${T.borderLight}` }}>
                          <StatusPill status={s.status} />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}>
                          {nf(s.claims)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                          {inrCompact(s.claimed)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                          {inrCompact(s.approved)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: C.accent, borderTop: `1px solid ${T.borderLight}` }}>
                          {pctOf(s.claims, statusTotals.claims)}%
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: C.accent }}>
                      <td className="px-3 py-2.5 font-bold text-white">Total</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(statusTotals.claims)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{inrCompact(statusTotals.claimed)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{inrCompact(statusTotals.approved)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <InsightBox
                text={`${pctOf(
                  byStatus.SETTLED.claims,
                  statusTotals.claims
                )}% of claims settle. The ${nf(
                  byStatus.REJECTED.claims
                )} rejections and ${nf(
                  byStatus["DOCUMENTS DEFICIENT"].claims
                )} document-deficient claims are the two pools worth working — together they hold ${inrCompact(
                  byStatus.REJECTED.claimed + byStatus["DOCUMENTS DEFICIENT"].claimed
                )} of claimed value.`}
              />
            </WalletCard>
          </div>

          {/* ── Rejection summary ── */}
          <WalletCard
            accentColor={C.alert}
            title="Rejection Summary"
            subtitle={`${nf(rejectionTotal)} rejected claims in the window, grouped by reason.`}
            chartData={sortedRejections}
            chartDescription="Rejected claim counts grouped by reason."
          >
            <div className="mt-3 overflow-auto rounded-xl" style={{ border: `1px solid ${T.border}`, maxHeight: 420 }}>
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0 z-10">
                  <tr style={{ backgroundColor: C.accentWash }}>
                    <th className="px-3 py-2.5 text-left font-bold" style={{ color: "#3730a3" }}>Rejection Reason</th>
                    <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Claim Count</th>
                    <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>% Claims</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRejections.map((r) => (
                    <tr key={r.reason} className="hover:bg-[#F8F9FC]">
                      <td className="px-3 py-2" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {r.reason}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(r.claims)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {pctOf(r.claims, rejectionTotal)}%
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: C.alert }}>
                    <td className="px-3 py-2.5 font-bold text-white">Total</td>
                    <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(rejectionTotal)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <InsightBox
              text={`Sub-limit exhaustion (${nf(
                sortedRejections[0].claims
              )} claims) and the 45-day submission window (${nf(
                sortedRejections[1].claims
              )} claims) are the two largest reasons — between them ${pctOf(
                sortedRejections[0].claims + sortedRejections[1].claims,
                rejectionTotal
              )}% of every rejection. Both are avoidable with better in-app messaging before the member submits.`}
            />
          </WalletCard>
        </>
      ) : (
        <>
          <PageGlanceBox
            pageTitle="OPD Wallet — Reimbursement Claim MIS"
            pageSubtitle="Claim-level ledger for the reporting window, filterable by status, procedure and member."
            kpis={{ rows: misRows.length, totalClaims: h.totalClaims, approvedClaims: h.approvedClaims }}
            fallbackSummary={`A claim-level extract of the ${nf(
              h.totalClaims
            )} claims received in the window. Every row carries the procedure, its broad category, the claimed and approved amount, the UTR where settled, and the invoice, receipt and last-decision dates.`}
            fallbackChips={[
              { label: "Claims in Window", value: nf(h.totalClaims) },
              { label: "Approved", value: nf(h.approvedClaims) },
              { label: "Sample Rows", value: nf(misRows.length) },
            ]}
          />

          <WalletCard
            accentColor={C.accent}
            title="Claims Data Dump"
            subtitle={`${nf(filteredRows.length)} of ${nf(misRows.length)} sample rows shown.`}
            tooltipText="A representative extract of the claim MIS. The complete dump covers every claim received in the window and is available through the data export."
          >
            <div className="mt-3">
              <DataTable columns={misColumns} rows={pagedRows} getKey={(r) => r.claimNo} maxHeight={560} />
              <Pager page={safePage} pageCount={pageCount} total={filteredRows.length} onChange={setPage} />
            </div>
          </WalletCard>
        </>
      )}
    </div>
  );
}
