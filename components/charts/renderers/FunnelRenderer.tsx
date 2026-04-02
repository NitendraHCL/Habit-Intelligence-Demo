"use client";

import { CHART_PALETTE } from "@/lib/design-tokens";

interface FunnelData {
  name: string;
  value: number;
}

interface FunnelRendererProps {
  data: FunnelData[];
  colors?: string[];
}

export default function FunnelRenderer({
  data,
  colors = CHART_PALETTE,
}: FunnelRendererProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex flex-col items-center gap-1 h-full justify-center px-4">
      {data.map((item, i) => {
        const widthPercent = (item.value / maxValue) * 100;
        const conversionRate =
          i > 0 ? ((item.value / data[i - 1].value) * 100).toFixed(1) : null;

        return (
          <div key={item.name} className="w-full flex flex-col items-center">
            <div
              className="relative rounded-md py-2 px-4 text-center text-white text-xs font-medium transition-all hover:opacity-90"
              style={{
                width: `${widthPercent}%`,
                minWidth: "80px",
                backgroundColor: colors[i % colors.length],
              }}
            >
              <span className="font-semibold font-[var(--font-inter)]">{item.name}</span>
              <span className="ml-2 opacity-90">
                {item.value.toLocaleString()}
              </span>
            </div>
            {conversionRate && (
              <div className="text-[10px] text-muted-foreground my-0.5">
                {conversionRate}% conversion
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
