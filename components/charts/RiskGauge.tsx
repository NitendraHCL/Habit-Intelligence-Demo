"use client";

import dynamic from "next/dynamic";
import { SEVERITY } from "@/lib/design-tokens";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface RiskGaugeProps {
  value: number;
  max?: number;
  title?: string;
  size?: number;
}

export default function RiskGauge({
  value,
  max = 100,
  title,
}: RiskGaugeProps) {
  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max,
        pointer: { show: true, length: "60%", width: 4 },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.3, SEVERITY.critical],
              [0.6, SEVERITY.warning],
              [1, SEVERITY.good],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { fontSize: 10, distance: 25 },
        detail: {
          valueAnimation: true,
          fontSize: 22,
          fontWeight: "bold" as const,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          offsetCenter: [0, "60%"],
          formatter: (val: number) => `${val}`,
        },
        title: {
          show: !!title,
          offsetCenter: [0, "85%"],
          fontSize: 12,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          color: "#666",
        },
        data: [{ value, name: title || "" }],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />;
}
