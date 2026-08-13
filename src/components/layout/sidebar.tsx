"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiggyBank } from "lucide-react";
import { motion } from "framer-motion";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { UserAvatar } from "@/components/layout/user-avatar";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/lib/types";

export function Sidebar({ user }: { user: UserDTO }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <PiggyBank className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="text-base font-bold tracking-tight">FinTrack</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-muted"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  aria-hidden
                />
              )}
              <Icon
                className={cn(
                  "relative h-4.5 w-4.5 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-foreground",
                )}
                aria-hidden
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <UserAvatar name={user.name} image={user.image} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
