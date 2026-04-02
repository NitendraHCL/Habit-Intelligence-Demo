"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_PALETTE } from "@/lib/design-tokens";

interface RadarChartRendererProps {
  data: Record<string, unknown>[];
  angleKey: string;
  radars: { key: string; name?: string; color?: string }[];
  showLegend?: boolean;
}

export default function RadarChartRenderer({
  data,
  angleKey,
  radars,
  showLegend = true,
}: RadarChartRendererProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey={angleKey} tick={{ fontSize: 10 }} />
        <PolarRadiusAxis tick={{ fontSize: 9 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: 12,
          }}
        />
        {radars.map((r, i) => (
          <Radar
            key={r.key}
            name={r.name || r.key}
            dataKey={r.key}
            stroke={r.color || CHART_PALETTE[i % CHART_PALETTE.length]}
            fill={r.color || CHART_PALETTE[i % CHART_PALETTE.length]}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        ))}
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
      </RadarChart>
    </ResponsiveContainer>
  );
}
