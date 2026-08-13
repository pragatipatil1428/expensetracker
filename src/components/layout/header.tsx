"use client";

import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { UserMenu } from "@/components/layout/user-menu";
import { useUiStore } from "@/stores/ui";
import type { UserDTO } from "@/lib/types";

export function Header({ user }: { user: UserDTO }) {
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>

      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-xs"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Search anything…</span>
        <span className="sm:hidden">Search</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <NotificationsDropdown />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
