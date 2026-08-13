import type { Metadata } from "next";

import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Deep-dive into your income, expenses, savings and categories.",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
