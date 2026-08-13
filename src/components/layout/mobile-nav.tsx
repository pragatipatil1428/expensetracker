"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, ListOrdered, PiggyBank, Settings, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { useUiStore } from "@/stores/ui";
import { cn } from "@/lib/utils";

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, segment: "dashboard" },
  { href: "/transactions", label: "Activity", icon: ListOrdered, segment: "transactions" },
  { href: "/budgets", label: "Budgets", icon: PiggyBank, segment: "budgets" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, segment: "analytics" },
  { href: "/settings", label: "Settings", icon: Settings, segment: "settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-md lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNavSheet() {
  const pathname = usePathname();
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="left-0 top-0 h-full max-h-none w-72 max-w-[85vw] -translate-x-0 translate-y-0 rounded-none rounded-r-2xl p-0 data-[state=open]:animate-slide-in-right data-[state=open]:!translate-x-0 data-[state=open]:!translate-y-0">
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <div className="flex h-16 items-center justify-between border-b px-5">
          <span className="text-base font-bold tracking-tight">FinTrack</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Mobile menu">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-muted text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("h-4.5 w-4.5", isActive && "text-primary")}
                  aria-hidden
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
