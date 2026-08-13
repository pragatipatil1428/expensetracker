import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your financial overview at a glance.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
