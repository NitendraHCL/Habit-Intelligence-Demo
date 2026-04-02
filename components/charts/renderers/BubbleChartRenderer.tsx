"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_PALETTE } from "@/lib/design-tokens";

interface BubbleChartRendererProps {
  datasets: {
    name: string;
    data: Record<string, unknown>[];
    color?: string;
  }[];
  xKey: string;
  yKey: string;
  zKey: string;
  xLabel?: string;
  yLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export default function BubbleChartRenderer({
  datasets,
  xKey,
  yKey,
  zKey,
  xLabel,
  yLabel,
  showGrid = true,
  showLegend = true,
}: BubbleChartRendererProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis
          dataKey={xKey}
          type="number"
          name={xLabel || xKey}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          dataKey={yKey}
          type="number"
          name={yLabel || yKey}
          tick={{ fontSize: 11 }}
        />
        <ZAxis dataKey={zKey} range={[40, 400]} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: 12,
          }}
          cursor={{ strokeDasharray: "3 3" }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {datasets.map((ds, i) => (
          <Scatter
            key={ds.name}
            name={ds.name}
            data={ds.data}
            fill={ds.color || CHART_PALETTE[i % CHART_PALETTE.length]}
            opacity={0.7}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
