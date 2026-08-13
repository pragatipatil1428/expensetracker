import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your FinTrack account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground">
          This link is missing its reset token. Request a new one below.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
