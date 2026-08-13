import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getViewer } from "@/lib/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getViewer();
  if (!user) redirect("/login");

  return <AppShell user={user}>{children}</AppShell>;
}
