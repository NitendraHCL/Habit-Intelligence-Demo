"use client";

import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { T } from "@/lib/ui/theme";
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
  TabStrip,
  FilterMultiSelect,
  FilterChips,
  Legend,
} from "@/components/opd-wallet/ui";
import { Donut, Gauge, HBar, TrendArea, TreemapChart } from "@/components/opd-wallet/charts";
import { utilisationTabs, nf, pctOf, ENTITIES, type UtilTab } from "@/lib/data/opd-wallet";

const POLICY_YEARS = ["2025-26", "2024-25"] as const;

export default function OpdWalletUtilisationPage() {
  const [activeKey, setActiveKey] = useState(utilisationTabs[0].key);
  const [entities, setEntities] = useState<string[]>([]);
  const [policyYears, setPolicyYears] = useState<string[]>([]);

  const tab = useMemo<UtilTab>(
    () => utilisationTabs.find((t) => t.key === activeKey) ?? utilisationTabs[0],
    [activeKey]
  );

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

  const momDelta = pctOf(tab.mom.previous - tab.mom.twoBack, tab.mom.twoBack);
  const momDown = momDelta < 0;

  const statusTotal = tab.status.data.reduce((a, b) => a + b.value, 0);
  const genderTotal = tab.gender.reduce((a, b) => a + b.value, 0);
  const ageTotal = tab.age.reduce((a, b) => a + b.value, 0);
  const categoryTotal = tab.category.data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="animate-stagger space-y-6">
      {/* ── Toolbar ── */}
      <Toolbar>
        <FilterMultiSelect label="Entity" options={ENTITIES} selected={entities} onChange={setEntities} width={240} />
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
        <PageDownload pageTitle={`OPD Wallet — ${tab.title}`} />
        <NotificationsBell />
      </Toolbar>

      <FilterChips chips={chips} onClearAll={clearAll} />

      {/* ── Consumption tabs ── */}
      <TabStrip
        tabs={utilisationTabs.map((t) => ({ key: t.key, label: t.label }))}
        active={activeKey}
        onChange={setActiveKey}
      />

      <PageGlanceBox
        key={tab.key}
        pageTitle={`OPD Wallet — ${tab.title}`}
        pageSubtitle={tab.subtitle}
        kpis={Object.fromEntries(tab.kpis.map((k) => [k.label, k.value]))}
        fallbackSummary={tab.insight}
        fallbackChips={tab.kpis.slice(0, 4).map((k) => ({ label: k.label, value: k.value }))}
      />

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {tab.kpis.map((kpi, i) => (
          <StatTile
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            color={i % 2 === 0 ? C.accent : C.teal}
            compact
          />
        ))}
      </div>

      {/* ── Month on month / rating / status / age ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <WalletCard
          accentColor={C.accent}
          title="Month on Month"
          subtitle={`Last full month against the month before.`}
          expandable={false}
        >
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: T.textMuted }}>
                Previous month
              </p>
              <p className="text-[22px] font-extrabold leading-none mt-1.5" style={{ color: T.textPrimary }}>
                {nf(tab.mom.previous)}
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: T.textMuted }}>
                Two months back
              </p>
              <p className="text-[22px] font-extrabold leading-none mt-1.5" style={{ color: T.textMuted }}>
                {nf(tab.mom.twoBack)}
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span
              className="text-[42px] font-extrabold leading-none tracking-[-0.03em]"
              style={{ color: momDown ? C.alert : C.teal }}
            >
              {momDelta > 0 ? "+" : ""}
              {momDelta}%
            </span>
            {momDown ? (
              <TrendingDown size={30} style={{ color: C.alert }} />
            ) : (
              <TrendingUp size={30} style={{ color: C.teal }} />
            )}
          </div>
          <p className="mt-3 text-center text-[11.5px]" style={{ color: T.textSecondary }}>
            {tab.mom.unit} month on month
          </p>
        </WalletCard>

        <WalletCard accentColor={C.teal} title={tab.gauge.title} expandable={false}>
          <Gauge value={tab.gauge.value} color={C.teal} height={190} />
          <p className="text-center text-[11.5px] -mt-1" style={{ color: T.textSecondary }}>
            {tab.gauge.caption}
          </p>
        </WalletCard>

        <WalletCard
          accentColor={C.violet}
          title={tab.status.title}
          chartData={tab.status.data}
          chartDescription={`${tab.title} — ${tab.status.title}`}
        >
          <Donut
            data={tab.status.data}
            centerValue={nf(statusTotal)}
            centerLabel="Requests"
            height={190}
            colors={["#4f46e5", "#a78bfa", "#c4b5fd"]}
          />
          <Legend
            items={tab.status.data.map((s, i) => ({
              name: s.name,
              value: `${nf(s.value)} (${pctOf(s.value, statusTotal)}%)`,
              color: ["#4f46e5", "#a78bfa", "#c4b5fd"][i % 3],
            }))}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.accentMid}
          title="Age Split"
          chartData={tab.age}
          chartDescription={`${tab.title} by age band`}
        >
          <Donut data={tab.age} centerValue={nf(ageTotal)} centerLabel="Users" height={190} />
          <Legend
            items={tab.age.map((s, i) => ({
              name: s.name,
              value: `${nf(s.value)} (${pctOf(s.value, ageTotal)}%)`,
              color: SERIES[i % SERIES.length],
            }))}
          />
        </WalletCard>
      </div>

      {/* ── Category / gender / centres / locations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        <WalletCard
          accentColor={C.accent}
          title={tab.category.title}
          subtitle="Where the demand is concentrated."
          chartData={tab.category.data}
          chartDescription={`${tab.title} — ${tab.category.title}`}
        >
          <Donut
            data={tab.category.data}
            centerValue={nf(categoryTotal)}
            centerLabel="Total"
            height={210}
          />
          <Legend
            items={tab.category.data.slice(0, 8).map((s, i) => ({
              name: s.name,
              value: `${pctOf(s.value, categoryTotal)}%`,
              color: SERIES[i % SERIES.length],
            }))}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.teal}
          title="Gender Split"
          chartData={tab.gender}
          chartDescription={`${tab.title} by gender`}
        >
          <Donut
            data={tab.gender}
            centerValue={nf(genderTotal)}
            centerLabel="Users"
            height={210}
            innerRadius="0%"
            colors={["#4f46e5", "#a78bfa", "#a1a1aa"]}
          />
          <Legend
            items={tab.gender.map((s, i) => ({
              name: s.name,
              value: `${nf(s.value)} (${pctOf(s.value, genderTotal)}%)`,
              color: ["#4f46e5", "#a78bfa", "#a1a1aa"][i],
            }))}
          />
        </WalletCard>

        <WalletCard
          accentColor={C.violet}
          title={tab.centresTitle}
          subtitle="Highest-volume delivery points."
          chartData={tab.centres}
          chartDescription={`${tab.title} — ${tab.centresTitle}`}
        >
          <TreemapChart data={tab.centres} height={250} />
        </WalletCard>

        <WalletCard
          accentColor={C.accentMid}
          title="Top 10 Locations"
          subtitle="Consumption by city."
          chartData={tab.locations}
          chartDescription={`${tab.title} by location`}
        >
          <HBar data={tab.locations} height={270} labelWidth={92} color={C.accentMid} />
        </WalletCard>
      </div>

      {/* ── Relation split + trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <WalletCard
          accentColor={C.accent}
          title="Relation Split"
          subtitle="Who in the family is actually consuming the benefit."
          chartData={tab.relation}
          chartDescription={`${tab.title} by relation`}
        >
          <HBar data={tab.relation} height={250} labelWidth={72} />
        </WalletCard>

        <WalletCard
          className="lg:col-span-2"
          accentColor={C.teal}
          title="12-Month Trend"
          subtitle="Volume by month across the current policy year."
          chartData={tab.trend}
          chartDescription={`${tab.title} monthly trend`}
        >
          <TrendArea data={tab.trend} xKey="month" yKey="value" height={250} color={C.teal} />
          <InsightBox text={tab.insight} />
        </WalletCard>
      </div>
    </div>
  );
}
