"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ChartFilterState {
  [chartId: string]: Record<string, string[]>;
}

interface ChartFilterContextType {
  filters: ChartFilterState;
  setChartFilter: (chartId: string, key: string, values: string[]) => void;
  getChartFilters: (chartId: string) => Record<string, string[]>;
  clearChartFilters: (chartId: string) => void;
}

const ChartFilterContext = createContext<ChartFilterContextType | undefined>(undefined);

export function ChartFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<ChartFilterState>({});

  const setChartFilter = useCallback((chartId: string, key: string, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [chartId]: {
        ...(prev[chartId] || {}),
        [key]: values,
      },
    }));
  }, []);

  const getChartFilters = useCallback(
    (chartId: string) => filters[chartId] || {},
    [filters]
  );

  const clearChartFilters = useCallback((chartId: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[chartId];
      return next;
    });
  }, []);

  return (
    <ChartFilterContext.Provider
      value={{ filters, setChartFilter, getChartFilters, clearChartFilters }}
    >
      {children}
    </ChartFilterContext.Provider>
  );
}

export function useChartFilters() {
  const context = useContext(ChartFilterContext);
  if (!context) throw new Error("useChartFilters must be used within ChartFilterProvider");
  return context;
}
