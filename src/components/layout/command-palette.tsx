"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import {
  CornerDownLeft,
  FileBarChart,
  ListOrdered,
  PiggyBank,
  Repeat,
  Search,
  Tags,
} from "lucide-react";


import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CategoryIcon } from "@/components/shared/category-icon";
import { searchAction } from "@/actions/search";
import { getMeAction } from "@/actions/dashboard";
import { useUiStore } from "@/stores/ui";
import { PAYMENT_METHOD_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await getMeAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
  const currency = me.data?.currency ?? "INR";

  const { data, isFetching } = useQuery({
    queryKey: ["command-search", query],
    queryFn: async () => {
      const result = await searchAction(query);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: open && query.trim().length > 0,
  });

  // Global keyboard shortcut: Cmd/Ctrl + K
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const close = () => setOpen(false);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const results = data;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) setQuery("");
      }}
    >
      <DialogContent className="top-[18%] max-w-xl translate-y-0 p-0 data-[state=open]:animate-slide-in-up data-[state=open]:!translate-y-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search transactions, categories, budgets and recurring transactions.
        </DialogDescription>

        <div className="flex items-center gap-3 border-b px-4 py-3.5">
          <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
            }}
            placeholder="Search transactions, categories, budgets…"
            className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search"
          />
          {isFetching && <Spinner className="h-4 w-4" />}
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Type to search across your finances
            </div>
          )}

          {query.trim() && !isFetching && results && (
            <div className="space-y-4">
              {results.transactions.length > 0 && (
                <SearchGroup label="Transactions">
                  {results.transactions.map((t) => {
                    const MethodIcon = PAYMENT_METHOD_ICONS[t.paymentMethod] ?? PAYMENT_METHOD_ICONS.OTHER;
                    return (
                      <button
                        key={t.id}
                        onClick={() => go(`/transactions?detail=${t.id}`)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                      >
                        <CategoryIcon icon={t.category.icon} color={t.category.color} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {t.description}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {t.category.name} · <MethodIcon className="inline h-3 w-3" aria-hidden />{" "}
                            {t.paymentMethod.replaceAll("_", " ").toLowerCase()}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            t.type === "INCOME"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {t.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(t.amount, currency, { maximumFractionDigits: 0 })}
                        </span>
                      </button>
                    );
                  })}
                </SearchGroup>
              )}

              {results.categories.length > 0 && (
                <SearchGroup label="Categories">
                  {results.categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => go("/categories")}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                      <span className="flex-1 text-sm font-medium">{c.name}</span>
                      <Tags className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    </button>
                  ))}
                </SearchGroup>
              )}

              {results.budgets.length > 0 && (
                <SearchGroup label="Budgets">
                  {results.budgets.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => go("/budgets")}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <PiggyBank className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="flex-1 text-sm font-medium">{b.name}</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(b.amount, currency)}
                      </span>
                    </button>
                  ))}
                </SearchGroup>
              )}

              {results.recurring.length > 0 && (
                <SearchGroup label="Recurring">
                  {results.recurring.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => go("/recurring")}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <CategoryIcon icon={r.category.icon} color={r.category.color} size="sm" />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{r.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {r.frequency.charAt(0) + r.frequency.slice(1).toLowerCase()}
                        </span>
                      </span>
                      <Repeat className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    </button>
                  ))}
                </SearchGroup>
              )}

              {results.transactions.length === 0 &&
                results.categories.length === 0 &&
                results.budgets.length === 0 &&
                results.recurring.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No results for “{query}”
                  </div>
                )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-1 border-t px-2 py-2 text-[11px] text-muted-foreground">
            <CornerDownLeft className="h-3 w-3" aria-hidden />
            Select · <FileBarChart className="ml-2 h-3 w-3" aria-hidden /> <ListOrdered className="ml-1 h-3 w-3" aria-hidden />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
