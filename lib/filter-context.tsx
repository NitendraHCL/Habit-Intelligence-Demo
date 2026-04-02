"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface FilterState {
  dateRange: { from: Date; to: Date };
  locations: string[];
  genders: string[];
  ageGroups: string[];
  specialties: string[];
  clientId: string;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const defaultFilters: FilterState = {
  dateRange: {
    from: new Date(2024, 0, 1),
    to: new Date(2026, 2, 31),
  },
  locations: [],
  genders: [],
  ageGroups: [],
  specialties: [],
  clientId: "all",
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const activeFilterCount =
    filters.locations.length +
    filters.genders.length +
    filters.ageGroups.length +
    filters.specialties.length;

  return (
    <FilterContext.Provider value={{ filters, setFilters, updateFilter, resetFilters, activeFilterCount }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within FilterProvider");
  return context;
}
