"use client";

import { formatCurrency } from "@/lib/format";

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  currency = "INR",
  formatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currency?: string;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2.5 text-sm shadow-xl">
      {label && <p className="mb-1.5 font-semibold">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = Number(entry.value ?? 0);
          const name = entry.name ?? "";
          return (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden
                />
                {name}
              </span>
              <span className="font-semibold tabular-nums">
                {formatter ? formatter(value, name) : formatCurrency(value, currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
