"use client";

/**
 * Chart wrappers for the OPD Wallet section.
 *
 * Recharts is configured once here so all four dashboards share the same axis
 * treatment, tooltip and colour order rather than re-declaring them per page.
 */

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend as RechartsLegend,
  Treemap,
  LabelList,
} from "recharts";

import { T } from "@/lib/ui/theme";
import { C, SERIES } from "@/components/opd-wallet/ui";

const AXIS = { fontSize: 11, fill: T.textMuted } as const;

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: `1px solid ${T.border}`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    fontSize: 12,
  },
  labelStyle: { fontWeight: 700, color: T.textPrimary, fontSize: 12 },
} as const;

const nfmt = (n: number) => n.toLocaleString("en-IN");

/**
 * Recharts types its tooltip/label formatters against a union that includes
 * undefined and string, so a plain (n: number) => string can't be handed over
 * directly. Widening the parameter here keeps the call sites readable.
 */
const asFormatter = (format: (n: number) => string) => (value: unknown) => format(Number(value));

/* ─── Donut ────────────────────────────────────────────────────────────── */

export function Donut({
  data,
  height = 240,
  centerValue,
  centerLabel,
  colors = SERIES,
  innerRadius = "62%",
  format = nfmt,
}: {
  data: { name: string; value: number }[];
  height?: number;
  centerValue?: string;
  centerLabel?: string;
  colors?: string[];
  innerRadius?: string;
  format?: (n: number) => string;
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius="88%"
            paddingAngle={1.5}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <RechartsTooltip {...tooltipStyle} formatter={asFormatter(format)} />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && (
            <span
              className="text-[24px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ color: T.textPrimary }}
            >
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span
              className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: T.textMuted }}
            >
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Half-donut gauge ─────────────────────────────────────────────────── */

export function Gauge({
  value,
  height = 200,
  color = C.accent,
  suffix = "%",
}: {
  value: number;
  height?: number;
  color?: string;
  suffix?: string;
}) {
  const data = [
    { name: "value", value },
    { name: "rest", value: Math.max(100 - value, 0) },
  ];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={180}
            endAngle={0}
            cy="78%"
            innerRadius="88%"
            outerRadius="125%"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#EEF0F6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-x-0 bottom-3 flex flex-col items-center pointer-events-none">
        <span className="text-[28px] font-extrabold leading-none tracking-[-0.02em]" style={{ color }}>
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );
}

/* ─── Horizontal ranked bars ───────────────────────────────────────────── */

export function HBar({
  data,
  height = 280,
  color = C.accent,
  format = nfmt,
  labelWidth = 92,
}: {
  data: { name: string; value: number }[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
  labelWidth?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={T.borderLight} />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={format} />
          <YAxis
            type="category"
            dataKey="name"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={labelWidth}
          />
          <RechartsTooltip {...tooltipStyle} cursor={{ fill: "#F5F6FA" }} formatter={asFormatter(format)} />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={16}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={asFormatter(format)}
              style={{ fontSize: 11, fill: T.textSecondary, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Area trend ───────────────────────────────────────────────────────── */

export function TrendArea({
  data,
  xKey = "month",
  yKey = "value",
  height = 240,
  color = C.accent,
  format = nfmt,
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  yKey?: string;
  height?: number;
  color?: string;
  format?: (n: number) => string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={T.borderLight} />
          <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={format} width={52} />
          <RechartsTooltip {...tooltipStyle} formatter={asFormatter(format)} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2.4}
            fill={`url(#grad-${yKey})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Multi-series line ────────────────────────────────────────────────── */

export function MultiLine({
  data,
  series,
  xKey = "month",
  height = 300,
  format = nfmt,
}: {
  data: Record<string, string | number>[];
  series: string[];
  xKey?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={T.borderLight} />
          <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={format} width={52} />
          <RechartsTooltip {...tooltipStyle} formatter={asFormatter(format)} />
          <RechartsLegend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={7}
          />
          {series.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={SERIES[i % SERIES.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Stacked bars ─────────────────────────────────────────────────────── */

export function StackedBar({
  data,
  series,
  xKey,
  height = 300,
  layout = "horizontal",
  format = nfmt,
}: {
  data: Record<string, string | number>[];
  series: string[];
  xKey: string;
  height?: number;
  layout?: "horizontal" | "vertical";
  format?: (n: number) => string;
}) {
  const vertical = layout === "vertical";
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 12, right: 12, left: vertical ? 4 : 0, bottom: 4 }}
        >
          <CartesianGrid vertical={vertical} horizontal={!vertical} stroke={T.borderLight} />
          {vertical ? (
            <>
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={format} />
              <YAxis type="category" dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} width={56} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={format} width={52} />
            </>
          )}
          <RechartsTooltip {...tooltipStyle} cursor={{ fill: "#F5F6FA" }} formatter={asFormatter(format)} />
          <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={7} />
          {series.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={SERIES[i % SERIES.length]}
              maxBarSize={30}
              radius={i === series.length - 1 ? (vertical ? [0, 5, 5, 0] : [5, 5, 0, 0]) : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Grouped bars (claimed vs approved) ───────────────────────────────── */

export function GroupedBar({
  data,
  series,
  xKey,
  height = 320,
  format = nfmt,
  labelWidth = 150,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
  xKey: string;
  height?: number;
  format?: (n: number) => string;
  labelWidth?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={T.borderLight} />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={format} />
          <YAxis
            type="category"
            dataKey={xKey}
            tick={{ ...AXIS, fontSize: 10.5 }}
            axisLine={false}
            tickLine={false}
            width={labelWidth}
          />
          <RechartsTooltip {...tooltipStyle} cursor={{ fill: "#F5F6FA" }} formatter={asFormatter(format)} />
          <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={7} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[0, 4, 4, 0]} barSize={9} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Treemap ──────────────────────────────────────────────────────────── */

interface TreemapNodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
}

function TreemapNode(props: TreemapNodeProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, name = "", value = 0 } = props;
  const fill = SERIES[index % SERIES.length];
  const showLabel = width > 64 && height > 40;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} fill={fill} stroke="#fff" strokeWidth={3} />
      {showLabel && (
        <>
          <text x={x + 10} y={y + 22} fill="#fff" fontSize={11.5} fontWeight={700}>
            {name.length > Math.floor(width / 7) ? `${name.slice(0, Math.floor(width / 7))}…` : name}
          </text>
          <text x={x + 10} y={y + 40} fill="rgba(255,255,255,0.88)" fontSize={13} fontWeight={800}>
            {value.toLocaleString("en-IN")}
          </text>
        </>
      )}
    </g>
  );
}

export function TreemapChart({
  data,
  height = 260,
}: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap data={data} dataKey="value" stroke="#fff" content={<TreemapNode />} isAnimationActive={false}>
          <RechartsTooltip {...tooltipStyle} formatter={asFormatter(nfmt)} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
