import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-12" />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="mt-4 h-4 w-24" />
            <Skeleton className="mt-2 h-7 w-32" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-72 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mx-auto mt-6 h-52 w-52 rounded-full" />
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-56 w-full" />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
