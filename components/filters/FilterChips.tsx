"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useFilters } from "@/lib/filter-context";

export default function FilterChips() {
  const { filters, updateFilter, activeFilterCount } = useFilters();

  if (activeFilterCount === 0) return null;

  const removeLocation = (loc: string) =>
    updateFilter(
      "locations",
      filters.locations.filter((l) => l !== loc)
    );
  const removeGender = (g: string) =>
    updateFilter(
      "genders",
      filters.genders.filter((v) => v !== g)
    );
  const removeAgeGroup = (a: string) =>
    updateFilter(
      "ageGroups",
      filters.ageGroups.filter((v) => v !== a)
    );

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-6 pb-2">
      {filters.locations.map((loc) => (
        <Badge
          key={loc}
          variant="secondary"
          className="text-[10px] gap-1 pl-2 pr-1 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
          onClick={() => removeLocation(loc)}
        >
          {loc}
          <X size={10} />
        </Badge>
      ))}
      {filters.genders.map((g) => (
        <Badge
          key={g}
          variant="secondary"
          className="text-[10px] gap-1 pl-2 pr-1 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
          onClick={() => removeGender(g)}
        >
          {g}
          <X size={10} />
        </Badge>
      ))}
      {filters.ageGroups.map((a) => (
        <Badge
          key={a}
          variant="secondary"
          className="text-[10px] gap-1 pl-2 pr-1 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
          onClick={() => removeAgeGroup(a)}
        >
          {a}
          <X size={10} />
        </Badge>
      ))}
    </div>
  );
}
