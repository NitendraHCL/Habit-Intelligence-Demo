"use client";

import dynamic from "next/dynamic";
import { CHART_PALETTE } from "@/lib/design-tokens";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}

interface TreemapRendererProps {
  data: TreemapData[];
}

export default function TreemapRenderer({ data }: TreemapRendererProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const option = {
    tooltip: {
      formatter: (params: { name: string; value: number }) => {
        const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : "0";
        return `<strong>${params.name}</strong><br/>${params.value.toLocaleString()} &nbsp;(${pct}%)`;
      },
    },
    series: [
      {
        type: "treemap",
        data: data.map((d, i) => ({
          ...d,
          itemStyle: { color: CHART_PALETTE[i % CHART_PALETTE.length] },
        })),
        roam: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          color: "#fff",
          overflow: "truncate",
          formatter: (params: { name: string; value: number }) => {
            const pct = total > 0 ? ((params.value / total) * 100).toFixed(0) : "0";
            return `{name|${params.name}}\n{count|${params.value.toLocaleString()}}{pct|  ${pct}%}`;
          },
          rich: {
            name: {
              fontSize: 12,
              fontWeight: "bold" as const,
              color: "#fff",
              lineHeight: 18,
            },
            count: {
              fontSize: 11,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 16,
            },
            pct: {
              fontSize: 10,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 16,
            },
          },
        },
        upperLabel: { show: false },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 2,
          gapWidth: 2,
        },
        levels: [
          {
            itemStyle: { borderColor: "#fff", borderWidth: 2, gapWidth: 2 },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />;
}
