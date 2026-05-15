import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),300px]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="hidden h-72 lg:block" />
      </div>
    </div>
  );
}
