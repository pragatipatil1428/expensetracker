import type { Metadata } from "next";

import { SettingsClient } from "@/components/settings/settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your appearance, currency, notifications, security and account.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
