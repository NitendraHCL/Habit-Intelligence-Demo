"use client";

import { useMemo, useState } from "react";
import { Info, TrendingDown, TrendingUp } from "lucide-react";

import { T } from "@/lib/ui/theme";
import { cn } from "@/lib/utils";
import { PageGlanceBox } from "@/components/dashboard/PageGlanceBox";
import { PageDownload } from "@/components/shared/PageDownload";
import { NotificationsBell } from "@/components/NotificationsBell";
import { ResetFilter } from "@/components/ui/reset-filter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  C,
  SERIES,
  WalletCard,
  StatTile,
  InsightBox,
  Toolbar,
  TabStrip,
  FilterMultiSelect,
  FilterChips,
  Legend,
} from "@/components/opd-wallet/ui";
import { Donut, HBar } from "@/components/opd-wallet/charts";
import { nf, pctOf, ENTITIES } from "@/lib/data/opd-wallet";
import {
  verticals,
  monthOnMonth,
  monthChangePct,
  ticketStatus,
  valueBands,
  totalsFor,
  worstRateVertical,
  largestVolumeVertical,
  POLICY_YEARS,
} from "@/lib/data/opd-wallet-feedback";

const ALL = "all";

const TABS = [
  { key: ALL, label: "All Verticals" },
  ...verticals.map((v) => ({ key: v.key, label: v.label })),
];

const hours = (n: number) => `${n.toFixed(1)} hours`;
const mins = (n: number) => `${n} mins`;

/** Shares carry one decimal, so 3% and 3.4% line up. */
const rate1 = (n: number) => `${n.toFixed(1)}%`;
/** Grievance rates are all under 1% of orders, so they need two decimals to tell apart. */
const rate2 = (n: number) => `${n.toFixed(2)}%`;
const share = (part: number, total: number) => rate1(pctOf(part, total));

/** Cards the spec only publishes at programme level carry this marker. */
function ScopeNote() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
          style={{ backgroundColor: "#F1F2F6", color: T.textMuted }}
        >
          <Info size={10} />
          All verticals
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        This card is reported at programme level only — it is not broken down per vertical, so it
        stays the same whichever tab is open.
      </TooltipContent>
    </Tooltip>
  );
}

