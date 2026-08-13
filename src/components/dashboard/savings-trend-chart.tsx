"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";

interface SavingsTrendChartProps {
  data: { label: string; savings: number }[];
  currency: string;
}

export function SavingsTrendChart({ data, currency }: SavingsTrendChartProps) {
  return (
    <div className="h-56 w-full" aria-label="Savings trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="savings-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value: number) =>
              new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)
            }
          />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="savings"
            name="Savings"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fill="url(#savings-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
