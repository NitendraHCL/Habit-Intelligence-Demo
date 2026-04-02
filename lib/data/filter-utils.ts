import type { FilterState } from "@/lib/filter-context";

export function buildQueryString(filters: FilterState): string {
  const params = new URLSearchParams();
  params.set("dateFrom", filters.dateRange.from.toISOString().split("T")[0]);
  params.set("dateTo", filters.dateRange.to.toISOString().split("T")[0]);
  if (filters.locations.length) params.set("locations", filters.locations.join(","));
  if (filters.genders.length) params.set("genders", filters.genders.join(","));
  if (filters.ageGroups.length) params.set("ageGroups", filters.ageGroups.join(","));
  if (filters.clientId !== "all") params.set("clientId", filters.clientId);
  return params.toString();
}

export function applyClientFilter<T extends { location?: string; gender?: string; ageGroup?: string }>(
  data: T[],
  filters: FilterState
): T[] {
  return data.filter((item) => {
    if (filters.locations.length && item.location && !filters.locations.includes(item.location)) return false;
    if (filters.genders.length && item.gender && !filters.genders.includes(item.gender)) return false;
    if (filters.ageGroups.length && item.ageGroup && !filters.ageGroups.includes(item.ageGroup)) return false;
    return true;
  });
}

export function getMultiplier(filters: FilterState): number {
  let multiplier = 1;
  if (filters.locations.length > 0 && filters.locations.length < 8) {
    multiplier *= filters.locations.length / 8;
  }
  if (filters.genders.length > 0 && filters.genders.length < 3) {
    multiplier *= filters.genders.length / 3;
  }
  if (filters.ageGroups.length > 0 && filters.ageGroups.length < 5) {
    multiplier *= filters.ageGroups.length / 5;
  }
  return multiplier;
}
