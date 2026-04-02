"use client";

import { CHART_PALETTE } from "@/lib/design-tokens";

interface FunnelStep {
  name: string;
  value: number;
  color?: string;
}

interface HealthFunnelProps {
  data: FunnelStep[];
  title?: string;
}

export default function HealthFunnel({ data, title }: HealthFunnelProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex flex-col h-full justify-center px-6">
      {title && (
        <p className="text-xs font-semibold text-muted-foreground mb-3 text-center font-[var(--font-inter)]">
          {title}
        </p>
      )}
      {data.map((step, i) => {
        const widthPercent = Math.max((step.value / maxValue) * 100, 20);
        const conversionRate =
          i > 0 ? ((step.value / data[i - 1].value) * 100).toFixed(1) : null;

        return (
          <div key={step.name} className="flex flex-col items-center">
            <div
              className="relative flex items-center justify-center rounded-lg py-2.5 px-4 text-white font-medium transition-all hover:opacity-90 cursor-default"
              style={{
                width: `${widthPercent}%`,
                minWidth: 100,
                backgroundColor:
                  step.color || CHART_PALETTE[i % CHART_PALETTE.length],
              }}
            >
              <span className="text-xs truncate">
                {step.name}: {step.value.toLocaleString()}
              </span>
            </div>
            {conversionRate && (
              <div className="flex items-center gap-1 my-1">
                <div className="w-px h-3 bg-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground font-medium">
                  {conversionRate}%
                </span>
                <div className="w-px h-3 bg-muted-foreground/30" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
