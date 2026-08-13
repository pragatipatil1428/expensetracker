import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Compass className="h-7 w-7 text-primary" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
