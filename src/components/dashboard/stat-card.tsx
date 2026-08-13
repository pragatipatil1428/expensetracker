import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  change: number | null;
  changeLabel: string;
  positiveIsGood?: boolean;
  iconClassName?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  positiveIsGood = true,
  iconClassName,
}: StatCardProps) {
  const good = change !== null && (positiveIsGood ? change >= 0 : change <= 0);
  const neutral = change === null;

  return (
    <Card className="group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-[0.08] transition-opacity group-hover:opacity-[0.16]",
          good ? "from-emerald-500 to-teal-500" : "from-rose-500 to-orange-500",
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground",
            iconClassName,
          )}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            neutral
              ? "bg-muted text-muted-foreground"
              : good
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          )}
          title={changeLabel}
        >
          {neutral ? (
            <Minus className="h-3 w-3" aria-hidden />
          ) : change! >= 0 ? (
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          ) : (
            <ArrowDownRight className="h-3 w-3" aria-hidden />
          )}
          {change === null ? "—" : formatSignedPercent(Math.abs(change))}
        </span>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{changeLabel}</p>
    </Card>
  );
}
