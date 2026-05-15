import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-44" />
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-48" />
    </div>
  );
}
