import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-44" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-40" />
      <Skeleton className="h-32" />
    </div>
  );
}
