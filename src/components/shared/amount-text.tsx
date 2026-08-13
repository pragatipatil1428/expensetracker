import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AmountTextProps {
  amount: number;
  type: "INCOME" | "EXPENSE";
  currency: string;
  className?: string;
  sign?: boolean;
}

export function AmountText({ amount, type, currency, className, sign = true }: AmountTextProps) {
  const isIncome = type === "INCOME";
  const value = isIncome ? amount : -amount;
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        className,
      )}
    >
      {formatCurrency(value, currency, { signDisplay: sign ? "always" : "auto" })}
    </span>
  );
}
