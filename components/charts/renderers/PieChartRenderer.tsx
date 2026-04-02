"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import { CHART_PALETTE } from "@/lib/design-tokens";

interface PieChartRendererProps {
  data: { name: string; value: number }[];
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabel?: boolean;
  colors?: string[];
}

export default function PieChartRenderer({
  data,
  innerRadius = 0,
  outerRadius = 80,
  showLegend = true,
  showLabel = true,
  colors = CHART_PALETTE,
}: PieChartRendererProps) {
  const renderLabel = (props: PieLabelRenderProps) => {
    const name = String(props.name ?? "");
    const percent = Number(props.percent ?? 0);
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          label={showLabel ? renderLabel : undefined}
          labelLine={showLabel}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: 12,
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            layout="horizontal"
            verticalAlign="bottom"
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
