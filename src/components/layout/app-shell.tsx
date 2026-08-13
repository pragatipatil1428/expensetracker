"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav, MobileNavSheet } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import type { UserDTO } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: UserDTO;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar user={user} />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Header user={user} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
      <MobileNavSheet />
      <CommandPalette />
    </div>
  );
}
