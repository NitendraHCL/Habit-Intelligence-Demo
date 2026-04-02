"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal } from "lucide-react";

interface FilterConfig {
  key: string;
  label: string;
  options: string[];
}

interface PageFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string[]>;
  onChange: (key: string, values: string[]) => void;
  onReset?: () => void;
}

export default function PageFilters({
  filters,
  values,
  onChange,
  onReset,
}: PageFiltersProps) {
  const totalActive = Object.values(values).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SlidersHorizontal size={14} className="text-muted-foreground" />
      {filters.map((filter) => {
        const selected = values[filter.key] || [];
        return (
          <FilterDropdown
            key={filter.key}
            label={filter.label}
            options={filter.options}
            selected={selected}
            onChange={(vals) => onChange(filter.key, vals)}
          />
        );
      })}
      {totalActive > 0 && onReset && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={onReset}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px] font-normal"
        >
          {label}
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 px-1 text-[10px] rounded-full bg-purple-100 text-purple-700"
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2" align="start">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-semibold font-[var(--font-inter)]">{label}</span>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => onChange([])}
            >
              <X size={10} />
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-44">
          <div className="space-y-0.5">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 px-1 py-1 rounded hover:bg-accent cursor-pointer text-[11px]"
              >
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggle(opt)}
                  className="h-3 w-3"
                />
                {opt}
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
