"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHART_PALETTE } from "@/lib/design-tokens";

interface BarChartRendererProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; name?: string; color?: string; stackId?: string }[];
  layout?: "horizontal" | "vertical";
  showGrid?: boolean;
  showLegend?: boolean;
  colorByIndex?: boolean;
}

export default function BarChartRenderer({
  data,
  xKey,
  bars,
  layout = "vertical",
  showGrid = true,
  showLegend = true,
  colorByIndex = false,
}: BarChartRendererProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={layout === "horizontal" ? "vertical" : "horizontal"}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        {layout === "horizontal" ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              dataKey={xKey}
              type="category"
              tick={{ fontSize: 11 }}
              width={100}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: 12,
          }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {bars.map((bar, i) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name || bar.key}
            fill={bar.color || CHART_PALETTE[i % CHART_PALETTE.length]}
            stackId={bar.stackId}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {colorByIndex &&
              data.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CHART_PALETTE[idx % CHART_PALETTE.length]}
                />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
