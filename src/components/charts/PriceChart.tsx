"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateShort, formatNumber } from "@/lib/format";
import { useChartTheme } from "./chart-theme";
import { ChartTooltipFrame } from "./ChartTooltip";

interface PriceChartProps {
  data: { date: string; price: number }[];
  currencySuffix: string;
}

export function PriceChart({ data, currencySuffix }: PriceChartProps) {
  const theme = useChartTheme();
  return (
    <div className="h-64" role="img" aria-label="Linjediagram över bränslepris per liter över tid">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fill: theme.tick, fontSize: 12 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: theme.tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={46}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            cursor={{ stroke: theme.tick, strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => (
              <ChartTooltipFrame
                active={active}
                label={typeof label === "string" ? formatDateShort(label) : undefined}
                rows={payload?.map((p) => ({
                  text: `${formatNumber(p.value as number, 2)} ${currencySuffix}/l`,
                }))}
              />
            )}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={theme.series}
            strokeWidth={2}
            dot={{ r: 4, fill: theme.series, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
