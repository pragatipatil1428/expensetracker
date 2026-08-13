import type { Metadata } from "next";

import { RecurringManager } from "@/components/recurring/recurring-manager";

export const metadata: Metadata = {
  title: "Recurring",
  description: "Manage recurring income and expenses.",
};

export default function RecurringPage() {
  return <RecurringManager />;
}
