"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export default function KPICard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon: Icon,
  iconColor = "#7C3AED",
  className,
}: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          {Icon && (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${iconColor}15` }}
            >
              <Icon size={16} style={{ color: iconColor }} />
            </div>
          )}
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold font-[var(--font-inter)]">{value}</span>
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            {isPositive ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : isNegative ? (
              <TrendingDown size={12} className="text-red-500" />
            ) : null}
            <span
              className={cn(
                "font-medium",
                isPositive && "text-emerald-500",
                isNegative && "text-red-500",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {isPositive ? "+" : ""}
              {change}%
            </span>
            <span className="text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
