"use client";

import { useAppStore } from "@/store/useAppStore";

export const CHART_SERIES = "#3b82f6";

export interface ChartTheme {
  tick: string;
  grid: string;
  series: string;
}

/** Axis/grid colors per theme — series blue passes ≥3:1 on both surfaces. */
export function useChartTheme(): ChartTheme {
  const theme = useAppStore((s) => s.settings.theme);
  return theme === "light"
    ? { tick: "#475569", grid: "#e2e8f0", series: CHART_SERIES }
    : { tick: "#94a3b8", grid: "#334155", series: CHART_SERIES };
}
