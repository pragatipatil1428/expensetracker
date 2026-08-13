"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { formatCurrency } from "@/lib/format";

interface CategoryDonutProps {
  data: { name: string; color: string; value: number }[];
  currency: string;
  total: number;
}

const FALLBACK_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export function CategoryDonut({ data, currency, total }: CategoryDonutProps) {
  const chartData = data.map((entry, index) => ({
    ...entry,
    fill: entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-52 w-52 shrink-0" aria-label="Expense by category chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] text-muted-foreground">Total</p>
          <p className="text-lg font-bold tabular-nums">
            {formatCurrency(total, currency, { compact: true })}
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <ul className="w-full flex-1 space-y-2">
          {chartData.map((entry, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{entry.name}</span>
              <span className="font-medium tabular-nums">{formatCurrency(entry.value, currency)}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
