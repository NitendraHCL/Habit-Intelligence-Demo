"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_PALETTE } from "@/lib/design-tokens";

interface AreaChartRendererProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: { key: string; name?: string; color?: string; stackId?: string }[];
  showGrid?: boolean;
  showLegend?: boolean;
}

export default function AreaChartRenderer({
  data,
  xKey,
  areas,
  showGrid = true,
  showLegend = true,
}: AreaChartRendererProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: 12,
          }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {areas.map((area, i) => {
          const color = area.color || CHART_PALETTE[i % CHART_PALETTE.length];
          return (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name || area.key}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
              stackId={area.stackId}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
