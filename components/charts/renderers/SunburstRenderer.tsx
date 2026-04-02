"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
  itemStyle?: { color?: string };
}

interface SunburstRendererProps {
  data: SunburstNode[];
  title?: string;
}

export default function SunburstRenderer({
  data,
}: SunburstRendererProps) {
  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value: number }) =>
        `${params.name}: ${params.value}`,
    },
    series: [
      {
        type: "sunburst",
        data,
        radius: ["15%", "90%"],
        sort: undefined,
        emphasis: { focus: "ancestor" },
        levels: [
          {},
          {
            r0: "15%",
            r: "45%",
            label: { fontSize: 10 },
            itemStyle: { borderWidth: 2 },
          },
          {
            r0: "45%",
            r: "70%",
            label: { fontSize: 9 },
            itemStyle: { borderWidth: 1 },
          },
          {
            r0: "70%",
            r: "90%",
            label: { fontSize: 8, position: "outside" },
            itemStyle: { borderWidth: 1 },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />;
}
