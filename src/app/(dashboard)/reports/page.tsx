import type { Metadata } from "next";

import { ReportsClient } from "@/components/reports/reports-client";

export const metadata: Metadata = {
  title: "Reports",
  description: "Generate monthly, yearly and category reports with CSV and PDF export.",
};

export default function ReportsPage() {
  return <ReportsClient />;
}
