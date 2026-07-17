"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyAgg } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";
import { useChartTheme } from "./chart-theme";
import { ChartTooltipFrame } from "./ChartTooltip";

interface MonthlyBarChartProps {
  data: MonthlyAgg[];
  dataKey: "cost" | "distance" | "liters" | "avgConsumption";
  unit: string;
  decimals?: number;
  ariaLabel: string;
}

export function MonthlyBarChart({
  data,
  dataKey,
  unit,
  decimals = 0,
  ariaLabel,
}: MonthlyBarChartProps) {
  const theme = useChartTheme();
  return (
    <div className="h-64" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="25%">
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.tick, fontSize: 12 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: theme.tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={46}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            cursor={{ fill: theme.grid, opacity: 0.35 }}
            content={({ active, payload, label }) => (
              <ChartTooltipFrame
                active={active}
                label={typeof label === "string" ? label : undefined}
                rows={payload?.map((p) => ({
                  text: `${formatNumber((p.value as number) ?? 0, decimals)} ${unit}`,
                }))}
              />
            )}
          />
          <Bar
            dataKey={dataKey}
            fill={theme.series}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
