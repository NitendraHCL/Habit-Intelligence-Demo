"use client";

import { useState, useCallback, useEffect } from "react";

interface DashboardLayoutState {
  order: string[];
  visibility: Record<string, boolean>;
}

export function useDashboardLayout(pageKey: string, defaultChartIds: string[]) {
  const storageKey = `dashboard-layout-${pageKey}`;

  const [state, setState] = useState<DashboardLayoutState>(() => {
    if (typeof window === "undefined") {
      return { order: defaultChartIds, visibility: {} };
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { order: defaultChartIds, visibility: {} };
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [state, storageKey]);

  const reorder = useCallback((newOrder: string[]) => {
    setState((prev) => ({ ...prev, order: newOrder }));
  }, []);

  const toggleVisibility = useCallback((chartId: string, visible: boolean) => {
    setState((prev) => ({
      ...prev,
      visibility: { ...prev.visibility, [chartId]: visible },
    }));
  }, []);

  const isVisible = useCallback(
    (chartId: string) => state.visibility[chartId] !== false,
    [state.visibility]
  );

  const visibleCharts = state.order.filter((id) => isVisible(id));

  return {
    order: state.order,
    visibility: state.visibility,
    visibleCharts,
    reorder,
    toggleVisibility,
    isVisible,
  };
}
