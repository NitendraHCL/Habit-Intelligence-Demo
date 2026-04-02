"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFilters } from "@/lib/filter-context";
import { AGE_GROUPS, GENDERS } from "@/lib/design-tokens";
import {
  CalendarDays,
  MapPin,
  Users,
  RotateCcw,
  X,
  Stethoscope,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/contexts/auth-context";

function MultiSelect({
  title,
  icon: Icon,
  options,
  selected,
  onChange,
  loading,
}: {
  title: string;
  icon: React.ElementType;
  options: readonly string[];
  selected: string[];
  onChange: (val: string[]) => void;
  loading?: boolean;
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
          className="h-8 gap-1.5 text-xs font-normal"
        >
          <Icon size={14} />
          {title}
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-4 px-1 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700"
            >
              {selected.length}
            </Badge>
          )}
          <ChevronDown size={12} className="ml-0.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold">{title}</span>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => onChange([])}
            >
              <X size={10} />
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-48">
          {loading ? (
            <div className="text-xs text-muted-foreground px-1 py-2">Loading...</div>
          ) : options.length === 0 ? (
            <div className="text-xs text-muted-foreground px-1 py-2">No options</div>
          ) : (
            <div className="space-y-1">
              {options.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-1 py-1 rounded hover:bg-accent cursor-pointer text-xs"
                >
                  <Checkbox
                    checked={selected.includes(opt)}
                    onCheckedChange={() => toggle(opt)}
                    className="h-3.5 w-3.5"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function GlobalFilters() {
  const { filters, updateFilter, resetFilters, activeFilterCount } = useFilters();
  const { activeClientId } = useAuth();
  const [dateOpen, setDateOpen] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Fetch real filter options when client changes
  useEffect(() => {
    if (!activeClientId || activeClientId === "all") return;

    setFiltersLoading(true);
    fetch(`/api/filters?clientId=${activeClientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.locations) setLocations(data.locations);
        if (data.specialties) setSpecialties(data.specialties);
      })
      .catch(() => {})
      .finally(() => setFiltersLoading(false));
  }, [activeClientId]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Date Range */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-normal"
          >
            <CalendarDays size={14} />
            {format(filters.dateRange.from, "dd-MM-yyyy")} &mdash;{" "}
            {format(filters.dateRange.to, "dd-MM-yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="range"
            selected={{
              from: filters.dateRange.from,
              to: filters.dateRange.to,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                updateFilter("dateRange", { from: range.from, to: range.to });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Location */}
      <MultiSelect
        title="Location"
        icon={MapPin}
        options={locations}
        selected={filters.locations}
        onChange={(val) => updateFilter("locations", val)}
        loading={filtersLoading}
      />

      {/* Gender */}
      <MultiSelect
        title="Gender"
        icon={Users}
        options={GENDERS}
        selected={filters.genders}
        onChange={(val) => updateFilter("genders", val)}
      />

      {/* Age Group */}
      <MultiSelect
        title="Age Group"
        icon={Users}
        options={AGE_GROUPS}
        selected={filters.ageGroups}
        onChange={(val) => updateFilter("ageGroups", val)}
      />

      {/* Specialty */}
      <MultiSelect
        title="Specialty"
        icon={Stethoscope}
        options={specialties}
        selected={filters.specialties}
        onChange={(val) => updateFilter("specialties", val)}
        loading={filtersLoading}
      />

      {/* Reset */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={resetFilters}
        >
          <RotateCcw size={12} />
          Reset
        </Button>
      )}
    </div>
  );
}
