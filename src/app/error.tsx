"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. Try again, or head back to the dashboard.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