export default function OpdWalletUserFeedbackPage() {
  const [activeKey, setActiveKey] = useState(ALL);
  const [entities, setEntities] = useState<string[]>([]);
  const [policyYears, setPolicyYears] = useState<string[]>([]);

  const scoped = activeKey === ALL ? null : activeKey;
  const t = useMemo(() => totalsFor(scoped), [scoped]);
  const vertical = useMemo(() => verticals.find((v) => v.key === scoped) ?? null, [scoped]);

  const worst = useMemo(() => worstRateVertical(), []);
  const largest = useMemo(() => largestVolumeVertical(), []);

  const resolutionPct = pctOf(t.resolved, t.raised);

  const clientLabel =
    entities.length === 0
      ? "All entities"
      : entities.length === 1
      ? entities[0]
      : `${entities.length} entities`;

  const chips = [
    ...entities.map((e) => ({
      key: "Entity",
      value: e,
      clear: () => setEntities((p) => p.filter((v) => v !== e)),
    })),
    ...policyYears.map((y) => ({
      key: "Policy Year",
      value: y,
      clear: () => setPolicyYears((p) => p.filter((v) => v !== y)),
    })),
  ];
  const clearAll = () => {
    setEntities([]);
    setPolicyYears([]);
  };

  /** Leading reason for the open tab; on All Verticals there is no shared list. */
  const leadingReason = vertical
    ? [...vertical.reasons].sort((a, b) => b.count - a.count)[0]
    : null;

  const summary = vertical
    ? `${nf(t.raised)} grievances were raised against ${nf(
        t.orders
      )} ${vertical.label.toLowerCase()} orders — a ${rate2(t.rate)} grievance rate. "${
        leadingReason!.reason
      }" leads at ${share(leadingReason!.count, t.raised)} of the vertical's grievances. Across the programme ${
        worst.vertical.label
      } carries the highest grievance rate at ${rate2(worst.rate)}.`
    : `${nf(t.raised)} grievances were raised against ${nf(
        t.orders
      )} orders this period — a ${rate2(t.rate)} grievance rate, with ${nf(
        t.resolved
      )} resolved and ${nf(t.open)} still open. ${
        largest.label
      } carries the most grievances by volume at ${nf(
        largest.raised
      )}, while ${worst.vertical.label} has the highest grievance rate at ${rate2(worst.rate)}.`;

  const momDown = monthChangePct < 0;

  const reasonData = vertical
    ? [...vertical.reasons]
        .sort((a, b) => b.count - a.count)
        .map((r) => ({ name: r.reason, value: r.count }))
    : [];

  return (
    <div className="animate-stagger space-y-6">
      {/* ── Toolbar ── */}
      <Toolbar>
        <FilterMultiSelect
          label="Entity"
          options={ENTITIES}
          selected={entities}
          onChange={setEntities}
          width={240}
        />
        <FilterMultiSelect
          label="Policy Year"
          options={POLICY_YEARS}
          selected={policyYears}
          onChange={setPolicyYears}
          width={160}
        />
        <ResetFilter visible={chips.length > 0} onClick={clearAll} />
        <div className="flex-1" />
        <span className="text-[11px] font-medium mr-1" style={{ color: T.textMuted }}>
          Data as of 14 September 2026
        </span>
        <PageDownload pageTitle="OPD Wallet — User Feedback" />
        <NotificationsBell />
      </Toolbar>

      <FilterChips chips={chips} onClearAll={clearAll} />

      {/* ── Vertical tabs ── */}
      <TabStrip tabs={TABS} active={activeKey} onChange={setActiveKey} />

      {/* ── Banner ── */}
      <PageGlanceBox
        key={activeKey}
        pageTitle="OPD Wallet — User Feedback"
        pageSubtitle="Grievances raised against orders and claims, where they came from, and how long they took to resolve."
        kpis={{
          vertical: t.label,
          raised: t.raised,
          rate: t.rate,
          resolved: t.resolved,
          open: t.open,
          tatHours: t.tatHours,
          firstActionMinutes: t.firstActionMinutes,
          leadingReason: leadingReason?.reason ?? null,
        }}
        fallbackSummary={summary}
        fallbackChips={[{ label: "Client", value: clientLabel }]}
      />

      {/* ── Stat card row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatTile
          label="Total Grievances Raised"
          value={nf(t.raised)}
          color={C.accent}
          compact
          tooltip={
            vertical
              ? `Grievances raised against ${vertical.label} orders.`
              : "Sum of grievances across all eight verticals."
          }
        />
        <StatTile
          label="Grievance Rate"
          value={rate2(t.rate)}
          color={C.violet}
          compact
          sub={`of ${nf(t.orders)} orders`}
          tooltip="Grievances raised divided by total orders in the same scope."
        />
        <StatTile
          label="Resolved"
          value={nf(t.resolved)}
          color={C.teal}
          compact
          sub={`${rate1(resolutionPct)} of raised`}
        />
        <StatTile
          label="Still Open"
          value={nf(t.open)}
          color={C.alert}
          compact
          sub={`${share(t.open, t.raised)} of raised`}
        />
        <StatTile
          label="Avg Order Level TAT"
          value={hours(t.tatHours)}
          color={C.accentMid}
          compact
          tooltip={
            vertical
              ? `Average order-level turnaround time for ${vertical.label}.`
              : "Each vertical's turnaround time weighted by its own grievance count, so the busiest verticals carry the most weight."
          }
        />
        <StatTile
          label="First Time to Act"
          value={mins(t.firstActionMinutes)}
          color={C.teal}
          compact
          tooltip={
            vertical
              ? `Time to first action on a ${vertical.label} grievance.`
              : "Weighted by grievance count, the same way as turnaround time."
          }
        />
      </div>

      {/* ── Month on month / resolution / ticket status ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <WalletCard
          accentColor={C.accent}
          title="Month on Month"
          subtitle="Grievance volume across the last three full months."
          rightHeader={<ScopeNote />}
          expandable={false}
        >
          <div className="mt-3 space-y-2.5">
            {[
              { label: "Last full month", value: monthOnMonth.lastFullMonth, strong: true },
              { label: "Previous month", value: monthOnMonth.previousMonth, strong: false },
              { label: "Two months back", value: monthOnMonth.twoMonthsBack, strong: false },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between">
                <span className="text-[12.5px]" style={{ color: T.textSecondary }}>
                  {row.label}
                </span>
                <span
                  className={cn("tabular-nums", row.strong ? "text-[20px] font-extrabold" : "text-[15px] font-semibold")}
                  style={{ color: row.strong ? T.textPrimary : T.textMuted }}
                >
                  {nf(row.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span
              className="text-[38px] font-extrabold leading-none tracking-[-0.03em]"
              style={{ color: momDown ? C.teal : C.alert }}
            >
              {monthChangePct > 0 ? "+" : ""}
              {monthChangePct}%
            </span>
            {momDown ? (
              <TrendingDown size={26} style={{ color: C.teal }} />
            ) : (
              <TrendingUp size={26} style={{ color: C.alert }} />
            )}
          </div>
          <p className="mt-2 text-center text-[11.5px]" style={{ color: T.textSecondary }}>
            against the previous month
          </p>
        </WalletCard>

        <WalletCard
          accentColor={C.teal}
          title="Resolution Status"
          subtitle={`${nf(t.resolved)} of ${nf(t.raised)} grievances raised have been resolved.`}
          chartData={{ resolved: t.resolved, open: t.open }}
          chartDescription="Resolved versus still-open grievances."
        >
          <Donut
            data={[
              { name: "Resolved", value: t.resolved },
              { name: "Still open", value: t.open },
            ]}
            centerValue={`${resolutionPct}%`}
            centerLabel="Resolved"
            height={220}
            colors={[C.teal, C.alert]}
          />
          <Legend
            items={[
              { name: "Resolved", value: nf(t.resolved), color: C.teal },
              { name: "Still open", value: nf(t.open), color: C.alert },
            ]}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.violet}
          title="Ticket Status"
          subtitle="Whether a resolved grievance stayed resolved."
          rightHeader={<ScopeNote />}
          chartData={ticketStatus}
          chartDescription="Grievances split by resolved-first-time, reopened, and still open."
        >
          <Donut
            data={ticketStatus}
            centerValue={nf(ticketStatus.reduce((a, b) => a + b.value, 0))}
            centerLabel="Raised"
            height={220}
            colors={[C.teal, C.accentMid, C.alert]}
          />
          <Legend
            items={ticketStatus.map((s, i) => ({
              name: s.name,
              value: `${nf(s.value)} (${share(
                s.value,
                ticketStatus.reduce((a, b) => a + b.value, 0)
              )})`,
              color: [C.teal, C.accentMid, C.alert][i],
            }))}
          />
        </WalletCard>
      </div>

      {/* ── Reason reported (vertical scoped) ── */}
      {vertical && (
        <WalletCard
          accentColor={C.alert}
          title={`Reason Reported — ${vertical.label}`}
          subtitle={
            vertical.note ??
            `What the ${nf(vertical.raised)} ${vertical.label.toLowerCase()} grievances were actually about.`
          }
          tooltipText="Each vertical keeps its own reason list — the labels do not carry across verticals, which is why this card is hidden on the All Verticals tab."
          chartData={vertical.reasons}
          chartDescription={`Grievance reasons for ${vertical.label}, ranked by volume.`}
        >
          <HBar
            data={reasonData}
            height={Math.max(220, reasonData.length * 42)}
            labelWidth={230}
            color={C.alert}
          />
          <InsightBox
            text={`"${leadingReason!.reason}" accounts for ${share(
              leadingReason!.count,
              vertical.raised
            )} of ${vertical.label} grievances on its own. The top three reasons together cover ${share(
              reasonData.slice(0, 3).reduce((a, b) => a + b.value, 0),
              vertical.raised
            )}.`}
          />
        </WalletCard>
      )}

      {/* ── Funnel + TAT tables ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <WalletCard
          accentColor={C.accent}
          title="Service Vertical Funnel"
          subtitle="Orders, grievances and where they landed, per vertical."
          chartData={verticals}
          chartDescription="Orders, grievances raised, grievance rate, resolved and open per service vertical."
        >
          <div className="mt-3 overflow-auto rounded-xl" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr style={{ backgroundColor: C.accentWash }}>
                  <th className="px-3 py-2.5 text-left font-bold" style={{ color: "#3730a3" }}>Vertical</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Orders</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Raised</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Rate</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Resolved</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Open</th>
                </tr>
              </thead>
              <tbody>
                {verticals.map((v) => {
                  const isActive = v.key === scoped;
                  const rate = pctOf(v.raised, v.orders);
                  return (
                    <tr
                      key={v.key}
                      onClick={() => setActiveKey(isActive ? ALL : v.key)}
                      className="cursor-pointer hover:bg-[#F8F9FC]"
                      style={isActive ? { backgroundColor: C.accentWash } : undefined}
                    >
                      <td
                        className="px-3 py-2 font-medium"
                        style={{ color: isActive ? C.accent : T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}
                      >
                        {v.label}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(v.orders)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(v.raised)}
                      </td>
                      <td
                        className="px-3 py-2 text-right tabular-nums font-semibold"
                        style={{
                          color: rate >= 0.3 ? C.alert : T.textSecondary,
                          borderTop: `1px solid ${T.borderLight}`,
                        }}
                      >
                        {rate2(rate)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(v.resolved)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(v.open)}
                      </td>
                    </tr>
                  );
                })}
                {(() => {
                  const all = totalsFor(null);
                  return (
                    <tr style={{ backgroundColor: C.accent }}>
                      <td className="px-3 py-2.5 font-bold text-white">Total</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(all.orders)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(all.raised)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{rate2(all.rate)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(all.resolved)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(all.open)}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[11px]" style={{ color: T.textMuted }}>
            Click any row to scope the page to that vertical.
          </p>
        </WalletCard>

        <WalletCard
          accentColor={C.teal}
          title="Turnaround Time by Vertical"
          subtitle="The per-vertical figures the stat row is weighted from."
          chartData={verticals.map((v) => ({
            vertical: v.label,
            tatHours: v.tatHours,
            firstActionMinutes: v.firstActionMinutes,
          }))}
          chartDescription="Average order-level turnaround time and first time to act per vertical."
        >
          <div className="mt-3 overflow-auto rounded-xl" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr style={{ backgroundColor: C.accentWash }}>
                  <th className="px-3 py-2.5 text-left font-bold" style={{ color: "#3730a3" }}>Vertical</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Avg Order Level TAT</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>First Time to Act</th>
                </tr>
              </thead>
              <tbody>
                {verticals.map((v) => {
                  const isActive = v.key === scoped;
                  return (
                    <tr
                      key={v.key}
                      onClick={() => setActiveKey(isActive ? ALL : v.key)}
                      className="cursor-pointer hover:bg-[#F8F9FC]"
                      style={isActive ? { backgroundColor: C.accentWash } : undefined}
                    >
                      <td
                        className="px-3 py-2.5 font-medium"
                        style={{ color: isActive ? C.accent : T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}
                      >
                        {v.label}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {hours(v.tatHours)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {mins(v.firstActionMinutes)}
                      </td>
                    </tr>
                  );
                })}
                {(() => {
                  const all = totalsFor(null);
                  return (
                    <tr style={{ backgroundColor: C.teal }}>
                      <td className="px-3 py-2.5 font-bold text-white">Weighted average</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{hours(all.tatHours)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{mins(all.firstActionMinutes)}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
          <InsightBox
            text={`Reimbursement Claim is the slowest line on both measures — ${hours(
              verticals.find((v) => v.key === "reimbursement")!.tatHours
            )} to close and ${mins(
              verticals.find((v) => v.key === "reimbursement")!.firstActionMinutes
            )} to first touch — and it also carries the highest grievance rate, so the same vertical is failing twice over.`}
          />
        </WalletCard>
      </div>

      {/* ── Value bands ── */}
      <WalletCard
        accentColor={C.violet}
        title="Grievance by Claim Value Band"
        subtitle="How grievance volume and turnaround time move with the value at stake."
        rightHeader={<ScopeNote />}
        chartData={valueBands}
        chartDescription="Grievances, resolution and turnaround time by claim value band."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-3">
          <div className="overflow-auto rounded-xl" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr style={{ backgroundColor: C.accentWash }}>
                  <th className="px-3 py-2.5 text-left font-bold" style={{ color: "#3730a3" }}>Value Band</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Grievances</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>% Total</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Resolved</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Open</th>
                  <th className="px-3 py-2.5 text-right font-bold" style={{ color: "#3730a3" }}>Avg TAT</th>
                </tr>
              </thead>
              <tbody>
                {valueBands.map((b) => {
                  const bandTotal = valueBands.reduce((a, x) => a + x.grievances, 0);
                  return (
                    <tr key={b.band} className="hover:bg-[#F8F9FC]">
                      <td className="px-3 py-2.5 font-medium" style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}>
                        {b.band}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textPrimary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(b.grievances)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {share(b.grievances, bandTotal)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(b.resolved)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {nf(b.open)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: T.textSecondary, borderTop: `1px solid ${T.borderLight}` }}>
                        {hours(b.tatHours)}
                      </td>
                    </tr>
                  );
                })}
                {(() => {
                  const g = valueBands.reduce((a, x) => a + x.grievances, 0);
                  const r = valueBands.reduce((a, x) => a + x.resolved, 0);
                  const o = valueBands.reduce((a, x) => a + x.open, 0);
                  return (
                    <tr style={{ backgroundColor: C.violet }}>
                      <td className="px-3 py-2.5 font-bold text-white">Total</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(g)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">100.0%</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(r)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">{nf(o)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-white tabular-nums">—</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

          <div>
            <Donut
              data={valueBands.map((b) => ({ name: b.band, value: b.grievances }))}
              centerValue={nf(valueBands.reduce((a, x) => a + x.grievances, 0))}
              centerLabel="Grievances"
              height={230}
            />
            <Legend
              items={valueBands.map((b, i) => ({
                name: b.band,
                value: `${nf(b.grievances)} · ${hours(b.tatHours)}`,
                color: SERIES[i % SERIES.length],
              }))}
            />
          </div>
        </div>
        <InsightBox
          text={`Turnaround time climbs steadily with value — from ${hours(valueBands[0].tatHours)} under ₹500 to ${hours(
            valueBands[3].tatHours
          )} above ₹10,000 — but the largest band is also the one least likely to be left open, at ${share(
            valueBands[3].open,
            valueBands[3].grievances
          )}. The pressure sits in the ₹500–₹10,000 middle, which holds ${share(
            valueBands[1].open + valueBands[2].open,
            valueBands.reduce((a, x) => a + x.open, 0)
          )} of everything still open.`}
        />
      </WalletCard>
    </div>
  );
}
