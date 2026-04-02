"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGrid } from "lucide-react";

interface ChartTogglePanelProps {
  charts: { id: string; label: string }[];
  visible: Record<string, boolean>;
  onToggle: (id: string, visible: boolean) => void;
}

export default function ChartTogglePanel({
  charts,
  visible,
  onToggle,
}: ChartTogglePanelProps) {
  const [open, setOpen] = useState(false);
  const visibleCount = Object.values(visible).filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <LayoutGrid size={14} />
          Charts ({visibleCount}/{charts.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="text-xs font-semibold mb-2 font-[var(--font-inter)]">Toggle Charts</p>
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {charts.map((chart) => (
              <div
                key={chart.id}
                className="flex items-center justify-between py-1"
              >
                <Label
                  htmlFor={chart.id}
                  className="text-xs cursor-pointer flex-1"
                >
                  {chart.label}
                </Label>
                <Switch
                  id={chart.id}
                  checked={visible[chart.id] !== false}
                  onCheckedChange={(checked) => onToggle(chart.id, checked)}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
